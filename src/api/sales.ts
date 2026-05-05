import { supabase } from "@/lib/supabase";
import { toNumber } from "@/lib/db";
import type { SaleInvoice, SaleInvoiceItem } from "@/types";

const INVOICE_TABLE = "sales_invoices";
const ITEMS_TABLE = "sales_invoice_items";
const PRODUCTS_TABLE = "products";
const CUSTOMERS_TABLE = "customers";
const SETTINGS_TABLE = "store_settings";

function mapInvoice(row: Record<string, unknown>): SaleInvoice {
  const raw = row as any;
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
    } : undefined,
    items: (raw.items || []).map((item: any) => ({
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

export async function fetchSalesInvoices(): Promise<SaleInvoice[]> {
  const { data, error } = await supabase
    .from(INVOICE_TABLE)
    .select("*, items:sales_invoice_items(*), customer:customers(*)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapInvoice);
}

export async function getSaleInvoice(id: string): Promise<SaleInvoice | null> {
  const { data, error } = await supabase
    .from(INVOICE_TABLE)
    .select("*, items:sales_invoice_items(*), customer:customers(*)")
    .eq("id", id)
    .single();

  if (error) return null;
  return mapInvoice(data);
}

export async function createSaleInvoice(
  invoice: Omit<SaleInvoice, "id" | "created_at" | "items" | "customer"> & { customer_id?: string | null },
  items: Omit<SaleInvoiceItem, "id" | "invoice_id">[]
): Promise<SaleInvoice> {
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
      second_tax_rate: (invoice as any).second_tax_rate || 0,
      second_tax_total: (invoice as any).second_tax_total || 0,
      total: invoice.total,
      payment_method: invoice.payment_method,
      paid_amount: invoice.paid_amount,
      change_amount: invoice.change_amount,
      customer_id: invoice.customer_id,
      cashier: invoice.cashier,
      user_id: invoice.user_id,
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

  // 3. Decrease stock for each product
  const stockErrors: Error[] = [];
  for (const item of items) {
    if (!item.product_id) continue;

    const { data: productData } = await supabase
      .from(PRODUCTS_TABLE)
      .select("stock")
      .eq("id", item.product_id)
      .single();

    if (productData) {
      const newStock = Math.max(0, (productData.stock || 0) - item.quantity);
      const { error } = await supabase
        .from(PRODUCTS_TABLE)
        .update({ stock: newStock })
        .eq("id", item.product_id);

      if (error) stockErrors.push(error);
    }
  }

  if (stockErrors.length > 0) {
    // Rollback: delete invoice and items
    await supabase.from(INVOICE_TABLE).delete().eq("id", invData.id);
    throw new Error(`فشل تحديث المخزون: ${stockErrors.map((e) => e.message).join(", ")}`);
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
