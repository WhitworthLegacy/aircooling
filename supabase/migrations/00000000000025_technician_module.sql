-- ============================================================
-- Migration 25: Technician module
-- Adds technician_id to appointments + tech_reports tables
-- ============================================================

-- 1. Add technician_id to appointments
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS technician_id UUID;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_appointments_technician ON appointments(technician_id);

-- 2. Create tech_reports table (links visits to quotes)
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tech_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Links
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  technician_id UUID NOT NULL,

  -- Report data
  plan_image_url TEXT,
  estimated_hours DECIMAL(5,2) NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 65.00,
  notes TEXT,

  -- Signature
  signature_image_url TEXT,
  signed_at TIMESTAMPTZ,

  -- Generated quote
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' -- draft | signed | quote_sent
);

CREATE INDEX IF NOT EXISTS idx_tech_reports_client ON tech_reports(client_id);
CREATE INDEX IF NOT EXISTS idx_tech_reports_technician ON tech_reports(technician_id);
CREATE INDEX IF NOT EXISTS idx_tech_reports_appointment ON tech_reports(appointment_id);
CREATE INDEX IF NOT EXISTS idx_tech_reports_status ON tech_reports(status);

-- updated_at trigger
CREATE TRIGGER tech_reports_updated_at
  BEFORE UPDATE ON tech_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. Create tech_report_items table (parts selected by technician)
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tech_report_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  report_id UUID NOT NULL REFERENCES tech_reports(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL -- snapshot of price at time of report
);

CREATE INDEX IF NOT EXISTS idx_tech_report_items_report ON tech_report_items(report_id);
CREATE INDEX IF NOT EXISTS idx_tech_report_items_item ON tech_report_items(inventory_item_id);

-- 4. RLS Policies
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE tech_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE tech_report_items ENABLE ROW LEVEL SECURITY;

-- Technicians can manage their own reports
CREATE POLICY "tech_reports_own" ON tech_reports
  FOR ALL USING (
    technician_id::text = coalesce(auth.jwt() ->> 'sub', '')
  );

-- Admins can manage all reports
CREATE POLICY "tech_reports_admin" ON tech_reports
  FOR ALL USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'super_admin')
  );

-- Tech report items follow parent report access
CREATE POLICY "tech_report_items_own" ON tech_report_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tech_reports
      WHERE id = report_id
      AND technician_id::text = coalesce(auth.jwt() ->> 'sub', '')
    )
  );

CREATE POLICY "tech_report_items_admin" ON tech_report_items
  FOR ALL USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'super_admin')
  );

-- 5. Helper view for technician appointments with client info
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW tech_appointments_view AS
SELECT
  a.id,
  a.created_at,
  a.scheduled_at,
  a.duration_minutes,
  a.service_type,
  a.status,
  a.address,
  a.notes,
  a.technician_id,
  a.client_id,
  c.first_name AS client_first_name,
  c.last_name AS client_last_name,
  c.phone AS client_phone,
  c.email AS client_email,
  c.city AS client_city
FROM appointments a
LEFT JOIN clients c ON c.id = a.client_id;
