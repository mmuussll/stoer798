import { supabase } from "@/lib/supabase";
import { toNumber } from "@/lib/db";
import type { Debt, DebtPayment, DebtSummary } from "@/types";

const DEBTS_TABLE = "debts";
const PAYMENTS_TABLE = "debt_payments";

type RawRow = Record<string, unknown>;

function mapDebt(row: RawRow): Debt {
  return {
    id: row.id as string,
    customer_id: row.customer_id as string,
    customer_name: (row.customer_name as string) || "",
    customer_phone: (row.customer_phone as string) || "",
    invoice_id: row.invoice_id as string | undefined,
    invoice_number: row.invoice_number as string | undefined,
    total_amount: toNumber(row.total_amount),
    remaining_amount: toNumber(row.remaining_amount),
    status: (row.status as string) || "active",
    due_date: row.due_date as string | undefined,
    guarantor_name: row.guarantor_name as string | undefined,
    guarantor_phone: row.guarantor_phone as string | undefined,
    debtor_phone: row.debtor_phone as string | undefined,
    debt_items: Array.isArray(row.debt_items) ? row.debt_items as Debt["debt_items"] : [],
    notes: row.notes as string | undefined,
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
  };
}

function mapPayment(row: RawRow): DebtPayment {
  return {
    id: row.id as string,
    debt_id: row.debt_id as string,
    customer_id: row.customer_id as string,
    amount: toNumber(row.amount),
    payment_method: (row.payment_method as string) || "cash",
    payment_date: row.payment_date as string,
    payment_time: row.payment_time as string | undefined,
    notes: row.notes as string | undefined,
    cashier: row.cashier as string | undefined,
    user_id: row.user_id as string | undefined,
    created_at: row.created_at as string | undefined,
  };
}

// ==================== DEBTS ====================

export async function fetchDebts(): Promise<Debt[]> {
  const { data, error } = await supabase
    .from(DEBTS_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapDebt);
}

export async function getDebt(id: string): Promise<Debt | null> {
  const { data, error } = await supabase
    .from(DEBTS_TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return mapDebt(data as unknown as RawRow);
}

export async function fetchCustomerDebts(customerId: string): Promise<Debt[]> {
  const { data, error } = await supabase
    .from(DEBTS_TABLE)
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapDebt);
}

export async function fetchActiveDebts(): Promise<Debt[]> {
  const { data, error } = await supabase
    .from(DEBTS_TABLE)
    .select("*")
    .in("status", ["active", "partially_paid", "overdue"])
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapDebt);
}

export async function fetchOverdueDebts(): Promise<Debt[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from(DEBTS_TABLE)
    .select("*")
    .lt("due_date", today)
    .in("status", ["active", "partially_paid", "overdue"])
    .order("due_date", { ascending: true });

  if (error) throw error;
  return (data || []).map(mapDebt);
}

