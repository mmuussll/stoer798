import { supabase } from "@/lib/supabase";
import { toNumber } from "@/lib/db";
import type { StoreSettings } from "@/types";

const DEFAULTS: StoreSettings = {
  id: 1,
  store_name: "متجري",
  store_phone: "",
  store_address: "",
  store_email: "",
  store_logo_url: "",
  store_website: "",
  store_registration_number: "",
  store_tax_number: "",
  store_owner_name: "",
  store_mobile: "",
  tax_name: "ضريبة القيمة المضافة",
  tax_rate: 0,
  tax_enabled: false,
  tax_include_in_price: false,
  second_tax_name: "",
  second_tax_rate: 0,
  second_tax_enabled: false,
  currency: "د.ع",
  currency_position: "after",
  date_format: "yyyy-MM-dd",
  time_format: "12h",
  language: "ar",
  receipt_header: "",
  receipt_footer: "شكراً لتعاملکم معنا",
  receipt_show_logo: true,
  receipt_show_barcode: false,
  receipt_show_qr: false,
  receipt_paper_size: "80mm",
  receipt_show_store_info: true,
  receipt_show_cashier: true,
  receipt_copies: 1,
  receipt_auto_print: true,
  receipt_show_border: false,
  printer_type: "browser",
  printer_ip: "",
  printer_port: "9100",
  printer_encoding: "utf8",
  printer_chars_per_line: 48,
  printer_cutter_enabled: false,
  printer_drawer_enabled: false,
  printer_drawer_pin: 0,
  thermal_print_density: 5,
  thermal_print_speed: 2,
  receipt_font_family: "monospace",
  receipt_font_size: 12,
  receipt_compact_mode: false,
  low_stock_alert: 5,
  enable_loyalty: true,
  loyalty_points_per_amount: 1000,
  loyalty_points_value: 1,
  loyalty_min_points_redeem: 100,
  loyalty_points_expire_days: 365,
  loyalty_welcome_points: 0,
  default_payment_method: "cash",
  enable_hold_orders: true,
  enable_barcode_scanner: true,
  enable_sound_notifications: true,
  enable_customer_required: false,
  max_discount_percentage: 100,
  invoice_number_prefix: "INV-",
  enable_negative_stock: false,
  enable_fast_sale: true,
  enable_credit_sales: true,
  show_product_images: true,
  grid_columns: 4,
  backup_enabled: false,
  backup_frequency: "weekly",
  last_backup_date: "",
  enable_desktop_notifications: false,
  session_timeout_minutes: 30,
  password_min_length: 6,
  enable_2fa: false,
  whatsapp_enabled: false,
  whatsapp_number: "",
  whatsapp_send_invoice: false,
  api_key_enabled: false,
  api_key: "",
};

