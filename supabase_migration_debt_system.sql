-- Migration: Add Debt/Credit System
-- Run this in Supabase SQL Editor

-- 1. Add debt-related columns to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS total_debt numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS debt_limit numeric DEFAULT 0;

-- 2. Add debt-related columns to sales_invoices table
ALTER TABLE sales_invoices 
ADD COLUMN IF NOT EXISTS debt_amount numeric DEFAULT 0;

-- 3. Create debts table
CREATE TABLE IF NOT EXISTS debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  invoice_id uuid REFERENCES sales_invoices(id) ON DELETE SET NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  remaining_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'partially_paid', 'paid', 'overdue')),
  due_date date,
  guarantor_name text,
  guarantor_phone text,
  debtor_phone text,
  debt_items jsonb DEFAULT '[]',
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3b. Add columns if table already exists (idempotent)
ALTER TABLE debts ADD COLUMN IF NOT EXISTS guarantor_name text;
ALTER TABLE debts ADD COLUMN IF NOT EXISTS guarantor_phone text;
ALTER TABLE debts ADD COLUMN IF NOT EXISTS debtor_phone text;
ALTER TABLE debts ADD COLUMN IF NOT EXISTS debt_items jsonb DEFAULT '[]';

-- 4. Create debt_payments table
CREATE TABLE IF NOT EXISTS debt_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id uuid NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  invoice_id uuid REFERENCES sales_invoices(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer')),
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_time text,
  notes text,
  cashier text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_debts_customer_id ON debts(customer_id);
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_debts_invoice_id ON debts(invoice_id);
CREATE INDEX IF NOT EXISTS idx_debts_due_date ON debts(due_date);
CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_id ON debt_payments(debt_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_customer_id ON debt_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_payment_date ON debt_payments(payment_date);

-- 6. Create function to update customer total_debt
CREATE OR REPLACE FUNCTION update_customer_total_debt()
RETURNS TRIGGER AS $$
BEGIN
  -- Update customer total_debt based on sum of remaining_amount from debts
  IF (TG_OP = 'INSERT') THEN
    UPDATE customers 
    SET total_debt = COALESCE((SELECT SUM(remaining_amount) FROM debts WHERE customer_id = NEW.customer_id AND status != 'paid'), 0),
        updated_at = now()
    WHERE id = NEW.customer_id;
  ELSIF (TG_OP = 'UPDATE') THEN
    UPDATE customers 
    SET total_debt = COALESCE((SELECT SUM(remaining_amount) FROM debts WHERE customer_id = NEW.customer_id AND status != 'paid'), 0),
        updated_at = now()
    WHERE id = NEW.customer_id;
    -- Also update old customer if changed
    IF OLD.customer_id != NEW.customer_id THEN
      UPDATE customers 
      SET total_debt = COALESCE((SELECT SUM(remaining_amount) FROM debts WHERE customer_id = OLD.customer_id AND status != 'paid'), 0),
          updated_at = now()
      WHERE id = OLD.customer_id;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE customers 
    SET total_debt = COALESCE((SELECT SUM(remaining_amount) FROM debts WHERE customer_id = OLD.customer_id AND status != 'paid'), 0),
        updated_at = now()
    WHERE id = OLD.customer_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger on debts
DROP TRIGGER IF EXISTS trg_update_customer_debt ON debts;
CREATE TRIGGER trg_update_customer_debt
AFTER INSERT OR UPDATE OR DELETE ON debts
FOR EACH ROW
EXECUTE FUNCTION update_customer_total_debt();

-- 8. Auto-update updated_at on debts
CREATE OR REPLACE FUNCTION update_debts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_debts_updated_at ON debts;
CREATE TRIGGER trg_debts_updated_at
BEFORE UPDATE ON debts
FOR EACH ROW
EXECUTE FUNCTION update_debts_updated_at();

-- 9. ON DELETE CASCADE: when debt payment deleted, recalculate debt remaining_amount
CREATE OR REPLACE FUNCTION update_debt_after_payment_change()
RETURNS TRIGGER AS $$
DECLARE
  total_paid numeric;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    -- Recalculate remaining on the debt
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM debt_payments WHERE debt_id = OLD.debt_id;
    
    UPDATE debts 
    SET remaining_amount = total_amount - total_paid,
        status = CASE 
          WHEN total_amount - total_paid <= 0 THEN 'paid'
          WHEN total_amount - total_paid < total_amount THEN 'partially_paid'
          ELSE status 
        END,
        updated_at = now()
    WHERE id = OLD.debt_id;
    
    RETURN OLD;
  ELSIF (TG_OP = 'INSERT') THEN
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM debt_payments WHERE debt_id = NEW.debt_id;
    
    UPDATE debts 
    SET remaining_amount = GREATEST(0, total_amount - total_paid),
        status = CASE 
          WHEN total_amount - total_paid <= 0 THEN 'paid'
          WHEN total_amount - total_paid < total_amount THEN 'partially_paid'
          ELSE status 
        END,
        updated_at = now()
    WHERE id = NEW.debt_id;
    
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM debt_payments WHERE debt_id = NEW.debt_id;
    
    UPDATE debts 
    SET remaining_amount = GREATEST(0, total_amount - total_paid),
        status = CASE 
          WHEN total_amount - total_paid <= 0 THEN 'paid'
          WHEN total_amount - total_paid < total_amount THEN 'partially_paid'
          ELSE status 
        END,
        updated_at = now()
    WHERE id = NEW.debt_id;
    
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_debt_payment_change ON debt_payments;
CREATE TRIGGER trg_debt_payment_change
AFTER INSERT OR UPDATE OR DELETE ON debt_payments
FOR EACH ROW
EXECUTE FUNCTION update_debt_after_payment_change();

-- 10. Add enable_credit_sales to store_settings
ALTER TABLE store_settings 
ADD COLUMN IF NOT EXISTS enable_credit_sales boolean DEFAULT true;

-- 11. Enable RLS on debts and debt_payments
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;

-- 12. RLS Policies for debts
DROP POLICY IF EXISTS "Authenticated users can read debts" ON debts;
CREATE POLICY "Authenticated users can read debts" ON debts FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert debts" ON debts;
CREATE POLICY "Authenticated users can insert debts" ON debts FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update debts" ON debts;
CREATE POLICY "Authenticated users can update debts" ON debts FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can delete debts" ON debts;
CREATE POLICY "Authenticated users can delete debts" ON debts FOR DELETE TO authenticated USING (true);

-- 13. RLS Policies for debt_payments
DROP POLICY IF EXISTS "Authenticated users can read debt_payments" ON debt_payments;
CREATE POLICY "Authenticated users can read debt_payments" ON debt_payments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert debt_payments" ON debt_payments;
CREATE POLICY "Authenticated users can insert debt_payments" ON debt_payments FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update debt_payments" ON debt_payments;
CREATE POLICY "Authenticated users can update debt_payments" ON debt_payments FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can delete debt_payments" ON debt_payments;
CREATE POLICY "Authenticated users can delete debt_payments" ON debt_payments FOR DELETE TO authenticated USING (true);
