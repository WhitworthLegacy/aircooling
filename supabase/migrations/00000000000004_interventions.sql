-- CRM: Interventions table
-- For service businesses (repairs, installations, etc.)

create table if not exists interventions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Client
  client_id uuid not null references clients(id) on delete cascade,

  -- Dates
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,

  -- Statut
  status text not null default 'new',
  -- new|scheduled|in_progress|pending_quote|quote_sent|quote_accepted|
  -- quote_rejected|completed|cancelled|paid

  -- Description
  title text,
  description text,
  internal_notes text,

  -- Adresse (peut différer du client)
  address text,
  city text,
  postal_code text,
  latitude numeric,
  longitude numeric,

  -- Équipement
  equipment_type text,
  equipment_brand text,
  equipment_model text,

  -- Photos avant/après
  photos_before text[] default '{}',
  photos_after text[] default '{}',

  -- Devis & paiement
  quote_amount numeric,
  final_amount numeric,
  payment_status text default 'unpaid', -- unpaid|partial|paid

  -- Assignation
  assigned_to uuid references profiles(id) on delete set null,

  -- Priorité
  priority text default 'normal', -- low|normal|high|urgent

  -- Source
  source text -- website|phone|referral|booking
);

create index if not exists idx_interventions_client on interventions(client_id);
create index if not exists idx_interventions_status on interventions(status);
create index if not exists idx_interventions_scheduled on interventions(scheduled_at);
create index if not exists idx_interventions_assigned on interventions(assigned_to);

-- Items d'intervention (pièces utilisées)
create table if not exists intervention_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  intervention_id uuid not null references interventions(id) on delete cascade,
  inventory_item_id uuid references inventory_items(id) on delete set null,

  -- Détails
  label text not null,
  quantity integer not null default 1,
  unit_price numeric not null default 0,
  line_total numeric not null default 0,

  -- Type
  item_type text default 'part' -- part|labor|fee
);

create index if not exists idx_intervention_items_intervention on intervention_items(intervention_id);

-- RLS
alter table interventions enable row level security;
alter table intervention_items enable row level security;

create policy "Staff can manage interventions" on interventions
  for all using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('staff', 'admin', 'super_admin')
    )
  );

create policy "Clients can view own interventions" on interventions
  for select using (
    client_id in (select id from clients where user_id = auth.uid())
  );

create policy "Staff can manage intervention_items" on intervention_items
  for all using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('staff', 'admin', 'super_admin')
    )
  );

-- Trigger
create trigger interventions_updated_at
  before update on interventions
  for each row execute function update_updated_at();
