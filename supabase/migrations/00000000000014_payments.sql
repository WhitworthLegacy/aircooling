-- ============================================================
-- Migration 14: Payments table for finances page
-- ============================================================

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  quote_id uuid references quotes(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  amount numeric not null,
  payment_method text check (payment_method in ('cash', 'card', 'transfer', 'check')),
  status text not null default 'completed',
  client_name text,
  notes text
);

create index if not exists idx_payments_client on payments(client_id);
create index if not exists idx_payments_quote on payments(quote_id);
create index if not exists idx_payments_created on payments(created_at);
create index if not exists idx_payments_status on payments(status);

create trigger payments_updated_at
  before update on payments
  for each row execute function update_updated_at();

-- RLS: only admin / super_admin can manage payments
alter table payments enable row level security;

create policy "Admins can manage payments" on payments
  for all using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') in ('admin', 'super_admin')
  );
