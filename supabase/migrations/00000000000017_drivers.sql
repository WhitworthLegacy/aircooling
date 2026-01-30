-- Migration 17: Drivers table and appointments.driver_id column
-- For assigning drivers/technicians to delivery/pickup appointments

-- Create drivers table
create table if not exists drivers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add driver_id to appointments
alter table appointments add column if not exists driver_id uuid references drivers(id) on delete set null;
alter table appointments add column if not exists driver_name text;

-- Index for active drivers
create index if not exists idx_drivers_active on drivers(is_active) where is_active = true;

-- Index for appointments by driver
create index if not exists idx_appointments_driver on appointments(driver_id) where driver_id is not null;

-- Trigger for updated_at
create or replace function update_drivers_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists drivers_updated_at on drivers;
create trigger drivers_updated_at
  before update on drivers
  for each row execute function update_drivers_updated_at();

-- RLS
alter table drivers enable row level security;

-- Policy: admin/super_admin can do everything
create policy "Admin full access to drivers"
  on drivers for all
  using (
    auth.jwt() ->> 'role' in ('admin', 'super_admin')
    or auth.jwt() -> 'user_metadata' ->> 'role' in ('admin', 'super_admin')
  )
  with check (
    auth.jwt() ->> 'role' in ('admin', 'super_admin')
    or auth.jwt() -> 'user_metadata' ->> 'role' in ('admin', 'super_admin')
  );

-- Policy: staff/technicien can read active drivers
create policy "Staff can read active drivers"
  on drivers for select
  using (
    is_active = true
    and (
      auth.jwt() ->> 'role' in ('staff', 'technicien', 'admin', 'super_admin')
      or auth.jwt() -> 'user_metadata' ->> 'role' in ('staff', 'technicien', 'admin', 'super_admin')
    )
  );
