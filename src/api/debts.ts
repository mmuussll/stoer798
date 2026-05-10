import { supabase } from "@/lib/supabase";
import { toNumber, type RawRow } from "@/lib/db";
import type { Debt, DebtPayment, DebtSummary } from "@/types";

const DEBTS_TABLE = "debts";
const PAYMENTS_TABLE = "debt_payments";

function mapDebt(row: RawRow): Debt {
  const r = row as Record<string, unknown>;
  return {
    id: r.id,
    customer_id: r.customer_id,
    customer: r.customer ? {
      id: r.customer.id,
      name: r.customer.name,
      phone: r.customer.phone,
      email: r.customer.email,
      address: r.customer.address,
      total_purchases: toNumber(r.customer.total_purchases),
      total_visits: toNumber(r.customer.total_visits),
      points: toNumber(r.customer.points),
      total_debt: toNumber(r.customer.total_debt),
      debt_limit: toNumber(r.customer.debt_limit),
      note: r.customer.note,
      created_at: r.customer.created_at,
      updated_at: r.customer.updated_at,
    } : undefined,
    invoice_id: r.invoice_id,
    invoice: r.invoice ? {
      id: r.invoice.id,
      invoice_number: r.invoice.invoice_number,
      date: r.invoice.sale_date || r.invoice.date,
      time: r.invoice.sale_time || r.invoice.time,
      subtotal: toNumber(r.invoice.subtotal),
      discount_total: toNumber(r.invoice.discount_total),
      discount_type: r.invoice.discount_type || "",
      discount_value: toNumber(r.invoice.discount_value),
      tax_rate: toNumber(r.invoice.tax_rate),
      tax_total: toNumber(r.invoice.tax_total),
      total: toNumber(r.invoice.total),
      payment_method: r.invoice.payment_method || "credit",
      paid_amount: toNumber(r.invoice.paid_amount),
      change_amount: toNumber(r.invoice.change_amount),
      debt_amount: toNumber(r.invoice.debt_amount),
      cashier: r.invoice.cashier,
      user_id: r.invoice.user_id,
      items: [],
      created_at: r.invoice.created_at,
    } : undefined,
    total_amount: toNumber(r.total_amount),
    remaining_amount: toNumber(r.remaining_amount),
    status: r.status || "active",
    due_date: r.due_date,
    guarantor_name: r.guarantor_name || undefined,
    guarantor_phone: r.guarantor_phone || undefined,
    debtor_phone: r.debtor_phone || undefined,
    debt_items: Array.isArray(r.debt_items) ? r.debt_items : (typeof r.debt_items === "string" ? JSON.parse(r.debt_items) : []),
    notes: r.notes,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

function mapPayment(row: RawRow): DebtPayment {
  const r = row as Record<string, unknown>;
  return {
    id: r.id,
    debt_id: r.debt_id,
    debt: r.debt ? mapDebt(r.debt) : undefined,
    customer_id: r.customer_id,
    customer: r.customer ? {
      id: r.customer.id,
      name: r.customer.name,
      phone: r.customer.phone,
      email: r.customer.email,
      address: r.customer.address,
      total_purchases: toNumber(r.customer.total_purchases),
      total_visits: toNumber(r.customer.total_visits),
      points: toNumber(r.customer.points),
      total_debt: toNumber(r.customer.total_debt),
      debt_limit: toNumber(r.customer.debt_limit),
    } : undefined,
    invoice_id: r.invoice_id,
    amount: toNumber(r.amount),
    payment_method: r.payment_method || "cash",
    payment_date: r.payment_date,
    payment_time: r.payment_time,
    notes: r.notes,
    cashier: r.cashier,
    user_id: r.user_id,
    created_at: r.created_at,
  };
}

// === DEBTS ===

export async function fetchDebts(page?: number, limit?: number): Promise<Debt[]> {
  let query = supabase
    .from(DEBTS_TABLE)
    .select("*, customer:customers(*), invoice:sales_invoices(*)")
    .order("created_at", { ascending: false });

  if (limit && page !== undefined) {
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []).map(mapDebt);
}

export async function fetchDebtsCount(): Promise<number> {
  const { count, error } = await supabase
    .from(DEBTS_TABLE)
    .select("*", { count: "exact", head: true });

  if (error) throw error;
  return count || 0;
}

export async function getDebt(id: string): Promise<Debt | null> {
  const { data, error } = await supabase
    .from(DEBTS_TABLE)
    .select("*, customer:customers(*), invoice:sales_invoices(*)")
    .eq("id", id)
    .single();

  if (error) return null;
  return mapDebt(data);
}

export async function fetchCustomerDebts(customerId: string): Promise<Debt[]> {
  const { data, error } = await supabase
    .from(DEBTS_TABLE)
    .select("*, customer:customers(*), invoice:sales_invoices(*)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapDebt);
}

export async function fetchActiveDebts(): Promise<Debt[]> {
  const { data, error } = await supabase
    .from(DEBTS_TABLE)
    .select("*, customer:customers(*), invoice:sales_invoices(*)")
    .in("status", ["active", "partially_paid", "overdue"])
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapDebt);
}

export async function fetchOverdueDebts(): Promise<Debt[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from(DEBTS_TABLE)
    .select("*, customer:customers(*), invoice:sales_invoices(*)")
    .lt("due_date", today)
    .in("status", ["active", "partially_paid", "overdue"])
    .order("due_date", { ascending: true });

  if (error) throw error;
  return (data || []).map(mapDebt);
}

export async function createDebt(
  debt: Omit<Debt, "id" | "created_at" | "updated_at" | "customer" | "invoice">
): Promise<Debt> {
  const { data, error } = await supabase
    .from(DEBTS_TABLE)
    .insert({
      customer_id: debt.customer_id,
      invoice_id: debt.invoice_id || null,
      total_amount: debt.total_amount,
      remaining_amount: debt.remaining_amount,
      status: debt.status,
      due_date: debt.due_date || null,
      guarantor_name: debt.guarantor_name || null,
      guarantor_phone: debt.guarantor_phone || null,
      debtor_phone: debt.debtor_phone || null,
      debt_items: debt.debt_items || [],
      notes: debt.notes || null,
    })
    .select("*, customer:customers(*), invoice:sales_invoices(*)")
    .single();

  if (error) throw error;
  return mapDebt(data);
}

export async function updateDebt(
  id: string,
  updates: Partial<Pick<Debt, "status" | "due_date" | "notes" | "remaining_amount" | "guarantor_name" | "guarantor_phone" | "debtor_phone">>
): Promise<Debt> {
  const payload: Record<string, unknown> = {};
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.due_date !== undefined) payload.due_date = updates.due_date;
  if (updates.notes !== undefined) payload.notes = updates.notes;
  if (updates.remaining_amount !== undefined) payload.remaining_amount = updates.remaining_amount;
  if (updates.guarantor_name !== undefined) payload.guarantor_name = updates.guarantor_name;
  if (updates.guarantor_phone !== undefined) payload.guarantor_phone = updates.guarantor_phone;
  if (updates.debtor_phone !== undefined) payload.debtor_phone = updates.debtor_phone;

  const { data, error } = await supabase
    .from(DEBTS_TABLE)
    .update(payload)
    .eq("id", id)
    .select("*, customer:customers(*), invoice:sales_invoices(*)")
    .single();

  if (error) throw error;
  return mapDebt(data);
}

export async function deleteDebt(id: string): Promise<void> {
  const { error } = await supabase.from(DEBTS_TABLE).delete().eq("id", id);
  if (error) throw error;
}

// === DEBT PAYMENTS ===

export async function fetchPayments(debtId?: string, page?: number, limit?: number): Promise<DebtPayment[]> {
  let query = supabase
    .from(PAYMENTS_TABLE)
    .select("*, customer:customers(*), debt:debts(*)")
    .order("created_at", { ascending: false });

  if (debtId) query = query.eq("debt_id", debtId);
  if (limit && page !== undefined) {
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []).map(mapPayment);
}

export async function fetchCustomerPayments(customerId: string): Promise<DebtPayment[]> {
  const { data, error } = await supabase
    .from(PAYMENTS_TABLE)
    .select("*, customer:customers(*), debt:debts(*)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapPayment);
}

export async function createDebtPayment(
  payment: Omit<DebtPayment, "id" | "created_at" | "customer" | "debt">
): Promise<DebtPayment> {
  const { data, error } = await supabase
    .from(PAYMENTS_TABLE)
    .insert({
      debt_id: payment.debt_id,
      customer_id: payment.customer_id,
      invoice_id: payment.invoice_id || null,
      amount: payment.amount,
      payment_method: payment.payment_method,
      payment_date: payment.payment_date,
      payment_time: payment.payment_time || null,
      notes: payment.notes || null,
      cashier: payment.cashier || null,
      user_id: payment.user_id || null,
    })
    .select("*, customer:customers(*), debt:debts(*)")
    .single();

  if (error) throw error;
  return mapPayment(data as unknown as RawRow);
}

export async function deleteDebtPayment(id: string): Promise<void> {
  const { error } = await supabase.from(PAYMENTS_TABLE).delete().eq("id", id);
  if (error) throw error;
}

// === SUMMARY / STATS ===

export async function getDebtSummary(): Promise<DebtSummary> {
  const { data: debts, error } = await supabase
    .from(DEBTS_TABLE)
    .select("*, customer:customers(*)")
    .in("status", ["active", "partially_paid", "overdue"]);

  if (error) throw error;

  const activeDebts = (debts || []) as RawRow[];
  const today = new Date().toISOString().slice(0, 10);

  let total_outstanding = 0;
  let total_overdue = 0;
  let total_active = 0;
  const customerMap = new Map<string, {
    id: string;
    name: string;
    phone?: string;
    total_debt: number;
    debt_limit: number;
    debt_count: number;
    oldest_due_date?: string;
  }>();

  for (const d of activeDebts) {
    const remaining = toNumber(d.remaining_amount);
    total_outstanding += remaining;

    if (d.due_date && d.due_date < today) {
      total_overdue += remaining;
    } else {
      total_active += remaining;
    }

    const c = d.customer;
    if (c) {
      const existing = customerMap.get(c.id);
      if (existing) {
        existing.total_debt += remaining;
        existing.debt_count += 1;
        if (d.due_date && (!existing.oldest_due_date || d.due_date < existing.oldest_due_date)) {
          existing.oldest_due_date = d.due_date;
        }
      } else {
        customerMap.set(c.id, {
          id: c.id,
          name: c.name,
          phone: c.phone,
          total_debt: remaining,
          debt_limit: toNumber(c.debt_limit),
          debt_count: 1,
          oldest_due_date: d.due_date || undefined,
        });
      }
    }
  }

  return {
    total_outstanding,
    total_overdue,
    total_active,
    total_customers_with_debt: customerMap.size,
    total_debts: activeDebts.length,
    customers: Array.from(customerMap.values()).sort((a, b) => b.total_debt - a.total_debt),
  };
}

export async function searchDebts(term: string): Promise<Debt[]> {
  const { data: customers } = await supabase
    .from("customers")
    .select("id")
    .or(`name.ilike.%${term}%,phone.ilike.%${term}%`);

  const customerIds = (customers || []).map((c: RawRow) => c.id as string);

  if (customerIds.length === 0) return [];

  const { data, error } = await supabase
    .from(DEBTS_TABLE)
    .select("*, customer:customers(*), invoice:sales_invoices(*)")
    .in("customer_id", customerIds)
    .in("status", ["active", "partially_paid", "overdue"])
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapDebt);
}
