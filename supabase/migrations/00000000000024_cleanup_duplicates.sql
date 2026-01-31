-- ============================================================
-- Migration 24: Cleanup Duplicates & Unify Schema
-- Removes duplicate columns and adds missing ones
-- ============================================================

-- =====================================================
-- 0. DROP DEPENDENT VIEWS FIRST
-- =====================================================
DROP VIEW IF EXISTS stock_movements_detailed CASCADE;
DROP VIEW IF EXISTS inventory_with_products CASCADE;

-- =====================================================
-- 1. STOCK_MOVEMENTS: Migrate item_id -> inventory_item_id
-- =====================================================

-- First, copy any data from item_id to inventory_item_id where inventory_item_id is null
UPDATE stock_movements
SET inventory_item_id = item_id
WHERE inventory_item_id IS NULL AND item_id IS NOT NULL;

-- Now drop the duplicate column item_id
ALTER TABLE stock_movements DROP COLUMN IF EXISTS item_id CASCADE;

-- Make inventory_item_id NOT NULL (required)
-- First, delete orphan records that have no inventory_item_id
DELETE FROM stock_movements WHERE inventory_item_id IS NULL;

-- Now make it NOT NULL
ALTER TABLE stock_movements ALTER COLUMN inventory_item_id SET NOT NULL;

-- Add foreign key constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stock_movements_inventory_item_id_fkey'
  ) THEN
    ALTER TABLE stock_movements
    ADD CONSTRAINT stock_movements_inventory_item_id_fkey
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE;
  END IF;
END $$;

-- =====================================================
-- 2. INVENTORY_ITEMS: Add missing columns
-- =====================================================

-- Add item_type column (part, labor, fee, service)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'item_type'
  ) THEN
    ALTER TABLE inventory_items ADD COLUMN item_type text DEFAULT 'part';
    COMMENT ON COLUMN inventory_items.item_type IS 'Type: part, labor, fee, service';
  END IF;
END $$;

-- Add description column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'description'
  ) THEN
    ALTER TABLE inventory_items ADD COLUMN description text;
  END IF;
END $$;

-- Add category column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'category'
  ) THEN
    ALTER TABLE inventory_items ADD COLUMN category text;
  END IF;
END $$;

-- Add supplier_ref column (supplier's reference number)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'supplier_ref'
  ) THEN
    ALTER TABLE inventory_items ADD COLUMN supplier_ref text;
  END IF;
END $$;

-- Add is_active column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE inventory_items ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Add updated_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE inventory_items ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- =====================================================
-- 3. Create updated_at trigger function if not exists
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to inventory_items
DROP TRIGGER IF EXISTS inventory_items_updated_at ON inventory_items;
CREATE TRIGGER inventory_items_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 4. Add unique constraint on reference if not exists
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inventory_items_reference_key'
  ) THEN
    -- Only add if no duplicates exist
    IF NOT EXISTS (
      SELECT reference FROM inventory_items
      WHERE reference IS NOT NULL
      GROUP BY reference HAVING COUNT(*) > 1
    ) THEN
      ALTER TABLE inventory_items ADD CONSTRAINT inventory_items_reference_key UNIQUE (reference);
    END IF;
  END IF;
END $$;

-- =====================================================
-- 5. Add indexes for new columns
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_inventory_items_item_type ON inventory_items(item_type);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_is_active ON inventory_items(is_active);
CREATE INDEX IF NOT EXISTS idx_stock_movements_inventory_item ON stock_movements(inventory_item_id);

-- =====================================================
-- 6. QUOTES: Add missing columns for parts selection
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'selected_parts'
  ) THEN
    ALTER TABLE quotes ADD COLUMN selected_parts jsonb DEFAULT '[]'::jsonb;
    COMMENT ON COLUMN quotes.selected_parts IS 'JSON array of selected inventory items for this quote';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'labor_type'
  ) THEN
    ALTER TABLE quotes ADD COLUMN labor_type text DEFAULT 'installation';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'labor_hours'
  ) THEN
    ALTER TABLE quotes ADD COLUMN labor_hours numeric DEFAULT 0;
  END IF;
END $$;

-- =====================================================
-- 7. RECREATE VIEWS (dropped at start of migration)
-- =====================================================

-- View: Inventory with product info
CREATE OR REPLACE VIEW inventory_with_products AS
SELECT
  ii.*,
  p.id as product_id,
  p.slug as product_slug,
  p.is_published as product_published,
  COALESCE(ii.image_url, p.cover_image_url) as display_image_url
FROM inventory_items ii
LEFT JOIN products p ON p.inventory_item_id = ii.id;

-- View: Stock movements with item details (FIXED: no item_id)
CREATE OR REPLACE VIEW stock_movements_detailed AS
SELECT
  sm.id,
  sm.created_at,
  sm.inventory_item_id,
  sm.type,
  sm.quantity,
  sm.related_client_name,
  sm.technician_name,
  sm.client_id,
  sm.intervention_id,
  sm.tech_id,
  sm.notes,
  ii.name as item_name,
  ii.reference as item_reference,
  ii.quantity as current_quantity
FROM stock_movements sm
JOIN inventory_items ii ON ii.id = sm.inventory_item_id
ORDER BY sm.created_at DESC;

-- =====================================================
-- FINAL SCHEMA SUMMARY
-- =====================================================
--
-- inventory_items:
--   id, created_at, updated_at, name, reference, description,
--   item_type, category, supplier_name, supplier_ref,
--   quantity, min_threshold, price_buy, price_sell,
--   image_url, is_active
--
-- products:
--   id, created_at, inventory_item_id (FK), slug, title,
--   description, is_published, seo_title, seo_description,
--   cover_image_url
--
-- stock_movements:
--   id, created_at, inventory_item_id (FK, NOT NULL),
--   type, quantity, related_client_name, technician_name,
--   client_id, intervention_id, tech_id, notes
--
-- order_items:
--   id, order_id (FK), inventory_item_id (FK),
--   qty, unit_price, line_total
--
-- =====================================================