function mapSettings(row: Record<string, unknown>): StoreSettings {
  const b = (key: string, fallback: boolean) =>
    row[key] == null ? fallback : Boolean(row[key]);
  const s = (key: string, fallback: string) =>
    (row[key] as string) ?? fallback;
  const n = (key: string, fallback: number) =>
    row[key] != null ? toNumber(row[key], fallback) : fallback;

  return {
    id: row.id as number,
    store_name: s("store_name", DEFAULTS.store_name),
    store_phone: s("store_phone", DEFAULTS.store_phone),
    store_address: s("store_address", DEFAULTS.store_address),
    store_email: s("store_email", DEFAULTS.store_email),
    store_logo_url: s("store_logo_url", DEFAULTS.store_logo_url),
    store_website: s("store_website", DEFAULTS.store_website),
    store_registration_number: s("store_registration_number", DEFAULTS.store_registration_number),
    store_tax_number: s("store_tax_number", DEFAULTS.store_tax_number),
    store_owner_name: s("store_owner_name", DEFAULTS.store_owner_name),
    store_mobile: s("store_mobile", DEFAULTS.store_mobile),
    tax_name: s("tax_name", DEFAULTS.tax_name),
    tax_rate: n("tax_rate", DEFAULTS.tax_rate),
    tax_enabled: b("tax_enabled", DEFAULTS.tax_enabled),
    tax_include_in_price: b("tax_include_in_price", DEFAULTS.tax_include_in_price),
    second_tax_name: s("second_tax_name", DEFAULTS.second_tax_name),
    second_tax_rate: n("second_tax_rate", DEFAULTS.second_tax_rate),
    second_tax_enabled: b("second_tax_enabled", DEFAULTS.second_tax_enabled),
    currency: s("currency", DEFAULTS.currency),
    currency_position: s("currency_position", DEFAULTS.currency_position),
    date_format: s("date_format", DEFAULTS.date_format),
    time_format: s("time_format", DEFAULTS.time_format),
    language: s("language", DEFAULTS.language),
    receipt_header: s("receipt_header", DEFAULTS.receipt_header),
    receipt_footer: s("receipt_footer", DEFAULTS.receipt_footer),
    receipt_show_logo: b("receipt_show_logo", DEFAULTS.receipt_show_logo),
    receipt_show_barcode: b("receipt_show_barcode", DEFAULTS.receipt_show_barcode),
    receipt_show_qr: b("receipt_show_qr", DEFAULTS.receipt_show_qr),
    receipt_paper_size: s("receipt_paper_size", DEFAULTS.receipt_paper_size),
    receipt_show_store_info: b("receipt_show_store_info", DEFAULTS.receipt_show_store_info),
    receipt_show_cashier: b("receipt_show_cashier", DEFAULTS.receipt_show_cashier),
    receipt_copies: n("receipt_copies", DEFAULTS.receipt_copies),
    receipt_auto_print: b("receipt_auto_print", DEFAULTS.receipt_auto_print),
    receipt_show_border: b("receipt_show_border", DEFAULTS.receipt_show_border),
    printer_type: s("printer_type", DEFAULTS.printer_type),
    printer_ip: s("printer_ip", DEFAULTS.printer_ip),
    printer_port: s("printer_port", DEFAULTS.printer_port),
    printer_encoding: s("printer_encoding", DEFAULTS.printer_encoding),
    printer_chars_per_line: n("printer_chars_per_line", DEFAULTS.printer_chars_per_line),
    printer_cutter_enabled: b("printer_cutter_enabled", DEFAULTS.printer_cutter_enabled),
    printer_drawer_enabled: b("printer_drawer_enabled", DEFAULTS.printer_drawer_enabled),
    printer_drawer_pin: n("printer_drawer_pin", DEFAULTS.printer_drawer_pin),
    thermal_print_density: n("thermal_print_density", DEFAULTS.thermal_print_density),
    thermal_print_speed: n("thermal_print_speed", DEFAULTS.thermal_print_speed),
    receipt_font_family: s("receipt_font_family", DEFAULTS.receipt_font_family),
    receipt_font_size: n("receipt_font_size", DEFAULTS.receipt_font_size),
    receipt_compact_mode: b("receipt_compact_mode", DEFAULTS.receipt_compact_mode),
    low_stock_alert: n("low_stock_alert", DEFAULTS.low_stock_alert),
    enable_loyalty: b("enable_loyalty", DEFAULTS.enable_loyalty),
    loyalty_points_per_amount: n("loyalty_points_per_amount", DEFAULTS.loyalty_points_per_amount),
    loyalty_points_value: n("loyalty_points_value", DEFAULTS.loyalty_points_value),
    loyalty_min_points_redeem: n("loyalty_min_points_redeem", DEFAULTS.loyalty_min_points_redeem),
    loyalty_points_expire_days: n("loyalty_points_expire_days", DEFAULTS.loyalty_points_expire_days),
    loyalty_welcome_points: n("loyalty_welcome_points", DEFAULTS.loyalty_welcome_points),
    default_payment_method: s("default_payment_method", DEFAULTS.default_payment_method),
    enable_hold_orders: b("enable_hold_orders", DEFAULTS.enable_hold_orders),
    enable_barcode_scanner: b("enable_barcode_scanner", DEFAULTS.enable_barcode_scanner),
    enable_sound_notifications: b("enable_sound_notifications", DEFAULTS.enable_sound_notifications),
    enable_customer_required: b("enable_customer_required", DEFAULTS.enable_customer_required),
    max_discount_percentage: n("max_discount_percentage", DEFAULTS.max_discount_percentage),
    invoice_number_prefix: s("invoice_number_prefix", DEFAULTS.invoice_number_prefix),
  enable_negative_stock: b("enable_negative_stock", DEFAULTS.enable_negative_stock),
  enable_fast_sale: b("enable_fast_sale", DEFAULTS.enable_fast_sale),
  enable_credit_sales: b("enable_credit_sales", true),
  show_product_images: b("show_product_images", DEFAULTS.show_product_images),
    grid_columns: n("grid_columns", DEFAULTS.grid_columns),
    backup_enabled: b("backup_enabled", DEFAULTS.backup_enabled),
    backup_frequency: s("backup_frequency", DEFAULTS.backup_frequency),
    last_backup_date: s("last_backup_date", DEFAULTS.last_backup_date),
    enable_desktop_notifications: b("enable_desktop_notifications", DEFAULTS.enable_desktop_notifications),
    session_timeout_minutes: n("session_timeout_minutes", DEFAULTS.session_timeout_minutes),
    password_min_length: n("password_min_length", DEFAULTS.password_min_length),
    enable_2fa: b("enable_2fa", DEFAULTS.enable_2fa),
    whatsapp_enabled: b("whatsapp_enabled", DEFAULTS.whatsapp_enabled),
    whatsapp_number: s("whatsapp_number", DEFAULTS.whatsapp_number),
    whatsapp_send_invoice: b("whatsapp_send_invoice", DEFAULTS.whatsapp_send_invoice),
    api_key_enabled: b("api_key_enabled", DEFAULTS.api_key_enabled),
    api_key: s("api_key", DEFAULTS.api_key),
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
  };
}

