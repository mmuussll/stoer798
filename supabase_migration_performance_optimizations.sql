-- Performance Optimization: Database-level debt summary + stock batch RPC
-- Run this in Supabase SQL Editor

-- 1. RPC Function: get_debt_summary - calculates debt summary directly in SQL
CREATE OR REPLACE FUNCTION get_debt_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_outstanding', COALESCE(SUM(CASE WHEN d.status IN ('active','partially_paid','overdue') THEN d.remaining_amount ELSE 0 END), 0),
    'total_overdue', COALESCE(SUM(CASE WHEN d.due_date IS NOT NULL AND d.due_date < CURRENT_DATE AND d.status IN ('active','partially_paid','overdue') THEN d.remaining_amount ELSE 0 END), 0),
    'total_active', COALESCE(SUM(CASE WHEN (d.due_date IS NULL OR d.due_date >= CURRENT_DATE) AND d.status IN ('active','partially_paid','overdue') THEN d.remaining_amount ELSE 0 END), 0),
    'total_customers_with_debt', COALESCE((SELECT COUNT(DISTINCT customer_id) FROM debts WHERE status IN ('active','partially_paid','overdue')), 0),
    'total_debts', COALESCE((SELECT COUNT(*) FROM debts WHERE status IN ('active','partially_paid','overdue')), 0),
    'customers', COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'phone', c.phone,
          'total_debt', COALESCE(ds.total_debt, 0),
          'debt_limit', COALESCE(c.debt_limit, 0),
          'debt_count', COALESCE(ds.debt_count, 0),
          'oldest_due_date', ds.oldest_due_date
        ) ORDER BY ds.total_debt DESC
      ) FROM (
        SELECT
          d.customer_id,
          SUM(d.remaining_amount) AS total_debt,
          COUNT(*) AS debt_count,
          MIN(d.due_date) AS oldest_due_date
        FROM debts d
        WHERE d.status IN ('active','partially_paid','overdue')
        GROUP BY d.customer_id
      ) ds
      JOIN customers c ON c.id = ds.customer_id
      ), '[]'::jsonb
    )
  ) INTO result
  FROM debts d;

  RETURN result;
END;
$$;

-- 2. RPC Function: batch_update_stock - atomic stock update for sales
-- Takes an array of {product_id, quantity_change} and updates all stocks atomically
CREATE OR REPLACE FUNCTION batch_update_stock(stock_changes jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  change_record jsonb;
BEGIN
  FOR change_record IN SELECT * FROM jsonb_array_elements(stock_changes)
  LOOP
    UPDATE products
    SET stock = GREATEST(0, COALESCE(stock, 0) + (change_record->>'quantity_change')::numeric)
    WHERE id = (change_record->>'product_id')::uuid;
  END LOOP;
END;
$$;

-- 3. Add composite index for fast sales invoice listing with items
CREATE INDEX IF NOT EXISTS idx_sales_invoices_created_at ON sales_invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_items_invoice ON sales_invoice_items(invoice_id);

-- 4. Add indexes for purchase invoices
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_created_at ON purchase_invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_invoice ON purchase_invoice_items(invoice_id);

-- 5. Add index for sales returns
CREATE INDEX IF NOT EXISTS idx_sales_returns_created_at ON sales_returns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_return_items_return ON sales_return_items(return_id);

-- 6. Add index for cash sessions
CREATE INDEX IF NOT EXISTS idx_cash_sessions_created_at ON cash_sessions(created_at DESC);

-- 7. Add index for products barcode search
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL AND barcode != '';

-- 8. Add index for customers search
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone) WHERE phone IS NOT NULL AND phone != '';

-- 9. Add index for store_settings
CREATE INDEX IF NOT EXISTS idx_store_settings_id ON store_settings(id);
