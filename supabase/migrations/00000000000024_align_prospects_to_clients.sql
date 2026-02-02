-- ============================================================
-- Migration 24: Align prospects table columns with clients table
-- Standardize field names across both tables
-- ============================================================

-- Rename columns to match clients table structure
ALTER TABLE prospects RENAME COLUMN nom TO first_name;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS last_name text;

ALTER TABLE prospects RENAME COLUMN telephone TO phone;
ALTER TABLE prospects RENAME COLUMN adresse TO address_line1;
ALTER TABLE prospects RENAME COLUMN localite TO city;
ALTER TABLE prospects RENAME COLUMN code_postal TO postal_code;

-- Rename statut to crm_stage for consistency
ALTER TABLE prospects RENAME COLUMN statut TO crm_stage;

-- Rename notes_internes to notes
ALTER TABLE prospects RENAME COLUMN notes_internes TO notes;

-- Add missing columns from clients table
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS country text DEFAULT 'BE';
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS longitude numeric;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}';
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS language text DEFAULT 'fr';
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS phone_e164 text;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS whatsapp_optin boolean DEFAULT false;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS preferred_channel text DEFAULT 'phone';
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS checklists jsonb DEFAULT '{}';
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS workflow_state jsonb DEFAULT '{}';
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS system_type text;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS tracking_id serial;

-- Keep prospect-specific fields but rename for clarity
-- type_demande -> demand_type (already good name, but let's make it English)
ALTER TABLE prospects RENAME COLUMN type_demande TO demand_type;
ALTER TABLE prospects RENAME COLUMN description_demande TO demand_description;
ALTER TABLE prospects RENAME COLUMN marque_souhaitee TO preferred_brand;
ALTER TABLE prospects RENAME COLUMN nombre_unites TO unit_count;
ALTER TABLE prospects RENAME COLUMN visite_technique_date TO visit_date;
ALTER TABLE prospects RENAME COLUMN visite_technique_heure TO visit_time;
ALTER TABLE prospects RENAME COLUMN devis_montant_estimatif TO quote_estimated;
ALTER TABLE prospects RENAME COLUMN devis_montant_final TO quote_final;

-- Add is_prospect flag (always true for this table, for compatibility)
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS is_prospect boolean DEFAULT true;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_prospects_crm_stage ON prospects(crm_stage);
CREATE INDEX IF NOT EXISTS idx_prospects_tracking_id ON prospects(tracking_id);
CREATE INDEX IF NOT EXISTS idx_prospects_email ON prospects(email);
CREATE INDEX IF NOT EXISTS idx_prospects_phone ON prospects(phone);
