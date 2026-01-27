-- Base: Clients table (CRM)
-- Required for most features

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Info contact
  first_name text not null,
  last_name text not null,
  email text,
  phone text,

  -- Adresse
  address_line1 text,
  address_line2 text,
  city text,
  postal_code text,
  country text default 'BE',

  -- Coordonnées GPS (pour services à domicile)
  latitude numeric,
  longitude numeric,

  -- Notes et tags
  notes text,
  tags text[] default '{}',

  -- Photos (pour context visuel)
  photos text[] default '{}',

  -- Liaison avec un user Supabase (optionnel)
  user_id uuid references auth.users(id) on delete set null,

  -- Métadonnées
  source text, -- website|referral|social|other
  is_active boolean not null default true
);

-- Index
create index if not exists idx_clients_email on clients(email);
create index if not exists idx_clients_phone on clients(phone);
create index if not exists idx_clients_user_id on clients(user_id);
create index if not exists idx_clients_city on clients(city);

-- Full text search
create index if not exists idx_clients_search on clients
  using gin(to_tsvector('french', coalesce(first_name, '') || ' ' || coalesce(last_name, '') || ' ' || coalesce(email, '')));

-- RLS
alter table clients enable row level security;

-- Policy: staff peuvent voir tous les clients
create policy "Staff can view all clients" on clients
  for select using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('staff', 'admin', 'super_admin')
    )
  );

-- Policy: staff peuvent gérer les clients
create policy "Staff can manage clients" on clients
  for all using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('staff', 'admin', 'super_admin')
    )
  );

-- Policy: clients peuvent voir leur propre fiche
create policy "Users can view own client record" on clients
  for select using (user_id = auth.uid());

-- Trigger updated_at
create trigger clients_updated_at
  before update on clients
  for each row execute function update_updated_at();