export async function createDebt(debt: {
  customer_id: string;
  customer_name: string;
  customer_phone?: string;
  invoice_id?: string;
  invoice_number?: string;
  total_amount: number;
  remaining_amount: number;
  status: string;
  due_date?: string;
  guarantor_name?: string;
  guarantor_phone?: string;
  debtor_phone?: string;
  debt_items?: Debt["debt_items"];
  notes?: string;
}): Promise<Debt> {
  const { data, error } = await supabase
    .from(DEBTS_TABLE)
    .insert({
      customer_id: debt.customer_id,
      customer_name: debt.customer_name,
      customer_phone: debt.customer_phone || "",
      invoice_id: debt.invoice_id || null,
      invoice_number: debt.invoice_number || null,
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
    .select("*")
    .single();

  if (error) throw error;

  // Update customer's total_debt
  const { data: custRow } = await supabase
    .from("customers")
    .select("total_debt")
    .eq("id", debt.customer_id)
    .single();

  if (custRow) {
    const currentDebt = toNumber((custRow as Record<string, unknown>).total_debt);
    const newDebt = currentDebt + debt.remaining_amount;
    await supabase
      .from("customers")
      .update({ total_debt: newDebt, updated_at: new Date().toISOString() })
      .eq("id", debt.customer_id);
  }

  return mapDebt(data as unknown as RawRow);
}

export async function updateDebt(
  id: string,
  updates: { total_amount?: number; status?: string; due_date?: string; notes?: string; remaining_amount?: number; guarantor_name?: string; guarantor_phone?: string; debtor_phone?: string }
): Promise<Debt> {
  const payload: Record<string, unknown> = {};
  if (updates.total_amount !== undefined) payload.total_amount = updates.total_amount;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.due_date !== undefined) payload.due_date = updates.due_date;
  if (updates.notes !== undefined) payload.notes = updates.notes;
  if (updates.remaining_amount !== undefined) payload.remaining_amount = updates.remaining_amount;
  if (updates.guarantor_name !== undefined) payload.guarantor_name = updates.guarantor_name;
  if (updates.guarantor_phone !== undefined) payload.guarantor_phone = updates.guarantor_phone;
  if (updates.debtor_phone !== undefined) payload.debtor_phone = updates.debtor_phone;
  payload.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from(DEBTS_TABLE)
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return mapDebt(data as unknown as RawRow);
}

export async function cancelDebt(id: string): Promise<void> {
  // Fetch debt first to get remaining_amount and customer_id
  const { data: debtRow } = await supabase
    .from(DEBTS_TABLE)
    .select("remaining_amount, customer_id")
    .eq("id", id)
    .single();

  const debt = debtRow as Record<string, unknown> | null;
  const remaining = toNumber(debt?.remaining_amount);
  const customerId = debt?.customer_id as string | undefined;

  // Mark debt as cancelled with zero remaining
  const { error } = await supabase
    .from(DEBTS_TABLE)
    .update({ status: "cancelled", remaining_amount: 0, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;

  // Restore customer's total_debt by subtracting the cancelled remaining
  if (customerId && remaining > 0) {
    const { data: custRow } = await supabase
      .from("customers")
      .select("total_debt")
      .eq("id", customerId)
      .single();

    if (custRow) {
      const currentDebt = toNumber((custRow as Record<string, unknown>).total_debt);
      const newDebt = Math.max(0, currentDebt - remaining);
      await supabase
        .from("customers")
        .update({ total_debt: newDebt, updated_at: new Date().toISOString() })
        .eq("id", customerId);
    }
  }
}

// ==================== DEBT PAYMENTS ====================

export async function fetchPayments(debtId?: string): Promise<DebtPayment[]> {
  let query = supabase
    .from(PAYMENTS_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (debtId) query = query.eq("debt_id", debtId);

  const { data, error } = await query;

  if (error) throw error;
  return (data || []).map(mapPayment);
}

export async function createDebtPayment(payment: {
  debt_id: string;
  customer_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  payment_time?: string;
  notes?: string;
  cashier?: string;
  user_id?: string;
}): Promise<DebtPayment> {
  // 1. Insert payment record
  const { data, error } = await supabase
    .from(PAYMENTS_TABLE)
    .insert({
      debt_id: payment.debt_id,
      customer_id: payment.customer_id,
      amount: payment.amount,
      payment_method: payment.payment_method,
      payment_date: payment.payment_date,
      payment_time: payment.payment_time || null,
      notes: payment.notes || null,
      cashier: payment.cashier || null,
      user_id: payment.user_id || null,
    })
    .select("*")
    .single();

  if (error) throw error;

  // 2. Fetch current debt to calculate new remaining
  const { data: debtRow } = await supabase
    .from(DEBTS_TABLE)
    .select("remaining_amount, total_amount, status")
    .eq("id", payment.debt_id)
    .single();

  if (debtRow) {
    const remaining = toNumber((debtRow as Record<string, unknown>).remaining_amount);
    const total = toNumber((debtRow as Record<string, unknown>).total_amount);
    const newRemaining = Math.max(0, remaining - payment.amount);
    const paidSoFar = total - newRemaining;

    let newStatus: string;
    if (newRemaining <= 0) {
      newStatus = "paid";
    } else if (paidSoFar > 0) {
      newStatus = "partially_paid";
    } else {
      newStatus = (debtRow as Record<string, unknown>).status as string || "active";
    }

    await supabase
      .from(DEBTS_TABLE)
      .update({ remaining_amount: newRemaining, status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", payment.debt_id);
  }

  // 3. Update customer's total_debt (subtract payment)
  const { data: custRow } = await supabase
    .from("customers")
    .select("total_debt")
    .eq("id", payment.customer_id)
    .single();

  if (custRow) {
    const currentDebt = toNumber((custRow as Record<string, unknown>).total_debt);
    const newDebt = Math.max(0, currentDebt - payment.amount);
    await supabase
      .from("customers")
      .update({ total_debt: newDebt, updated_at: new Date().toISOString() })
      .eq("id", payment.customer_id);
  }

  return mapPayment(data as unknown as RawRow);
}

export async function cancelDebtPayment(id: string): Promise<void> {
  // Fetch payment to get amount, debt_id, and customer_id
  const { data: paymentRow } = await supabase
    .from(PAYMENTS_TABLE)
    .select("amount, debt_id, customer_id, notes")
    .eq("id", id)
    .single();

  const payment = paymentRow as Record<string, unknown> | null;
  if (!payment) throw new Error("الدفعة غير موجودة");

  const amount = toNumber(payment.amount);
  const debtId = payment.debt_id as string;
  const customerId = payment.customer_id as string;
  const currentNote = (payment.notes as string) || "";
  const cancelledNote = currentNote ? `${currentNote} [ملغاة]` : "[ملغاة]";

  // Mark payment as cancelled
  const { error } = await supabase
    .from(PAYMENTS_TABLE)
    .update({ notes: cancelledNote })
    .eq("id", id);
  if (error) throw error;

  // Restore debt's remaining_amount
  if (amount > 0) {
    const { data: debtRow } = await supabase
      .from(DEBTS_TABLE)
      .select("remaining_amount, total_amount, status")
      .eq("id", debtId)
      .single();

    if (debtRow) {
      const remaining = toNumber((debtRow as Record<string, unknown>).remaining_amount);
      const total = toNumber((debtRow as Record<string, unknown>).total_amount);
      const newRemaining = remaining + amount;
      const paidSoFar = total - newRemaining;

      let newStatus: string;
      if (newRemaining >= total) {
        newStatus = "active";
      } else if (paidSoFar > 0) {
        newStatus = "partially_paid";
      } else {
        newStatus = "active";
      }

      await supabase
        .from(DEBTS_TABLE)
        .update({ remaining_amount: newRemaining, status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", debtId);
    }

    // Restore customer's total_debt
    const { data: custRow } = await supabase
      .from("customers")
      .select("total_debt")
      .eq("id", customerId)
      .single();

    if (custRow) {
      const currentDebt = toNumber((custRow as Record<string, unknown>).total_debt);
      const newDebt = currentDebt + amount;
      await supabase
        .from("customers")
        .update({ total_debt: newDebt, updated_at: new Date().toISOString() })
        .eq("id", customerId);
    }
  }
}

// ==================== SUMMARY ====================

export async function getDebtSummary(): Promise<DebtSummary> {
  const { data, error } = await supabase.rpc("get_debt_summary");

  if (error) throw error;

  const result = data as Record<string, unknown>;
  return {
    total_outstanding: toNumber(result.total_outstanding),
    total_overdue: toNumber(result.total_overdue),
    total_active: toNumber(result.total_active),
    total_customers_with_debt: toNumber(result.total_customers_with_debt),
    total_debts: toNumber(result.total_debts),
    customers: Array.isArray(result.customers)
      ? (result.customers as Array<Record<string, unknown>>).map((c) => ({
          id: c.id as string,
          name: (c.name as string) || "",
          phone: c.phone as string | undefined,
          total_debt: toNumber(c.total_debt),
          debt_limit: toNumber(c.debt_limit),
          debt_count: toNumber(c.debt_count),
          oldest_due_date: c.oldest_due_date as string | undefined,
        }))
      : [],
  };
}

export async function searchDebts(term: string): Promise<Debt[]> {
  const { data, error } = await supabase
    .from(DEBTS_TABLE)
    .select("*")
    .or(`customer_name.ilike.%${term}%,customer_phone.ilike.%${term}%,invoice_number.ilike.%${term}%`)
    .in("status", ["active", "partially_paid", "overdue"])
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data || []).map(mapDebt);
}
