-- Base: Profiles table (extends Supabase auth.users)
-- Required for all projects

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  email text not null,
  full_name text,
  avatar_url text,
  phone text,

  role text not null default 'user', -- user|staff|admin|super_admin
  is_active boolean not null default true
);

-- Index pour recherche rapide
create index if not exists idx_profiles_email on profiles(email);
create index if not exists idx_profiles_role on profiles(role);

-- RLS
alter table profiles enable row level security;

-- Policy: les users peuvent voir leur propre profil
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

-- Policy: les users peuvent mettre à jour leur propre profil
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Policy: staff/admin peuvent voir tous les profils
create policy "Staff can view all profiles" on profiles
  for select using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('staff', 'admin', 'super_admin')
    )
  );

-- Trigger pour créer un profil automatiquement
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger sur auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger pour updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();
