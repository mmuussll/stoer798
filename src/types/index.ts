export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  barcode?: string;
  image_url?: string;
  category_id?: string;
  category?: Category;
  created_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  total_purchases: number;
  total_visits: number;
  points: number;
  note?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  barcode?: string;
}

export interface HeldOrder {
  id: string;
  cart: CartItem[];
  createdAt: string;
  label: string;
}

export interface SaleInvoiceItem {
  id: string;
  invoice_id: string;
  product_id?: string;
  name: string;
  price: number;
  quantity: number;
  barcode?: string;
}

export interface SaleInvoice {
  id: string;
  invoice_number: string;
  date: string;
  time: string;
  subtotal: number;
  discount_total: number;
  discount_type: string;
  discount_value: number;
  tax_rate: number;
  tax_total: number;
  total: number;
  payment_method: string;
  paid_amount: number;
  change_amount: number;
  customer_id?: string;
  customer?: Customer;
  items: SaleInvoiceItem[];
  cashier: string;
  user_id?: string;
  note?: string;
  created_at?: string;
}

export interface PurchaseInvoiceItem {
  id: string;
  invoice_id: string;
  product_name: string;
  barcode: string;
  quantity: number;
  purchase_price: number;
  sale_price: number;
  category: string;
}

export interface PurchaseInvoice {
  id: string;
  invoice_number: string;
  supplier: string;
  date: string;
  time: string;
  items: PurchaseInvoiceItem[];
  total: number;
  user_id?: string;
  created_at?: string;
}

export interface SalesReturn {
  id: string;
  return_number: string;
  original_invoice_id?: string;
  original_invoice?: SaleInvoice;
  date: string;
  time: string;
  total: number;
  reason?: string;
  items: SalesReturnItem[];
  cashier: string;
  user_id?: string;
  created_at?: string;
}

export interface SalesReturnItem {
  id: string;
  return_id: string;
  product_id?: string;
  name: string;
  price: number;
  quantity: number;
  barcode?: string;
}

export interface CashSession {
  id: string;
  user_id: string;
  cashier_name: string;
  start_date: string;
  start_time: string;
  end_date?: string;
  end_time?: string;
  opening_balance: number;
  closing_balance: number;
  total_sales: number;
  total_cash: number;
  total_card: number;
  total_returns: number;
  invoice_count: number;
  expected_cash: number;
  difference: number;
  status: 'open' | 'closed';
  note?: string;
  created_at?: string;
}

export interface StoreSettings {
  id: number;
  store_name: string;
  store_phone: string;
  store_address: string;
  store_email: string;
  tax_name: string;
  tax_rate: number;
  tax_enabled: boolean;
  currency: string;
  receipt_header: string;
  receipt_footer: string;
  low_stock_alert: number;
  enable_loyalty: boolean;
  loyalty_points_per_amount: number;
  loyalty_points_value: number;
  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  full_name?: string;
  role?: string;
  created_at?: string;
}
