-- ============================================================
-- Migration 21: Add system_type column to clients table
-- Used by: CRM modal, client details, HVAC system tracking
-- ============================================================

-- Add system_type to track HVAC equipment type for each client
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS system_type text;

-- Add comment for documentation
COMMENT ON COLUMN public.clients.system_type IS 'Type of HVAC system: split, multi-split, gainable, cassette, etc.';

-- Create index for filtering by system type
CREATE INDEX IF NOT EXISTS idx_clients_system_type
ON public.clients (system_type)
WHERE system_type IS NOT NULL;
