-- ============================================================
-- Migration 23: Add prospect flag and client type to clients table
-- Allows prospects to appear in CRM with "Prospect" badge
-- Also captures client type (Particulier/Professionnel) and VAT number
-- ============================================================

-- Flag to identify clients who came from prospect form
alter table clients add column if not exists is_prospect boolean default false;

-- Reference to original prospect record (for history/audit)
alter table clients add column if not exists prospect_id uuid references prospects(id) on delete set null;

-- Type of request from prospect form (e.g., "Installation", "Entretien")
alter table clients add column if not exists demand_type text;

-- Client type: Particulier or Professionnel
alter table clients add column if not exists type_client text default 'Particulier';

-- VAT number for professional clients
alter table clients add column if not exists tva text;

-- Index for filtering prospects in CRM
create index if not exists idx_clients_is_prospect on clients(is_prospect);
create index if not exists idx_clients_type_client on clients(type_client);