export async function fetchSettings(): Promise<StoreSettings> {
  const { data, error } = await supabase
    .from("store_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) return { ...DEFAULTS };
  return mapSettings(data);
}

export async function updateSettings(
  settings: Partial<Omit<StoreSettings, "id" | "created_at">>
): Promise<StoreSettings> {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  const stringKeys = [
    "store_name", "store_phone", "store_address", "store_email",
    "store_logo_url", "store_website", "store_registration_number",
    "store_tax_number", "store_owner_name", "store_mobile",
    "tax_name", "second_tax_name",
    "currency", "currency_position", "date_format", "time_format", "language",
    "receipt_header", "receipt_footer", "receipt_paper_size",
    "default_payment_method", "invoice_number_prefix",
    "printer_type", "printer_ip", "printer_port", "printer_encoding",
    "receipt_font_family",
    "backup_frequency", "last_backup_date",
    "whatsapp_number",
    "api_key",
  ];
  const numberKeys = [
    "tax_rate", "second_tax_rate",
    "receipt_copies", "low_stock_alert",
    "loyalty_points_per_amount", "loyalty_points_value",
    "loyalty_min_points_redeem", "loyalty_points_expire_days",
    "loyalty_welcome_points",
    "max_discount_percentage", "grid_columns",
    "printer_chars_per_line", "printer_drawer_pin",
    "thermal_print_density", "thermal_print_speed",
    "receipt_font_size",
    "session_timeout_minutes", "password_min_length",
  ];
  const boolKeys = [
    "tax_enabled", "tax_include_in_price", "second_tax_enabled",
    "receipt_show_logo", "receipt_show_barcode", "receipt_show_qr",
    "receipt_show_store_info", "receipt_show_cashier",
    "receipt_auto_print", "receipt_show_border",
    "enable_loyalty",
    "enable_hold_orders", "enable_barcode_scanner",
    "enable_sound_notifications", "enable_customer_required",
    "enable_negative_stock", "enable_fast_sale", "enable_credit_sales", "show_product_images",
    "printer_cutter_enabled", "printer_drawer_enabled",
    "receipt_compact_mode",
    "backup_enabled",
    "enable_desktop_notifications", "enable_2fa",
    "whatsapp_enabled", "whatsapp_send_invoice",
    "api_key_enabled",
  ];

  for (const key of stringKeys) {
    if (settings[key as keyof typeof settings] !== undefined)
      payload[key] = settings[key as keyof typeof settings];
  }
  for (const key of numberKeys) {
    if (settings[key as keyof typeof settings] !== undefined)
      payload[key] = settings[key as keyof typeof settings];
  }
  for (const key of boolKeys) {
    if (settings[key as keyof typeof settings] !== undefined)
      payload[key] = settings[key as keyof typeof settings];
  }

  const { data, error } = await supabase
    .from("store_settings")
    .upsert({ id: 1, ...payload })
    .select()
    .single();

  if (error) throw error;
  return mapSettings(data);
}
