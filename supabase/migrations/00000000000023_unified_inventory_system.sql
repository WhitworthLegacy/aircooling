-- ============================================================
-- Migration 23: Unified Inventory System
-- Connects: inventory_items, products, stock_movements, orders
-- Single source of truth with automatic synchronization
-- ============================================================

-- =====================================================
-- 1. ADD IMAGE_URL TO INVENTORY_ITEMS
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE inventory_items ADD COLUMN image_url text;
    COMMENT ON COLUMN inventory_items.image_url IS 'Primary image URL for this inventory item';
  END IF;
END $$;

-- =====================================================
-- 2. MIGRATE EXISTING IMAGES FROM PRODUCTS
-- Copy cover_image_url from products to inventory_items
-- =====================================================
UPDATE inventory_items ii
SET image_url = p.cover_image_url
FROM products p
WHERE p.inventory_item_id = ii.id
  AND p.cover_image_url IS NOT NULL
  AND ii.image_url IS NULL;

-- =====================================================
-- 3. SYNC TRIGGER: inventory_items.image_url -> products.cover_image_url
-- When image changes on inventory_items, update all linked products
-- =====================================================
CREATE OR REPLACE FUNCTION sync_inventory_image_to_products()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all products linked to this inventory item
  UPDATE products
  SET cover_image_url = NEW.image_url
  WHERE inventory_item_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_inventory_image ON inventory_items;
CREATE TRIGGER trigger_sync_inventory_image
  AFTER UPDATE OF image_url ON inventory_items
  FOR EACH ROW
  WHEN (OLD.image_url IS DISTINCT FROM NEW.image_url)
  EXECUTE FUNCTION sync_inventory_image_to_products();

