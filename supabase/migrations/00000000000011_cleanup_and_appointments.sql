-- ============================================================
-- Cleanup: drop unused template tables + create appointments
-- ============================================================

-- 1. Drop ALL RLS policies first (they reference columns/tables we're dropping)
-- ─────────────────────────────────────────────────────────────────────────

drop policy if exists "Staff can manage quotes" on quotes;
drop policy if exists "Clients can view own quotes" on quotes;
drop policy if exists "Staff can manage quote_items" on quote_items;
drop policy if exists "Staff can manage prospects" on prospects;
drop policy if exists "Staff can manage notification_templates" on notification_templates;
drop policy if exists "Staff can manage notifications" on notifications;
drop policy if exists "Staff can manage conversations" on conversations;
drop policy if exists "Staff can manage conversation_messages" on conversation_messages;
drop policy if exists "Staff can manage documents" on storage.objects;

-- 2. Drop FK constraints and columns on KEPT tables
-- ─────────────────────────────────────────────────────────────────────────

-- quotes.intervention_id -> interventions (dropping)
alter table quotes drop constraint if exists quotes_intervention_id_fkey;
alter table quotes drop column if exists intervention_id;

-- quote_items.inventory_item_id -> inventory_items (dropping)
alter table quote_items drop constraint if exists quote_items_inventory_item_id_fkey;
alter table quote_items drop column if exists inventory_item_id;

-- notifications.template_id -> notification_templates (dropping)
alter table notifications drop constraint if exists notifications_template_id_fkey;
alter table notifications drop column if exists template_id;

-- prospects.technicien_assigne -> profiles (dropping)
alter table prospects drop constraint if exists prospects_technicien_assigne_fkey;
alter table prospects drop column if exists technicien_assigne;

-- 3. Drop triggers on tables we're removing
-- ─────────────────────────────────────────────────────────────────────────

drop trigger if exists notification_templates_updated_at on notification_templates;
drop trigger if exists conversations_updated_at on conversations;

-- 4. Drop unused tables (order respects FK dependencies)
-- ─────────────────────────────────────────────────────────────────────────

-- Conversations
drop table if exists conversation_messages cascade;
drop table if exists conversations cascade;

-- Notification templates (notifications table KEPT, just template reference removed)
drop table if exists notification_templates cascade;

-- Interventions & inventory
drop table if exists intervention_items cascade;
drop table if exists interventions cascade;
drop table if exists stock_movements cascade;
drop table if exists inventory_items cascade;
drop table if exists inventory_categories cascade;

-- Services (template)
drop table if exists bookings cascade;
drop table if exists availability_slots cascade;
drop table if exists services cascade;

-- Blog (content is in static JS)
drop table if exists blog_posts cascade;
drop table if exists blog_categories cascade;

-- Profiles (auth extension, not used)
drop table if exists profiles cascade;

-- Drop orphaned functions
drop function if exists recalculate_quote_totals() cascade;

-- 5. Drop unused indexes
-- ─────────────────────────────────────────────────────────────────────────

drop index if exists idx_quotes_intervention;

-- 6. Create appointments table (used by booking API but was missing)
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Client
  client_id uuid references clients(id) on delete set null,
  customer_name text,
  customer_phone text,

  -- Service
  service_type text not null, -- installation | entretien | depannage | diagnostic

  -- Planning
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 90,

  -- Lieu
  address text,

  -- Statut
  status text not null default 'pending', -- pending | confirmed | completed | cancelled

  -- Notes
  notes text
);

create index if not exists idx_appointments_client on appointments(client_id);
create index if not exists idx_appointments_scheduled on appointments(scheduled_at);
create index if not exists idx_appointments_status on appointments(status);

-- Trigger updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger appointments_updated_at
  before update on appointments
  for each row execute function update_updated_at();
