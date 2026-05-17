import { supabase, getCurrentUserId, isCurrentUserAdmin } from "@/lib/supabase";
import { toNumber, type RawRow } from "@/lib/db";
import type { SaleInvoice, SaleInvoiceItem } from "@/types";
import { checkDailyInvoiceLimit } from "@/lib/planLimits";

const INVOICE_TABLE = "sales_invoices";
const ITEMS_TABLE = "sales_invoice_items";
const PRODUCTS_TABLE = "products";
const CUSTOMERS_TABLE = "customers";
const SETTINGS_TABLE = "store_settings";

export async function getNextInvoiceNumber(prefix = "INV-"): Promise<string> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  const { data, error } = await supabase
    .from(INVOICE_TABLE)
    .select("invoice_number")
    .like("invoice_number", `${prefix}${today}%`)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return `${prefix}${today}-0001`;
  }

  const lastNumber = (data[0] as Record<string, unknown>).invoice_number as string;
  const seqPart = lastNumber.split("-").pop() || "0000";
  const nextSeq = (parseInt(seqPart, 10) + 1).toString().padStart(4, "0");

  return `${prefix}${today}-${nextSeq}`;
}

function mapInvoice(row: RawRow): SaleInvoice {
  const raw = row as Record<string, unknown>;
  return {
    id: raw.id,
    invoice_number: raw.invoice_number,
    date: raw.sale_date || raw.date,
    time: raw.sale_time || raw.time,
    subtotal: toNumber(raw.subtotal),
    discount_total: toNumber(raw.discount_total),
    discount_type: raw.discount_type || "",
    discount_value: toNumber(raw.discount_value),
    tax_rate: toNumber(raw.tax_rate),
    tax_total: toNumber(raw.tax_total),
    second_tax_rate: toNumber(raw.second_tax_rate),
    second_tax_total: toNumber(raw.second_tax_total),
    total: toNumber(raw.total),
    payment_method: raw.payment_method || "cash",
    paid_amount: toNumber(raw.paid_amount),
    change_amount: toNumber(raw.change_amount),
    debt_amount: toNumber(raw.debt_amount),
    customer_id: raw.customer_id,
    customer: raw.customer ? {
      id: raw.customer.id,
      name: raw.customer.name,
      phone: raw.customer.phone,
      email: raw.customer.email,
      address: raw.customer.address,
      total_purchases: toNumber(raw.customer.total_purchases),
      total_visits: toNumber(raw.customer.total_visits),
      points: toNumber(raw.customer.points),
      total_debt: toNumber(raw.customer.total_debt),
      debt_limit: toNumber(raw.customer.debt_limit),
    } : undefined,
    items: ((raw as RawRow).items as RawRow[] || []).map((item) => ({
      id: item.id,
      invoice_id: item.invoice_id,
      product_id: item.product_id,
      name: item.name,
      price: toNumber(item.price),
      quantity: item.quantity,
      barcode: item.barcode,
    })),
    cashier: raw.cashier,
    user_id: raw.user_id,
    note: raw.note,
    created_at: raw.created_at,
  };
}

export async function fetchSalesInvoices(page?: number, limit?: number): Promise<SaleInvoice[]> {
  const [userId, isAdmin] = await Promise.all([getCurrentUserId(), isCurrentUserAdmin()]);
  let query = supabase
    .from(INVOICE_TABLE)
    .select("*, items:sales_invoice_items(*), customer:customers(*)")
    .order("created_at", { ascending: false });

  if (!isAdmin) query = query.eq("user_id", userId);

  if (limit && page !== undefined) {
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []).map(mapInvoice);
}

export async function fetchSalesInvoicesCount(): Promise<number> {
  const [userId, isAdmin] = await Promise.all([getCurrentUserId(), isCurrentUserAdmin()]);
  let query = supabase
    .from(INVOICE_TABLE)
    .select("*", { count: "exact", head: true });
  if (!isAdmin) query = query.eq("user_id", userId);
  const { count, error } = await query;

  if (error) throw error;
  return count || 0;
}

