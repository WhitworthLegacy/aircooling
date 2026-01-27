-- Base: Inventory tables
-- For CRM interventions, quotes, and shop

create table if not exists inventory_categories (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  name text not null,
  slug text not null unique,
  description text,
  parent_id uuid references inventory_categories(id) on delete set null,
  sort_order integer default 0,
  is_active boolean not null default true
);

create index if not exists idx_inventory_categories_slug on inventory_categories(slug);

create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Identification
  sku text unique,
  name text not null,
  description text,
  category_id uuid references inventory_categories(id) on delete set null,

  -- Type
  item_type text not null default 'part', -- part|labor|service|fee

  -- Prix
  cost_price numeric default 0,
  sell_price numeric not null default 0,
  currency text not null default 'EUR',

  -- Stock
  track_stock boolean not null default true,
  stock_qty integer not null default 0,
  stock_min integer default 0,
  stock_unit text default 'pcs',

  -- Fournisseur
  supplier text,
  supplier_ref text,

  -- Images
  image_url text,
  images text[] default '{}',

  -- Statut
  is_active boolean not null default true,
  is_new_part boolean not null default false
);

create index if not exists idx_inventory_items_sku on inventory_items(sku);
create index if not exists idx_inventory_items_category on inventory_items(category_id);
create index if not exists idx_inventory_items_type on inventory_items(item_type);
create index if not exists idx_inventory_items_active on inventory_items(is_active);

-- Full text search
create index if not exists idx_inventory_search on inventory_items
  using gin(to_tsvector('french', coalesce(name, '') || ' ' || coalesce(sku, '') || ' ' || coalesce(description, '')));

create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  inventory_item_id uuid not null references inventory_items(id) on delete cascade,

  -- Mouvement
  quantity integer not null,
  movement_type text not null, -- in|out|adjustment|return

  -- Référence (optionnel)
  reference_type text, -- order|intervention|quote|manual
  reference_id uuid,

  -- Notes
  notes text,
  created_by uuid references profiles(id) on delete set null
);

create index if not exists idx_stock_movements_item on stock_movements(inventory_item_id);
create index if not exists idx_stock_movements_created on stock_movements(created_at);

-- RLS
alter table inventory_categories enable row level security;
alter table inventory_items enable row level security;
alter table stock_movements enable row level security;

-- Staff can manage inventory
create policy "Staff can manage inventory_categories" on inventory_categories
  for all using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('staff', 'admin', 'super_admin')
    )
  );

create policy "Staff can manage inventory_items" on inventory_items
  for all using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('staff', 'admin', 'super_admin')
    )
  );

create policy "Staff can manage stock_movements" on stock_movements
  for all using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('staff', 'admin', 'super_admin')
    )
  );

-- Public can view active items (for shop)
create policy "Anyone can view active inventory" on inventory_items
  for select using (is_active = true);

-- Trigger
create trigger inventory_items_updated_at
  before update on inventory_items
  for each row execute function update_updated_at();
