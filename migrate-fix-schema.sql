-- ============================================
-- ترحيل: تحويل أعمدة date/time إلى DATE/TIME وربطها بـ user_id
-- للتشغيل: الصق في Supabase SQL Editor
-- ============================================

-- 1. Sales Invoices: rename date/time to sale_date/sale_time + fix type
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_invoices' AND column_name = 'date') THEN
    ALTER TABLE sales_invoices RENAME COLUMN "date" TO sale_date;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_invoices' AND column_name = 'time') THEN
    ALTER TABLE sales_invoices RENAME COLUMN "time" TO sale_time;
  END IF;
END $$;

-- 2. Purchase Invoices: rename date/time
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_invoices' AND column_name = 'date') THEN
    ALTER TABLE purchase_invoices RENAME COLUMN "date" TO purchase_date;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_invoices' AND column_name = 'time') THEN
    ALTER TABLE purchase_invoices RENAME COLUMN "time" TO purchase_time;
  END IF;
END $$;

-- 3. Sales Returns: rename date/time
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_returns' AND column_name = 'date') THEN
    ALTER TABLE sales_returns RENAME COLUMN "date" TO return_date;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_returns' AND column_name = 'time') THEN
    ALTER TABLE sales_returns RENAME COLUMN "time" TO return_time;
  END IF;
END $$;

-- 4. Add missing indexes
CREATE INDEX IF NOT EXISTS idx_sales_invoices_date ON sales_invoices(sale_date);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_date ON purchase_invoices(purchase_date);
CREATE INDEX IF NOT EXISTS idx_sales_returns_user ON sales_returns(user_id);

-- 5. Fix RLS policies on sales_invoices (scoped to user_id)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Authenticated can read sales_invoices" ON sales_invoices;
  DROP POLICY IF EXISTS "Authenticated can insert sales_invoices" ON sales_invoices;
  DROP POLICY IF EXISTS "Authenticated can update sales_invoices" ON sales_invoices;
  DROP POLICY IF EXISTS "Authenticated can delete sales_invoices" ON sales_invoices;
END $$;

CREATE POLICY "Users read own sales invoices" ON sales_invoices FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own sales invoices" ON sales_invoices FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own sales invoices" ON sales_invoices FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users delete own sales invoices" ON sales_invoices FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 6. Fix RLS on sales_invoice_items (via parent)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Authenticated can read sales_invoice_items" ON sales_invoice_items;
  DROP POLICY IF EXISTS "Authenticated can insert sales_invoice_items" ON sales_invoice_items;
  DROP POLICY IF EXISTS "Authenticated can update sales_invoice_items" ON sales_invoice_items;
  DROP POLICY IF EXISTS "Authenticated can delete sales_invoice_items" ON sales_invoice_items;
END $$;

CREATE POLICY "Users manage own invoice items" ON sales_invoice_items FOR ALL TO authenticated
  USING (invoice_id IN (SELECT id FROM sales_invoices WHERE user_id = auth.uid()));

-- 7. Fix RLS on purchase_invoices (scoped to user_id)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Authenticated can read purchase_invoices" ON purchase_invoices;
  DROP POLICY IF EXISTS "Authenticated can insert purchase_invoices" ON purchase_invoices;
  DROP POLICY IF EXISTS "Authenticated can update purchase_invoices" ON purchase_invoices;
  DROP POLICY IF EXISTS "Authenticated can delete purchase_invoices" ON purchase_invoices;
END $$;

CREATE POLICY "Users read own purchase invoices" ON purchase_invoices FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own purchase invoices" ON purchase_invoices FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own purchase invoices" ON purchase_invoices FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users delete own purchase invoices" ON purchase_invoices FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 8. Fix RLS on purchase_invoice_items (via parent)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Authenticated can read purchase_invoice_items" ON purchase_invoice_items;
  DROP POLICY IF EXISTS "Authenticated can insert purchase_invoice_items" ON purchase_invoice_items;
  DROP POLICY IF EXISTS "Authenticated can update purchase_invoice_items" ON purchase_invoice_items;
  DROP POLICY IF EXISTS "Authenticated can delete purchase_invoice_items" ON purchase_invoice_items;
