import { supabase } from "@/lib/supabase";
import { toNumber } from "@/lib/db";
import type { SalesReturn, SalesReturnItem } from "@/types";

const RETURNS_TABLE = "sales_returns";
const ITEMS_TABLE = "sales_return_items";
const PRODUCTS_TABLE = "products";

function mapReturn(row: Record<string, unknown>): SalesReturn {
  const raw = row as any;
  return {
    id: raw.id,
    return_number: raw.return_number,
    original_invoice_id: raw.original_invoice_id,
    date: raw.return_date || raw.date,
    time: raw.return_time || raw.time,
    total: toNumber(raw.total),
    reason: raw.reason,
    cashier: raw.cashier,
    user_id: raw.user_id,
    created_at: raw.created_at,
    items: (raw.items || []).map((item: any) => ({
      id: item.id,
      return_id: item.return_id,
      product_id: item.product_id,
      name: item.name,
      price: toNumber(item.price),
      quantity: item.quantity,
      barcode: item.barcode,
    })),
  };
}

export async function fetchSalesReturns(): Promise<SalesReturn[]> {
  const { data, error } = await supabase
    .from(RETURNS_TABLE)
    .select("*, items:sales_return_items(*)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapReturn);
}

export async function getSalesReturn(id: string): Promise<SalesReturn | null> {
  const { data, error } = await supabase
    .from(RETURNS_TABLE)
    .select("*, items:sales_return_items(*)")
    .eq("id", id)
    .single();

  if (error) return null;
  return mapReturn(data);
}

export async function createSalesReturn(
  ret: Omit<SalesReturn, "id" | "created_at" | "items">,
  items: Omit<SalesReturnItem, "id" | "return_id">[]
): Promise<SalesReturn> {
  // 1. Create return record
  const { data: retData, error: retError } = await supabase
    .from(RETURNS_TABLE)
    .insert({
      return_number: ret.return_number,
      original_invoice_id: ret.original_invoice_id,
      return_date: ret.date,
      return_time: ret.time,
      total: ret.total,
      reason: ret.reason,
      cashier: ret.cashier,
      user_id: ret.user_id,
    })
    .select()
    .single();

  if (retError) throw retError;

  // 2. Insert return items
  const returnItems = items.map((item) => ({
    return_id: retData.id,
    product_id: item.product_id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    barcode: item.barcode,
  }));

  const { error: itemsError } = await supabase.from(ITEMS_TABLE).insert(returnItems);
  if (itemsError) {
    await supabase.from(RETURNS_TABLE).delete().eq("id", retData.id);
    throw itemsError;
  }

  // 3. Restore stock for each returned product
  const stockErrors: Error[] = [];
  for (const item of items) {
    if (!item.product_id) continue;

    const { data: productData } = await supabase
      .from(PRODUCTS_TABLE)
      .select("stock")
      .eq("id", item.product_id)
      .single();

    if (productData) {
      const newStock = (productData.stock || 0) + item.quantity;
      const { error } = await supabase
        .from(PRODUCTS_TABLE)
        .update({ stock: newStock })
        .eq("id", item.product_id);

      if (error) stockErrors.push(error);
    }
  }

  if (stockErrors.length > 0) {
    await supabase.from(RETURNS_TABLE).delete().eq("id", retData.id);
    throw new Error(`فشل استعادة المخزون: ${stockErrors.map((e) => e.message).join(", ")}`);
  }

  return mapReturn({ ...retData, items: returnItems });
}

export async function deleteSalesReturn(id: string): Promise<void> {
  // 1. Fetch the return with its items first
  const { data: returnData, error: fetchError } = await supabase
    .from(RETURNS_TABLE)
    .select("*, items:sales_return_items(*)")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;

  const ret = mapReturn(returnData);

  // 2. Reverse the stock restoration (deduct stock back)
  for (const item of ret.items) {
    if (!item.product_id) continue;

    const { data: productData } = await supabase
      .from(PRODUCTS_TABLE)
      .select("stock")
      .eq("id", item.product_id)
      .single();

    if (productData) {
      const newStock = Math.max(0, (productData.stock || 0) - item.quantity);
      await supabase
        .from(PRODUCTS_TABLE)
        .update({ stock: newStock })
        .eq("id", item.product_id);
    }
  }

  // 3. Delete the return (cascade deletes items)
  const { error: deleteError } = await supabase
    .from(RETURNS_TABLE)
    .delete()
    .eq("id", id);

  if (deleteError) throw deleteError;
}