export async function createSaleInvoice(
  invoice: Omit<SaleInvoice, "id" | "created_at" | "items" | "customer"> & { customer_id?: string | null },
  items: Omit<SaleInvoiceItem, "id" | "invoice_id">[]
): Promise<SaleInvoice> {
  const userId = invoice.user_id || await getCurrentUserId();

  await checkDailyInvoiceLimit(userId);

  // 1. Create invoice first
  const { data: invData, error: invError } = await supabase
    .from(INVOICE_TABLE)
    .insert({
      invoice_number: invoice.invoice_number,
      sale_date: invoice.date,
      sale_time: invoice.time,
      subtotal: invoice.subtotal,
      discount_total: invoice.discount_total,
      discount_type: invoice.discount_type,
      discount_value: invoice.discount_value,
      tax_rate: invoice.tax_rate,
      tax_total: invoice.tax_total,
      second_tax_rate: invoice.second_tax_rate || 0,
      second_tax_total: invoice.second_tax_total || 0,
      total: invoice.total,
      payment_method: invoice.payment_method,
      paid_amount: invoice.paid_amount,
      change_amount: invoice.change_amount,
      debt_amount: invoice.debt_amount || 0,
      customer_id: invoice.customer_id,
      cashier: invoice.cashier,
      user_id: userId,
      note: invoice.note,
    })
    .select("*")
    .single();

  if (invError) throw invError;

  // 2. Insert items
  const invoiceItems = items.map((item) => ({
    invoice_id: invData.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    barcode: item.barcode,
    product_id: item.product_id,
  }));

  const { error: itemsError } = await supabase.from(ITEMS_TABLE).insert(invoiceItems);
  if (itemsError) {
    // Rollback: delete the invoice if items failed
    await supabase.from(INVOICE_TABLE).delete().eq("id", invData.id);
    throw itemsError;
  }

  // 3. Batch decrease stock for all products (single SELECT + parallel UPDATEs)
  const productIds = [...new Set(items.filter((item) => item.product_id).map((item) => item.product_id))];
  if (productIds.length > 0) {
    const { data: stocks } = await supabase
      .from(PRODUCTS_TABLE)
      .select("id, stock")
      .in("id", productIds);

    const stockMap = new Map((stocks || []).map((p: RawRow) => [p.id as string, (p.stock as number) || 0]));

    const updates = productIds.map(async (productId) => {
      const currentStock = stockMap.get(productId) ?? 0;
      const totalQty = items
        .filter((item) => item.product_id === productId)
        .reduce((sum, item) => sum + item.quantity, 0);
      const newStock = Math.max(0, currentStock - totalQty);
      const { error } = await supabase
        .from(PRODUCTS_TABLE)
        .update({ stock: newStock })
        .eq("id", productId);
      return { productId, error };
    });

    const results = await Promise.all(updates);
    const failed = results.filter((r) => r.error);
    if (failed.length > 0) {
      await supabase.from(INVOICE_TABLE).delete().eq("id", invData.id);
      throw new Error(`فشل تحديث المخزون: ${failed.map((f) => f.error!.message).join(", ")}`);
    }
  }

  // 4. Update customer stats if customer_id provided
  if (invoice.customer_id && invoice.total > 0) {
    try {
      const { data: custData } = await supabase
        .from(CUSTOMERS_TABLE)
        .select("total_purchases, total_visits, points")
        .eq("id", invoice.customer_id)
        .single();

      if (custData) {
        const newPurchases = toNumber(custData.total_purchases) + invoice.total;
        const newVisits = toNumber(custData.total_visits) + 1;

        // Get loyalty points per amount from settings
        let pointsPerAmount = 1000;
        try {
          const { data: settingsData } = await supabase
            .from(SETTINGS_TABLE)
            .select("loyalty_points_per_amount, enable_loyalty")
            .eq("id", 1)
            .single();
          if (settingsData?.enable_loyalty) {
            pointsPerAmount = toNumber(settingsData.loyalty_points_per_amount, 1000);
          }
        } catch {
          // Use default if settings fetch fails
        }

        const earnedPoints =
          pointsPerAmount > 0
            ? Math.floor(invoice.total / pointsPerAmount)
            : 0;
        const newPoints = toNumber(custData.points) + earnedPoints;

        await supabase
          .from(CUSTOMERS_TABLE)
          .update({
            total_purchases: newPurchases,
            total_visits: newVisits,
            points: newPoints,
            updated_at: new Date().toISOString(),
          })
          .eq("id", invoice.customer_id);
      }
    } catch {
      // Customer update failure is non-critical — don't rollback the sale
    }
  }

  return mapInvoice({ ...invData, items: invoiceItems });
}
