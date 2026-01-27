-- ============================================================
-- Migration 13: Recreate inventory tables for admin app
-- Tables dropped in migration 11, recreated with admin-app schema
-- ============================================================

-- inventory_items: tracks parts/products in stock
create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  reference text,
  category text,
  supplier_name text,
  quantity integer not null default 0,
  min_threshold integer not null default 5,
  price_buy numeric,
  price_sell numeric,
  is_active boolean not null default true
);

create index if not exists idx_inventory_items_name on inventory_items(name);
create index if not exists idx_inventory_items_reference on inventory_items(reference);
create index if not exists idx_inventory_items_active on inventory_items(is_active);
create index if not exists idx_inventory_search on inventory_items
  using gin(to_tsvector('french', coalesce(name, '') || ' ' || coalesce(reference, '')));

create trigger inventory_items_updated_at
  before update on inventory_items
  for each row execute function update_updated_at();

-- stock_movements: tracks IN/OUT movements
create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  inventory_item_id uuid not null references inventory_items(id) on delete cascade,
  type text not null,
  quantity integer not null,
  related_client_name text,
  technician_name text,
  notes text
);

create index if not exists idx_stock_movements_item on stock_movements(inventory_item_id);
create index if not exists idx_stock_movements_created on stock_movements(created_at);

-- products: e-commerce product link (used by inventory page for cover images)
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  inventory_item_id uuid references inventory_items(id) on delete cascade,
  title text,
  slug text,
  cover_image_url text
);

create index if not exists idx_products_inventory_item on products(inventory_item_id);
create index if not exists idx_products_slug on products(slug);

-- RLS: inventory page uses browser client, so RLS is required
-- Pattern: auth.jwt() -> 'user_metadata' ->> 'role' (no profiles table)
alter table inventory_items enable row level security;
alter table stock_movements enable row level security;
alter table products enable row level security;

create policy "Staff can manage inventory_items" on inventory_items
  for all using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') in ('staff', 'admin', 'super_admin', 'technicien')
  );

create policy "Staff can manage stock_movements" on stock_movements
  for all using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') in ('staff', 'admin', 'super_admin', 'technicien')
  );

create policy "Staff can manage products" on products
  for all using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') in ('staff', 'admin', 'super_admin', 'technicien')
  );

create policy "Anyone can view active inventory" on inventory_items
  for select using (is_active = true);
