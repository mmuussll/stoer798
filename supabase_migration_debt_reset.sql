-- ============================================================
-- إعادة هيكلة كاملة لنظام الديون - حذف كل البيانات القديمة
-- نفذ هذا الملف في Supabase SQL Editor
-- تحذير: سيتم حذف جميع الديون والمدفوعات السابقة
-- ============================================================

-- 1. حذف السياسات القديمة
DROP POLICY IF EXISTS "Authenticated users can read debts" ON debts;
DROP POLICY IF EXISTS "Authenticated users can insert debts" ON debts;
DROP POLICY IF EXISTS "Authenticated users can update debts" ON debts;
DROP POLICY IF EXISTS "Authenticated users can delete debts" ON debts;
DROP POLICY IF EXISTS "Authenticated users can read debt_payments" ON debt_payments;
DROP POLICY IF EXISTS "Authenticated users can insert debt_payments" ON debt_payments;
DROP POLICY IF EXISTS "Authenticated users can update debt_payments" ON debt_payments;
DROP POLICY IF EXISTS "Authenticated users can delete debt_payments" ON debt_payments;

-- 2. حذف triggers القديمة
DROP TRIGGER IF EXISTS trg_update_customer_debt ON debts;
DROP TRIGGER IF EXISTS trg_debts_updated_at ON debts;
DROP TRIGGER IF EXISTS trg_debt_payment_change ON debt_payments;

-- 3. حذف الدوال القديمة
DROP FUNCTION IF EXISTS update_customer_total_debt();
DROP FUNCTION IF EXISTS update_debts_updated_at();
DROP FUNCTION IF EXISTS update_debt_after_payment_change();

-- 4. حذف الجداول (التابع أولاً ثم الأساسي)
DROP TABLE IF EXISTS debt_payments;
DROP TABLE IF EXISTS debts;

-- ============================================================
-- 5. إنشاء جدول الديون من جديد (مع customer_name و customer_phone)
-- ============================================================
CREATE TABLE debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  customer_name text NOT NULL DEFAULT '',
  customer_phone text DEFAULT '',
  invoice_id uuid REFERENCES sales_invoices(id) ON DELETE SET NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  remaining_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'partially_paid', 'paid', 'overdue')),
  due_date date,
  guarantor_name text,
  guarantor_phone text,
  debtor_phone text,
  debt_items jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 6. إنشاء جدول المدفوعات
-- ============================================================
CREATE TABLE debt_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id uuid NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  amount numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer')),
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_time text,
  notes text,
  cashier text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 7. الفهارس
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_debts_customer_id ON debts(customer_id);
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_debts_invoice_id ON debts(invoice_id);
CREATE INDEX IF NOT EXISTS idx_debts_due_date ON debts(due_date);
CREATE INDEX IF NOT EXISTS idx_debts_created_at ON debts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_id ON debt_payments(debt_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_customer_id ON debt_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_created_at ON debt_payments(created_at DESC);

-- ============================================================
-- 8. Trigger: تحديث total_debt في جدول customers
-- ============================================================
CREATE OR REPLACE FUNCTION update_customer_total_debt()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    UPDATE customers
    SET total_debt = COALESCE((
      SELECT SUM(remaining_amount) FROM debts
      WHERE customer_id = NEW.customer_id AND status != 'paid'
    ), 0),
    updated_at = now()
    WHERE id = NEW.customer_id;
    
    IF TG_OP = 'UPDATE' AND OLD.customer_id != NEW.customer_id THEN
      UPDATE customers
      SET total_debt = COALESCE((
        SELECT SUM(remaining_amount) FROM debts
        WHERE customer_id = OLD.customer_id AND status != 'paid'
      ), 0),
      updated_at = now()
      WHERE id = OLD.customer_id;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE customers
    SET total_debt = COALESCE((
      SELECT SUM(remaining_amount) FROM debts
      WHERE customer_id = OLD.customer_id AND status != 'paid'
    ), 0),
    updated_at = now()
    WHERE id = OLD.customer_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_update_customer_debt
AFTER INSERT OR UPDATE OR DELETE ON debts
FOR EACH ROW EXECUTE FUNCTION update_customer_total_debt();

-- ============================================================
-- 9. Trigger: تحديث updated_at تلقائياً
-- ============================================================
CREATE OR REPLACE FUNCTION update_debts_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_debts_updated_at
BEFORE UPDATE ON debts
FOR EACH ROW EXECUTE FUNCTION update_debts_updated_at();

-- ============================================================
-- 10. Trigger: تحديث remaining_amount عند تغير المدفوعات
-- ============================================================
CREATE OR REPLACE FUNCTION update_debt_after_payment_change()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql AS $$
DECLARE
  total_paid numeric;
  target_debt_id uuid;
BEGIN
  target_debt_id := COALESCE(NEW.debt_id, OLD.debt_id);
  
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM debt_payments WHERE debt_id = target_debt_id;
  
  UPDATE debts
  SET remaining_amount = GREATEST(0, total_amount - total_paid),
      status = CASE
        WHEN total_amount - total_paid <= 0 THEN 'paid'
        WHEN total_amount - total_paid < total_amount THEN 'partially_paid'
        ELSE status
      END,
      updated_at = now()
  WHERE id = target_debt_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_debt_payment_change
AFTER INSERT OR UPDATE OR DELETE ON debt_payments
FOR EACH ROW EXECUTE FUNCTION update_debt_after_payment_change();

-- ============================================================
-- 11. RLS - تفعيل وسياسات
-- ============================================================
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;

-- debts policies
CREATE POLICY "debts_select_policy" ON debts FOR SELECT TO authenticated USING (true);
CREATE POLICY "debts_insert_policy" ON debts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "debts_update_policy" ON debts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "debts_delete_policy" ON debts FOR DELETE TO authenticated USING (true);

-- debt_payments policies
CREATE POLICY "payments_select_policy" ON debt_payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "payments_insert_policy" ON debt_payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "payments_update_policy" ON debt_payments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "payments_delete_policy" ON debt_payments FOR DELETE TO authenticated USING (true);

-- ============================================================
-- تم ✅
-- ============================================================
