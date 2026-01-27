-- Quotes tables
-- For quote/estimate management

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Lien avec intervention (optionnel pour quote standalone)
  intervention_id uuid unique references interventions(id) on delete cascade,

  -- Ou lien direct avec client
  client_id uuid references clients(id) on delete set null,

  -- Statut
  status text not null default 'draft', -- draft|sent|accepted|rejected|expired

  -- Montants
  currency text not null default 'EUR',
  labor_total numeric not null default 0,
  parts_total numeric not null default 0,
  discount numeric not null default 0,
  tax_rate numeric not null default 21, -- TVA en %
  tax_amount numeric not null default 0,
  total numeric not null default 0,

  -- Dates
  sent_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  expires_at timestamptz,

  -- Document
  pdf_url text,
  quote_number text,

  -- Notes
  notes text, -- visible au client
  internal_notes text -- interne
);

create index if not exists idx_quotes_intervention on quotes(intervention_id);
create index if not exists idx_quotes_client on quotes(client_id);
create index if not exists idx_quotes_status on quotes(status);

create table if not exists quote_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  quote_id uuid not null references quotes(id) on delete cascade,

  -- Type d'item
  kind text not null, -- labor|part|fee|discount

  -- Lien optionnel avec inventaire
  inventory_item_id uuid references inventory_items(id) on delete set null,

  -- Détails
  label text not null,
  description text,
  quantity integer not null default 1,
  unit_price numeric not null default 0,
  line_total numeric not null default 0,

  -- Ordre d'affichage
  sort_order integer default 0
);

create index if not exists idx_quote_items_quote on quote_items(quote_id);

-- RLS
alter table quotes enable row level security;
alter table quote_items enable row level security;

create policy "Staff can manage quotes" on quotes
  for all using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('staff', 'admin', 'super_admin')
    )
  );

create policy "Clients can view own quotes" on quotes
  for select using (
    client_id in (select id from clients where user_id = auth.uid())
    or intervention_id in (
      select i.id from interventions i
      join clients c on c.id = i.client_id
      where c.user_id = auth.uid()
    )
  );

create policy "Staff can manage quote_items" on quote_items
  for all using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('staff', 'admin', 'super_admin')
    )
  );

-- Trigger pour recalculer les totaux
create or replace function recalculate_quote_totals()
returns trigger as $$
begin
  update quotes set
    labor_total = coalesce((select sum(line_total) from quote_items where quote_id = new.quote_id and kind = 'labor'), 0),
    parts_total = coalesce((select sum(line_total) from quote_items where quote_id = new.quote_id and kind = 'part'), 0),
    discount = coalesce((select sum(abs(line_total)) from quote_items where quote_id = new.quote_id and kind = 'discount'), 0),
    total = coalesce((select sum(case when kind = 'discount' then -abs(line_total) else line_total end) from quote_items where quote_id = new.quote_id), 0),
    updated_at = now()
  where id = new.quote_id;
  return new;
end;
$$ language plpgsql;

create trigger quote_items_recalc
  after insert or update or delete on quote_items
  for each row execute function recalculate_quote_totals();

create trigger quotes_updated_at
  before update on quotes
  for each row execute function update_updated_at();
