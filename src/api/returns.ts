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

export async function fetchSalesReturns(page?: number, limit?: number): Promise<SalesReturn[]> {
  let query = supabase
    .from(RETURNS_TABLE)
    .select("*, items:sales_return_items(*)")
    .order("created_at", { ascending: false });

  if (limit && page !== undefined) {
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []).map(mapReturn);
}

export async function fetchSalesReturnsCount(): Promise<number> {
  const { count, error } = await supabase
    .from(RETURNS_TABLE)
    .select("*", { count: "exact", head: true });

  if (error) throw error;
  return count || 0;
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

  // 3. Batch restore stock for all returned products (single SELECT + parallel UPDATEs)
  const productIds = [...new Set(items.filter((item) => item.product_id).map((item) => item.product_id))];
  if (productIds.length > 0) {
    const { data: stocks } = await supabase
      .from(PRODUCTS_TABLE)
      .select("id, stock")
      .in("id", productIds);

    const stockMap = new Map((stocks || []).map((p: any) => [p.id, p.stock || 0]));

    const updates = productIds.map(async (productId) => {
      const currentStock = stockMap.get(productId) ?? 0;
      const totalQty = items
        .filter((item) => item.product_id === productId)
        .reduce((sum, item) => sum + item.quantity, 0);
      const newStock = currentStock + totalQty;
      const { error } = await supabase
        .from(PRODUCTS_TABLE)
        .update({ stock: newStock })
        .eq("id", productId);
      return { productId, error };
    });

    const results = await Promise.all(updates);
    const failed = results.filter((r) => r.error);
    if (failed.length > 0) {
      await supabase.from(RETURNS_TABLE).delete().eq("id", retData.id);
      throw new Error(`فشل استعادة المخزون: ${failed.map((f) => f.error!.message).join(", ")}`);
    }
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

  // 2. Batch reverse the stock restoration (deduct stock back)
  const itemProductIds = [...new Set(ret.items.filter((item) => item.product_id).map((item) => item.product_id))];
  if (itemProductIds.length > 0) {
    const { data: stocks } = await supabase
      .from(PRODUCTS_TABLE)
      .select("id, stock")
      .in("id", itemProductIds);

    const stockMap = new Map((stocks || []).map((p: any) => [p.id, p.stock || 0]));

    const updates = itemProductIds.map(async (productId) => {
      const currentStock = stockMap.get(productId) ?? 0;
      const totalQty = ret.items
        .filter((item) => item.product_id === productId)
        .reduce((sum, item) => sum + item.quantity, 0);
      const newStock = Math.max(0, currentStock - totalQty);
      const { error } = await supabase
        .from(PRODUCTS_TABLE)
        .update({ stock: newStock })
        .eq("id", productId);
      return { error };
    });

    const results = await Promise.all(updates);
    const failed = results.filter((r) => r.error);
    if (failed.length > 0) {
      throw new Error(`فشل عكس استعادة المخزون: ${failed.map((f) => f.error!.message).join(", ")}`);
    }
  }

  // 3. Delete the return (cascade deletes items)
  const { error: deleteError } = await supabase
    .from(RETURNS_TABLE)
    .delete()
    .eq("id", id);

  if (deleteError) throw deleteError;
}
