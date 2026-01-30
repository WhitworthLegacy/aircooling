-- Migration: Add missing columns for BON d'intervention and Plan drawing
-- Date: 2025-01-29

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. PROSPECTS: Add missing columns for enhanced workflow
-- ═══════════════════════════════════════════════════════════════════════════════

alter table prospects add column if not exists date_prospect date default current_date;
alter table prospects add column if not exists photos_url text;
alter table prospects add column if not exists video_url text;
alter table prospects add column if not exists signature_acceptation_url text;
alter table prospects add column if not exists bon_lie_id text; -- BON-... reference

-- Rename plan_croquis_url to plan_image_url for consistency
alter table prospects rename column plan_croquis_url to plan_image_url;

comment on column prospects.plan_image_url is 'URL of the plan drawing image (PNG)';
comment on column prospects.photos_url is 'URL to photos (Drive, WeTransfer, etc.)';
comment on column prospects.video_url is 'URL to video';
comment on column prospects.signature_acceptation_url is 'URL to acceptance signature';
comment on column prospects.bon_lie_id is 'Reference to associated BON (if converted)';

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. INTERVENTIONS: Add BON-specific columns
-- ═══════════════════════════════════════════════════════════════════════════════

-- BON identification
alter table interventions add column if not exists bon_n text unique;

-- Client info (denormalized for BON - can differ from main client)
alter table interventions add column if not exists client_nom text;
alter table interventions add column if not exists client_tva text;
alter table interventions add column if not exists email text;
alter table interventions add column if not exists telephone text;
alter table interventions add column if not exists client_adresse text;
alter table interventions add column if not exists client_localite text;

-- Responsable (if different from main client)
alter table interventions add column if not exists resp_nom text;
alter table interventions add column if not exists resp_adresse text;
alter table interventions add column if not exists resp_localite text;
alter table interventions add column if not exists resp_tva text;

-- Intervention details
alter table interventions add column if not exists technicien_nom text;
alter table interventions add column if not exists date_intervention date;
alter table interventions add column if not exists type_intervention text; -- Entretien|Depannage|Installation
alter table interventions add column if not exists heure_debut time;
alter table interventions add column if not exists heure_fin time;

-- Work details
alter table interventions add column if not exists travaux_realises text;
alter table interventions add column if not exists fournitures text;

-- Financial
alter table interventions add column if not exists total_ht numeric;
alter table interventions add column if not exists tva_eur numeric;
alter table interventions add column if not exists total_ttc numeric;
alter table interventions add column if not exists acompte numeric;
alter table interventions add column if not exists mode_paiement text; -- Cash|Virement

-- Signatures
alter table interventions add column if not exists signature_tech_url text;
alter table interventions add column if not exists signature_client_url text;

-- Status for BON workflow
alter table interventions add column if not exists statut text default 'Nouveau';
-- Nouveau | En cours | Terminé | Payé

-- Index for BON lookup
create index if not exists idx_interventions_bon_n on interventions(bon_n);
create index if not exists idx_interventions_date on interventions(date_intervention);
create index if not exists idx_interventions_statut on interventions(statut);

-- Comments
comment on column interventions.bon_n is 'Unique BON number (e.g., 2025-10-24)';
comment on column interventions.client_nom is 'Client name (denormalized from form)';
comment on column interventions.type_intervention is 'Type: Entretien, Depannage, or Installation';
comment on column interventions.travaux_realises is 'Description of work performed';
comment on column interventions.fournitures is 'Supplies/materials used';
comment on column interventions.signature_tech_url is 'URL to technician signature image';
comment on column interventions.signature_client_url is 'URL to client signature image';

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. Make client_id nullable (since BON can exist without a linked client)
-- ═══════════════════════════════════════════════════════════════════════════════

alter table interventions alter column client_id drop not null;

comment on table interventions is 'Interventions and BON d''intervention (work orders)';
