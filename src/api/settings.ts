import { supabase } from "@/lib/supabase";
import { toNumber } from "@/lib/db";
import type { StoreSettings } from "@/types";

const DEFAULTS: StoreSettings = {
  id: 1,
  store_name: "متجري",
  store_phone: "",
  store_address: "",
  store_email: "",
  tax_name: "ضريبة القيمة المضافة",
  tax_rate: 0,
  tax_enabled: false,
  currency: "د.ع",
  receipt_header: "",
  receipt_footer: "شكراً لتعاملکم معنا",
  low_stock_alert: 5,
  enable_loyalty: true,
  loyalty_points_per_amount: 1000,
  loyalty_points_value: 1,
};

function mapSettings(row: Record<string, unknown>): StoreSettings {
  return {
    id: row.id as number,
    store_name: (row.store_name as string) || DEFAULTS.store_name,
    store_phone: (row.store_phone as string) || "",
    store_address: (row.store_address as string) || "",
    store_email: (row.store_email as string) || "",
    tax_name: (row.tax_name as string) || DEFAULTS.tax_name,
    tax_rate: toNumber(row.tax_rate),
    tax_enabled: Boolean(row.tax_enabled),
    currency: (row.currency as string) || DEFAULTS.currency,
    receipt_header: (row.receipt_header as string) || "",
    receipt_footer: (row.receipt_footer as string) || DEFAULTS.receipt_footer,
    low_stock_alert: (row.low_stock_alert as number) ?? DEFAULTS.low_stock_alert,
    enable_loyalty: row.enable_loyalty == null ? DEFAULTS.enable_loyalty : Boolean(row.enable_loyalty),
    loyalty_points_per_amount: toNumber(row.loyalty_points_per_amount, DEFAULTS.loyalty_points_per_amount),
    loyalty_points_value: toNumber(row.loyalty_points_value, DEFAULTS.loyalty_points_value),
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

  if (settings.store_name !== undefined) payload.store_name = settings.store_name;
  if (settings.store_phone !== undefined) payload.store_phone = settings.store_phone;
  if (settings.store_address !== undefined) payload.store_address = settings.store_address;
  if (settings.store_email !== undefined) payload.store_email = settings.store_email;
  if (settings.tax_name !== undefined) payload.tax_name = settings.tax_name;
  if (settings.tax_rate !== undefined) payload.tax_rate = settings.tax_rate;
  if (settings.tax_enabled !== undefined) payload.tax_enabled = settings.tax_enabled;
  if (settings.currency !== undefined) payload.currency = settings.currency;
  if (settings.receipt_header !== undefined) payload.receipt_header = settings.receipt_header;
  if (settings.receipt_footer !== undefined) payload.receipt_footer = settings.receipt_footer;
  if (settings.low_stock_alert !== undefined) payload.low_stock_alert = settings.low_stock_alert;
  if (settings.enable_loyalty !== undefined) payload.enable_loyalty = settings.enable_loyalty;
  if (settings.loyalty_points_per_amount !== undefined) payload.loyalty_points_per_amount = settings.loyalty_points_per_amount;
  if (settings.loyalty_points_value !== undefined) payload.loyalty_points_value = settings.loyalty_points_value;

  const { data, error } = await supabase
    .from("store_settings")
    .upsert({ id: 1, ...payload })
    .select()
    .single();

  if (error) throw error;
  return mapSettings(data);
}