END $$;

CREATE POLICY "Users manage own purchase items" ON purchase_invoice_items FOR ALL TO authenticated
  USING (invoice_id IN (SELECT id FROM purchase_invoices WHERE user_id = auth.uid()));

-- 9. Fix RLS on sales_returns (scoped to user_id)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Auth can read sales_returns" ON sales_returns;
  DROP POLICY IF EXISTS "Auth can insert sales_returns" ON sales_returns;
  DROP POLICY IF EXISTS "Auth can update sales_returns" ON sales_returns;
  DROP POLICY IF EXISTS "Auth can delete sales_returns" ON sales_returns;
  DROP POLICY IF EXISTS "Auth read returns" ON sales_returns;
  DROP POLICY IF EXISTS "Auth insert returns" ON sales_returns;
  DROP POLICY IF EXISTS "Auth update returns" ON sales_returns;
  DROP POLICY IF EXISTS "Auth delete returns" ON sales_returns;
END $$;

CREATE POLICY "Users read own returns" ON sales_returns FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own returns" ON sales_returns FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own returns" ON sales_returns FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users delete own returns" ON sales_returns FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 10. Fix RLS on sales_return_items (via parent)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Auth can read sales_return_items" ON sales_return_items;
  DROP POLICY IF EXISTS "Auth can insert sales_return_items" ON sales_return_items;
  DROP POLICY IF EXISTS "Auth can update sales_return_items" ON sales_return_items;
  DROP POLICY IF EXISTS "Auth can delete sales_return_items" ON sales_return_items;
  DROP POLICY IF EXISTS "Auth read return_items" ON sales_return_items;
  DROP POLICY IF EXISTS "Auth insert return_items" ON sales_return_items;
  DROP POLICY IF EXISTS "Auth update return_items" ON sales_return_items;
  DROP POLICY IF EXISTS "Auth delete return_items" ON sales_return_items;
END $$;

CREATE POLICY "Users manage own return items" ON sales_return_items FOR ALL TO authenticated
  USING (return_id IN (SELECT id FROM sales_returns WHERE user_id = auth.uid()));

-- 11. Fix RLS on cash_sessions (scoped to user_id)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Auth can read cash_sessions" ON cash_sessions;
  DROP POLICY IF EXISTS "Auth can insert cash_sessions" ON cash_sessions;
  DROP POLICY IF EXISTS "Auth can update cash_sessions" ON cash_sessions;
  DROP POLICY IF EXISTS "Auth can delete cash_sessions" ON cash_sessions;
  DROP POLICY IF EXISTS "Auth read sessions" ON cash_sessions;
  DROP POLICY IF EXISTS "Auth insert sessions" ON cash_sessions;
  DROP POLICY IF EXISTS "Auth update sessions" ON cash_sessions;
  DROP POLICY IF EXISTS "Auth delete sessions" ON cash_sessions;
END $$;

CREATE POLICY "Users read own sessions" ON cash_sessions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own sessions" ON cash_sessions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own sessions" ON cash_sessions FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users delete own sessions" ON cash_sessions FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 12. Fix RLS on store_settings (keep open for all auth users)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Auth can read store_settings" ON store_settings;
  DROP POLICY IF EXISTS "Auth can upsert store_settings" ON store_settings;
  DROP POLICY IF EXISTS "Auth can update store_settings" ON store_settings;
  DROP POLICY IF EXISTS "Auth read settings" ON store_settings;
  DROP POLICY IF EXISTS "Auth insert settings" ON store_settings;
  DROP POLICY IF EXISTS "Auth update settings" ON store_settings;
END $$;

CREATE POLICY "All can read settings" ON store_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "All can insert settings" ON store_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "All can update settings" ON store_settings FOR UPDATE TO authenticated USING (true);
