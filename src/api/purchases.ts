import { supabase } from "@/lib/supabase";
import { toNumber } from "@/lib/db";
import type { PurchaseInvoice, PurchaseInvoiceItem } from "@/types";

const INVOICE_TABLE = "purchase_invoices";
const ITEMS_TABLE = "purchase_invoice_items";

function mapInvoice(row: Record<string, unknown>): PurchaseInvoice {
  const raw = row as any;
  return {
    id: raw.id,
    invoice_number: raw.invoice_number,
    supplier: raw.supplier,
    date: raw.purchase_date || raw.date,
    time: raw.purchase_time || raw.time,
    total: toNumber(raw.total),
    user_id: raw.user_id,
    created_at: raw.created_at,
    items: (raw.items || []).map((item: any) => ({
      id: item.id,
      invoice_id: item.invoice_id,
      product_name: item.product_name,
      barcode: item.barcode,
      quantity: item.quantity,
      purchase_price: toNumber(item.purchase_price),
      sale_price: toNumber(item.sale_price),
      category: item.category,
    })),
  };
}

export async function fetchPurchaseInvoices(page?: number, limit?: number): Promise<PurchaseInvoice[]> {
  let query = supabase
    .from(INVOICE_TABLE)
    .select("*, items:purchase_invoice_items(*)")
    .order("created_at", { ascending: false });

  if (limit && page !== undefined) {
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []).map(mapInvoice);
}

export async function createPurchaseInvoice(
  invoice: Omit<PurchaseInvoice, "id" | "created_at" | "items">,
  items: Omit<PurchaseInvoiceItem, "id" | "invoice_id">[]
): Promise<PurchaseInvoice> {
  const { data: invData, error: invError } = await supabase
    .from(INVOICE_TABLE)
    .insert({
      invoice_number: invoice.invoice_number,
      supplier: invoice.supplier,
      purchase_date: invoice.date,
      purchase_time: invoice.time,
      total: invoice.total,
      user_id: invoice.user_id,
    })
    .select()
    .single();

  if (invError) throw invError;

  const invoiceItems = items.map((item) => ({
    invoice_id: invData.id,
    product_name: item.product_name,
    barcode: item.barcode,
    quantity: item.quantity,
    purchase_price: item.purchase_price,
    sale_price: item.sale_price,
    category: item.category,
  }));

  const { error: itemsError } = await supabase.from(ITEMS_TABLE).insert(invoiceItems);
  if (itemsError) {
    await supabase.from(INVOICE_TABLE).delete().eq("id", invData.id);
    throw itemsError;
  }

  return mapInvoice({ ...invData, items: invoiceItems });
}
