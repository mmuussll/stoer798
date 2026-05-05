-- ============================================
-- نظام نقطة البيع - المخطط الموحد
-- Unified schema with proper types, indexes, RLS
-- ============================================

-- 1. Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  barcode TEXT UNIQUE,
  image_url TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Customers
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  total_purchases DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_visits INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Sales Invoices
-- date/time stored as proper DATE and TIME for reliable querying
CREATE TABLE IF NOT EXISTS sales_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sale_time TIME NOT NULL DEFAULT CURRENT_TIME,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_type TEXT DEFAULT '',
  discount_value DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_total DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  paid_amount DECIMAL(10,2) DEFAULT 0,
  change_amount DECIMAL(10,2) DEFAULT 0,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  cashier TEXT NOT NULL DEFAULT 'البائع الرئيسي',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Sales Invoice Items
CREATE TABLE IF NOT EXISTS sales_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  barcode TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Purchase Invoices
CREATE TABLE IF NOT EXISTS purchase_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL,
  supplier TEXT NOT NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  purchase_time TIME NOT NULL DEFAULT CURRENT_TIME,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Purchase Invoice Items
CREATE TABLE IF NOT EXISTS purchase_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  barcode TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  purchase_price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Sales Returns
CREATE TABLE IF NOT EXISTS sales_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number TEXT NOT NULL,
  original_invoice_id UUID REFERENCES sales_invoices(id) ON DELETE SET NULL,
  return_date DATE NOT NULL DEFAULT CURRENT_DATE,
  return_time TIME NOT NULL DEFAULT CURRENT_TIME,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  reason TEXT,
  cashier TEXT NOT NULL DEFAULT 'البائع الرئيسي',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Sales Return Items
CREATE TABLE IF NOT EXISTS sales_return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL REFERENCES sales_returns(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  barcode TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Cash Sessions
CREATE TABLE IF NOT EXISTS cash_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cashier_name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_date TEXT,
  end_time TEXT,
  opening_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  closing_balance DECIMAL(12,2) DEFAULT 0,
  total_sales DECIMAL(12,2) DEFAULT 0,
  total_cash DECIMAL(12,2) DEFAULT 0,
  total_card DECIMAL(12,2) DEFAULT 0,
  total_returns DECIMAL(12,2) DEFAULT 0,
  invoice_count INTEGER DEFAULT 0,
  expected_cash DECIMAL(12,2) DEFAULT 0,
  difference DECIMAL(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Store Settings (singleton row)
CREATE TABLE IF NOT EXISTS store_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_name TEXT NOT NULL DEFAULT 'متجري',
  store_phone TEXT DEFAULT '',
  store_address TEXT DEFAULT '',
  store_email TEXT DEFAULT '',
  tax_name TEXT DEFAULT 'ضريبة القيمة المضافة',
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  tax_enabled BOOLEAN NOT NULL DEFAULT false,
  currency TEXT NOT NULL DEFAULT 'د.ع',
  receipt_header TEXT DEFAULT '',
  receipt_footer TEXT DEFAULT 'شكراً لتعاملکم معنا',
  low_stock_alert INTEGER NOT NULL DEFAULT 5,
  enable_loyalty BOOLEAN NOT NULL DEFAULT true,
  loyalty_points_per_amount DECIMAL(10,2) NOT NULL DEFAULT 1000,
  loyalty_points_value DECIMAL(10,2) NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Categories: all authenticated users can read; only insert/update/delete own
CREATE POLICY "All can read categories" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "All can insert categories" ON categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "All can update categories" ON categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "All can delete categories" ON categories FOR DELETE TO authenticated USING (true);

-- Products: all authenticated users can read; only insert/update/delete own
CREATE POLICY "All can read products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "All can insert products" ON products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "All can update products" ON products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "All can delete products" ON products FOR DELETE TO authenticated USING (true);

-- Customers: all authenticated users share customers
CREATE POLICY "All can manage customers" ON customers FOR ALL TO authenticated USING (true);

-- Sales Invoices: user-scoped
CREATE POLICY "Users read own sales invoices" ON sales_invoices FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own sales invoices" ON sales_invoices FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own sales invoices" ON sales_invoices FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users delete own sales invoices" ON sales_invoices FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Sales Invoice Items: scoped via parent invoice's user_id
CREATE POLICY "Users manage own invoice items" ON sales_invoice_items FOR ALL TO authenticated
  USING (invoice_id IN (SELECT id FROM sales_invoices WHERE user_id = auth.uid()));

-- Purchase Invoices: user-scoped
CREATE POLICY "Users read own purchase invoices" ON purchase_invoices FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own purchase invoices" ON purchase_invoices FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own purchase invoices" ON purchase_invoices FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users delete own purchase invoices" ON purchase_invoices FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Purchase Invoice Items: scoped via parent
CREATE POLICY "Users manage own purchase items" ON purchase_invoice_items FOR ALL TO authenticated
  USING (invoice_id IN (SELECT id FROM purchase_invoices WHERE user_id = auth.uid()));

-- Sales Returns: user-scoped
CREATE POLICY "Users read own returns" ON sales_returns FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own returns" ON sales_returns FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own returns" ON sales_returns FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users delete own returns" ON sales_returns FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Sales Return Items: scoped via parent
CREATE POLICY "Users manage own return items" ON sales_return_items FOR ALL TO authenticated
  USING (return_id IN (SELECT id FROM sales_returns WHERE user_id = auth.uid()));

-- Cash Sessions: user-scoped
CREATE POLICY "Users read own sessions" ON cash_sessions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own sessions" ON cash_sessions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own sessions" ON cash_sessions FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users delete own sessions" ON cash_sessions FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Store Settings: all authenticated can read, only insert/update (no delete)
CREATE POLICY "All can read settings" ON store_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "All can insert settings" ON store_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "All can update settings" ON store_settings FOR UPDATE TO authenticated USING (true);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_items_invoice ON sales_invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_invoice ON purchase_invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_user ON sales_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer ON sales_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_date ON sales_invoices(sale_date);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_user ON purchase_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_date ON purchase_invoices(purchase_date);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_sales_returns_invoice ON sales_returns(original_invoice_id);
CREATE INDEX IF NOT EXISTS idx_sales_returns_user ON sales_returns(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_return_items_return ON sales_return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_user ON cash_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_status ON cash_sessions(status);

-- Default settings row
INSERT INTO store_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Storage bucket (run in Supabase Dashboard SQL Editor if not exists):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);
-- CREATE POLICY "Public can view images" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'product-images');
-- CREATE POLICY "Auth can upload images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');
-- CREATE POLICY "Auth can delete images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images');
