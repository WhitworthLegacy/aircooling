-- Migration: Annual Maintenance Reminder System
-- Adds fields to track maintenance cycles and reminder status

-- Add maintenance tracking fields to clients
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS last_intervention_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS is_annual_maintenance boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_sent_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS reminder_token text,
ADD COLUMN IF NOT EXISTS reminder_response text; -- 'accepted', 'declined', 'no_response'

-- Create index for efficient M+9 queries
CREATE INDEX IF NOT EXISTS idx_clients_last_intervention
ON public.clients (last_intervention_date)
WHERE last_intervention_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clients_reminder_token
ON public.clients (reminder_token)
WHERE reminder_token IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.clients.last_intervention_date IS 'Date of the last completed intervention';
COMMENT ON COLUMN public.clients.is_annual_maintenance IS 'True if current visit is for annual maintenance (vs new client)';
COMMENT ON COLUMN public.clients.reminder_sent_at IS 'When the M+9 reminder email was sent';
COMMENT ON COLUMN public.clients.reminder_token IS 'Unique token for email response tracking';
COMMENT ON COLUMN public.clients.reminder_response IS 'Client response: accepted, declined, or no_response';
