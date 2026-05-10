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
  total_debt: number;
  debt_limit: number;
  note?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Debt {
  id: string;
  customer_id: string;
  customer?: Customer;
  invoice_id?: string;
  invoice?: SaleInvoice;
  total_amount: number;
  remaining_amount: number;
  status: 'active' | 'partially_paid' | 'paid' | 'overdue';
  due_date?: string;
  guarantor_name?: string;
  guarantor_phone?: string;
  debtor_phone?: string;
  debt_items?: DebtItem[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DebtItem {
  name: string;
  price: number;
  quantity: number;
  barcode?: string;
}

export interface DebtPayment {
  id: string;
  debt_id: string;
  debt?: Debt;
  customer_id: string;
  customer?: Customer;
  invoice_id?: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'transfer';
  payment_date: string;
  payment_time?: string;
  notes?: string;
  cashier?: string;
  user_id?: string;
  created_at?: string;
}

export interface DebtSummary {
  total_outstanding: number;
  total_overdue: number;
  total_active: number;
  total_customers_with_debt: number;
  total_debts: number;
  customers: {
    id: string;
    name: string;
    phone?: string;
    total_debt: number;
    debt_limit: number;
    debt_count: number;
    oldest_due_date?: string;
  }[];
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
  second_tax_rate?: number;
  second_tax_total?: number;
  total: number;
  payment_method: string;
  paid_amount: number;
  change_amount: number;
  debt_amount: number;
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
  store_logo_url: string;
  store_website: string;
  store_registration_number: string;
  store_tax_number: string;
  store_owner_name: string;
  store_mobile: string;
  tax_name: string;
  tax_rate: number;
  tax_enabled: boolean;
  tax_include_in_price: boolean;
  second_tax_name: string;
  second_tax_rate: number;
  second_tax_enabled: boolean;
  currency: string;
  currency_position: string;
  date_format: string;
  time_format: string;
  language: string;
  receipt_header: string;
  receipt_footer: string;
  receipt_show_logo: boolean;
  receipt_show_barcode: boolean;
  receipt_show_qr: boolean;
  receipt_paper_size: string;
  receipt_show_store_info: boolean;
  receipt_show_cashier: boolean;
  receipt_copies: number;
  receipt_auto_print: boolean;
  receipt_show_border: boolean;
  printer_type: string;
  printer_ip: string;
  printer_port: string;
  printer_encoding: string;
  printer_chars_per_line: number;
  printer_cutter_enabled: boolean;
  printer_drawer_enabled: boolean;
  printer_drawer_pin: number;
  thermal_print_density: number;
  thermal_print_speed: number;
  receipt_font_family: string;
  receipt_font_size: number;
  receipt_compact_mode: boolean;
  low_stock_alert: number;
  enable_loyalty: boolean;
  loyalty_points_per_amount: number;
  loyalty_points_value: number;
  loyalty_min_points_redeem: number;
  loyalty_points_expire_days: number;
  loyalty_welcome_points: number;
  default_payment_method: string;
  enable_hold_orders: boolean;
  enable_barcode_scanner: boolean;
  enable_sound_notifications: boolean;
  enable_customer_required: boolean;
  max_discount_percentage: number;
  invoice_number_prefix: string;
  enable_negative_stock: boolean;
  enable_fast_sale: boolean;
  enable_credit_sales: boolean;
  show_product_images: boolean;
  grid_columns: number;
  backup_enabled: boolean;
  backup_frequency: string;
  last_backup_date: string;
  enable_desktop_notifications: boolean;
  session_timeout_minutes: number;
  password_min_length: number;
  enable_2fa: boolean;
  whatsapp_enabled: boolean;
  whatsapp_number: string;
  whatsapp_send_invoice: boolean;
  api_key_enabled: boolean;
  api_key: string;
  maintenance_mode: boolean;
  maintenance_message: string;
  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  phone?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'system' | 'subscription' | 'debt' | 'alert' | 'info';
  is_read: boolean;
  created_at?: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  status: 'trial' | 'active' | 'suspended' | 'expired';
  trial_start_date: string;
  trial_end_date: string;
  is_trial_used: boolean;
  subscription_start_date?: string;
  subscription_end_date?: string;
  activated_by?: string;
  note?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserWithSubscription {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  created_at?: string;
  subscription: UserSubscription | null;
}
