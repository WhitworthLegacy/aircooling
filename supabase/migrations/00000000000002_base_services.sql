-- Base: Services & Booking tables
-- For booking feature

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  name text not null,
  slug text not null unique,
  description text,

  -- Durée et prix
  duration_minutes integer not null default 60,
  price numeric not null default 0,
  currency text not null default 'EUR',

  -- Affichage
  icon text,
  color text,
  sort_order integer default 0,

  -- Statut
  is_active boolean not null default true,
  is_featured boolean not null default false
);

create index if not exists idx_services_slug on services(slug);
create index if not exists idx_services_is_active on services(is_active);

create table if not exists availability_slots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Jour et heure
  day_of_week integer not null, -- 0=dimanche, 1=lundi, etc.
  start_time time not null,
  end_time time not null,

  -- Optionnel: lié à un staff spécifique
  staff_id uuid references profiles(id) on delete cascade,

  is_active boolean not null default true,

  constraint valid_day check (day_of_week between 0 and 6),
  constraint valid_times check (start_time < end_time)
);

create index if not exists idx_availability_day on availability_slots(day_of_week);
create index if not exists idx_availability_staff on availability_slots(staff_id);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Client
  client_id uuid references clients(id) on delete set null,

  -- Service
  service_id uuid references services(id) on delete set null,

  -- Date et heure
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 60,

  -- Statut
  status text not null default 'pending', -- pending|confirmed|completed|cancelled|no_show

  -- Notes
  notes text,
  internal_notes text,

  -- Adresse (si service à domicile)
  address text,
  latitude numeric,
  longitude numeric,

  -- Prix
  price numeric,
  currency text default 'EUR',

  -- Rappels
  reminder_sent boolean default false,
  confirmation_sent boolean default false
);

create index if not exists idx_bookings_scheduled_at on bookings(scheduled_at);
create index if not exists idx_bookings_status on bookings(status);
create index if not exists idx_bookings_client_id on bookings(client_id);

-- RLS
alter table services enable row level security;
alter table availability_slots enable row level security;
alter table bookings enable row level security;

-- Services: public read, staff write
create policy "Anyone can view active services" on services
  for select using (is_active = true);

create policy "Staff can manage services" on services
  for all using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('staff', 'admin', 'super_admin')
    )
  );

-- Availability: public read, staff write
create policy "Anyone can view availability" on availability_slots
  for select using (is_active = true);

create policy "Staff can manage availability" on availability_slots
  for all using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('staff', 'admin', 'super_admin')
    )
  );

-- Bookings: staff manage all, clients see own
create policy "Staff can manage bookings" on bookings
  for all using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('staff', 'admin', 'super_admin')
    )
  );

create policy "Clients can view own bookings" on bookings
  for select using (
    client_id in (
      select id from clients where user_id = auth.uid()
    )
  );

-- Triggers
create trigger services_updated_at
  before update on services
  for each row execute function update_updated_at();

create trigger bookings_updated_at
  before update on bookings
  for each row execute function update_updated_at();