-- =====================================================
-- 4. SYNC TRIGGER: products.cover_image_url -> inventory_items.image_url
-- When image changes on product, update the inventory item
-- =====================================================
CREATE OR REPLACE FUNCTION sync_product_image_to_inventory()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the linked inventory item (only if it doesn't have an image yet or is being explicitly set)
  IF NEW.inventory_item_id IS NOT NULL THEN
    UPDATE inventory_items
    SET image_url = NEW.cover_image_url
    WHERE id = NEW.inventory_item_id
      AND (image_url IS NULL OR image_url = '' OR image_url = OLD.cover_image_url);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_product_image ON products;
CREATE TRIGGER trigger_sync_product_image
  AFTER INSERT OR UPDATE OF cover_image_url ON products
  FOR EACH ROW
  WHEN (NEW.cover_image_url IS NOT NULL AND NEW.cover_image_url != '')
  EXECUTE FUNCTION sync_product_image_to_inventory();

-- =====================================================
-- 5. AUTO-CREATE STOCK MOVEMENT ON ORDER COMPLETION
-- When order status changes to 'paid', decrement stock
-- =====================================================
CREATE OR REPLACE FUNCTION handle_order_stock_decrement()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
BEGIN
  -- Only trigger when status changes to 'paid' or 'completed'
  IF NEW.status IN ('paid', 'completed') AND OLD.status NOT IN ('paid', 'completed') THEN
    -- Loop through all order items
    FOR item IN
      SELECT oi.inventory_item_id, oi.qty, ii.name
      FROM order_items oi
      JOIN inventory_items ii ON ii.id = oi.inventory_item_id
      WHERE oi.order_id = NEW.id
    LOOP
      -- Create stock movement record
      INSERT INTO stock_movements (
        inventory_item_id,
        type,
        quantity,
        related_client_name,
        notes
      ) VALUES (
        item.inventory_item_id,
        'OUT',
        item.qty,
        COALESCE(NEW.email, 'Client e-commerce'),
        'Vente e-commerce - Commande #' || LEFT(NEW.id::text, 8)
      );

      -- Decrement inventory quantity
      UPDATE inventory_items
      SET quantity = GREATEST(0, quantity - item.qty)
      WHERE id = item.inventory_item_id;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_order_stock_decrement ON orders;
CREATE TRIGGER trigger_order_stock_decrement
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_order_stock_decrement();

-- =====================================================
-- 6. AUTO-RESTORE STOCK ON ORDER CANCELLATION
-- When order is cancelled/refunded, restore stock
-- =====================================================
CREATE OR REPLACE FUNCTION handle_order_stock_restore()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
BEGIN
  -- Only trigger when status changes to 'cancelled' or 'refunded' from paid/completed
  IF NEW.status IN ('cancelled', 'refunded') AND OLD.status IN ('paid', 'completed') THEN
    FOR item IN
      SELECT oi.inventory_item_id, oi.qty, ii.name
      FROM order_items oi
      JOIN inventory_items ii ON ii.id = oi.inventory_item_id
      WHERE oi.order_id = NEW.id
    LOOP
      -- Create stock movement record (IN = restore)
      INSERT INTO stock_movements (
        inventory_item_id,
        type,
        quantity,
        related_client_name,
        notes
      ) VALUES (
        item.inventory_item_id,
        'IN',
        item.qty,
        COALESCE(NEW.email, 'Client e-commerce'),
        'Annulation/Remboursement - Commande #' || LEFT(NEW.id::text, 8)
      );

      -- Restore inventory quantity
      UPDATE inventory_items
      SET quantity = quantity + item.qty
      WHERE id = item.inventory_item_id;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_order_stock_restore ON orders;
CREATE TRIGGER trigger_order_stock_restore
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_order_stock_restore();

-- =====================================================
-- 7. AUTO-CREATE PRODUCT WHEN INVENTORY ITEM CREATED
-- Optional: Create a product shell when inventory item is created
-- =====================================================
CREATE OR REPLACE FUNCTION auto_create_product_for_inventory()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create product if item_type is 'part' (not labor/fee)
  IF NEW.item_type IS NULL OR NEW.item_type = 'part' THEN
    INSERT INTO products (
      inventory_item_id,
      title,
      slug,
      cover_image_url,
      is_published
    ) VALUES (
      NEW.id,
      NEW.name,
      LOWER(REGEXP_REPLACE(COALESCE(NEW.reference, NEW.name), '[^a-zA-Z0-9]+', '-', 'g')),
      NEW.image_url,
      false  -- Not published by default
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Optionally enable auto-creation (commented out by default)
-- DROP TRIGGER IF EXISTS trigger_auto_create_product ON inventory_items;
-- CREATE TRIGGER trigger_auto_create_product
--   AFTER INSERT ON inventory_items
--   FOR EACH ROW
--   EXECUTE FUNCTION auto_create_product_for_inventory();

-- =====================================================
-- 8. STOCK ALERT FUNCTION
-- Returns items below threshold
-- =====================================================
CREATE OR REPLACE FUNCTION get_low_stock_items()
RETURNS TABLE (
  id uuid,
  name text,
  reference text,
  quantity integer,
  min_threshold integer,
  supplier_name text,
  shortage integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ii.id,
    ii.name,
    ii.reference,
    ii.quantity,
    ii.min_threshold,
    ii.supplier_name,
    (ii.min_threshold - ii.quantity) as shortage
  FROM inventory_items ii
  WHERE ii.quantity <= ii.min_threshold
    AND ii.is_active = true
  ORDER BY shortage DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. HELPER VIEW: Inventory with product info
-- =====================================================
CREATE OR REPLACE VIEW inventory_with_products AS
SELECT
  ii.*,
  p.id as product_id,
  p.slug as product_slug,
  p.is_published as product_published,
  COALESCE(ii.image_url, p.cover_image_url) as display_image_url
FROM inventory_items ii
LEFT JOIN products p ON p.inventory_item_id = ii.id;

-- =====================================================
-- 10. HELPER VIEW: Stock movements with item details
-- =====================================================
CREATE OR REPLACE VIEW stock_movements_detailed AS
SELECT
  sm.*,
  ii.name as item_name,
  ii.reference as item_reference,
  ii.quantity as current_quantity
FROM stock_movements sm
JOIN inventory_items ii ON ii.id = sm.inventory_item_id
ORDER BY sm.created_at DESC;

-- =====================================================
-- 11. Ensure RLS on views
-- =====================================================
-- Note: Views inherit RLS from underlying tables

-- =====================================================
-- 12. Add indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_inventory_items_image_url
  ON inventory_items(image_url)
  WHERE image_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_status
  ON orders(status);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_inventory_item_id
  ON order_items(inventory_item_id);

-- =====================================================
-- SUMMARY OF CONNECTIONS:
-- =====================================================
--
-- inventory_items (SOURCE DE VÉRITÉ)
--   │
--   ├──► products (1:N) - via inventory_item_id
--   │    └── image synced via triggers
--   │
--   ├──► stock_movements (1:N) - via inventory_item_id
--   │    └── auto-created on order completion
--   │
--   └──► order_items (1:N) - via inventory_item_id
--        └── triggers stock decrement/restore
--
-- FLOW:
-- 1. Change stock in admin → inventory_items.quantity updated
-- 2. Order paid → trigger creates stock_movement + decrements quantity
-- 3. Order cancelled → trigger restores stock
-- 4. Change image in inventory → syncs to all linked products
-- 5. Change image in product → syncs back to inventory
-- =====================================================
