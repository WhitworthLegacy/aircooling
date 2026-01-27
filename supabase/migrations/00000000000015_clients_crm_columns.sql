-- ============================================================
-- Migration 15: Add missing CRM columns to clients table
-- Used by: CRM board, booking API, interventions page
-- ============================================================

alter table clients add column if not exists crm_stage text default 'Nouveau';
alter table clients add column if not exists tracking_id serial;
alter table clients add column if not exists language text default 'fr';
alter table clients add column if not exists phone_e164 text;
alter table clients add column if not exists whatsapp_optin boolean default false;
alter table clients add column if not exists preferred_channel text default 'phone';
alter table clients add column if not exists checklists jsonb default '{}';
alter table clients add column if not exists workflow_state jsonb default '{}';
alter table clients add column if not exists selected_parts jsonb;

create index if not exists idx_clients_crm_stage on clients(crm_stage);
create index if not exists idx_clients_tracking_id on clients(tracking_id);
