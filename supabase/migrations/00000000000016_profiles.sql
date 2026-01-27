-- ============================================================
-- Migration 16: Profiles table for role management
-- Synced with auth.users via trigger
-- ============================================================

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email text,
  full_name text,
  avatar_url text,
  phone text,
  role text not null default 'technicien'
    check (role in ('technicien', 'staff', 'admin', 'super_admin')),
  is_active boolean not null default true
);

create index if not exists idx_profiles_email on profiles(email);
create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_profiles_active on profiles(is_active);

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- Auto-create profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'technicien')
  )
  on conflict (id) do update set
    email = excluded.email,
    role = excluded.role,
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Sync profile when user_metadata is updated (role change via admin)
create or replace function public.handle_user_updated()
returns trigger as $$
begin
  update public.profiles set
    email = new.email,
    role = coalesce(new.raw_user_meta_data ->> 'role', role),
    full_name = coalesce(new.raw_user_meta_data ->> 'full_name', full_name),
    updated_at = now()
  where id = new.id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_updated
  after update on auth.users
  for each row execute function public.handle_user_updated();

-- Seed profiles for existing auth.users
insert into profiles (id, email, full_name, role)
select
  id,
  email,
  coalesce(raw_user_meta_data ->> 'full_name', ''),
  coalesce(raw_user_meta_data ->> 'role', 'technicien')
from auth.users
on conflict (id) do nothing;

-- RLS
alter table profiles enable row level security;

-- Users can read their own profile
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

-- Staff/admin can view all profiles
create policy "Staff can view all profiles" on profiles
  for select using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') in ('staff', 'admin', 'super_admin')
  );

-- Only super_admin can update profiles
create policy "Super admin can manage profiles" on profiles
  for all using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'super_admin'
  );
