import { supabase } from "@/lib/supabase";
import { toNumber } from "@/lib/db";
import type { CashSession } from "@/types";

const TABLE = "cash_sessions";

function mapSession(row: Record<string, unknown>): CashSession {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    cashier_name: row.cashier_name as string,
    start_date: row.start_date as string,
    start_time: row.start_time as string,
    end_date: row.end_date as string | undefined,
    end_time: row.end_time as string | undefined,
    opening_balance: toNumber(row.opening_balance),
    closing_balance: toNumber(row.closing_balance),
    total_sales: toNumber(row.total_sales),
    total_cash: toNumber(row.total_cash),
    total_card: toNumber(row.total_card),
    total_returns: toNumber(row.total_returns),
    invoice_count: toNumber(row.invoice_count),
    expected_cash: toNumber(row.expected_cash),
    difference: toNumber(row.difference),
    status: row.status as "open" | "closed",
    note: row.note as string | undefined,
    created_at: row.created_at as string | undefined,
  };
}

export async function fetchCashSessions(page?: number, limit?: number): Promise<CashSession[]> {
  let query = supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (limit && page !== undefined) {
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []).map(mapSession);
}

export async function fetchCashSessionsCount(): Promise<number> {
  const { count, error } = await supabase
    .from(TABLE)
    .select("*", { count: "exact", head: true });

  if (error) throw error;
  return count || 0;
}

export async function getActiveSession(userId: string): Promise<CashSession | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return mapSession(data);
}

export async function openSession(session: {
  user_id: string;
  cashier_name: string;
  opening_balance: number;
  note?: string;
}): Promise<CashSession> {
  const now = new Date();
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: session.user_id,
      cashier_name: session.cashier_name,
      start_date: now.toISOString().slice(0, 10),
      start_time: now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
      opening_balance: session.opening_balance,
      status: "open",
      note: session.note,
    })
    .select()
    .single();

  if (error) throw error;
  return mapSession(data);
}

export async function closeSession(
  sessionId: string,
  closingBalance: number,
  note?: string
): Promise<CashSession> {
  // 1. Fetch current session stats
  const { data: current, error: fetchError } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", sessionId)
    .single();

  if (fetchError) throw fetchError;

  const session = mapSession(current);
  const now = new Date();
  const expectedCash = session.opening_balance + session.total_cash - session.total_returns;
  const diff = closingBalance - expectedCash;

  // 2. Update session with closing data
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      end_date: now.toISOString().slice(0, 10),
      end_time: now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
      closing_balance: closingBalance,
      status: "closed",
      expected_cash: expectedCash,
      difference: diff,
      note: note || session.note,
    })
    .eq("id", sessionId)
    .select()
    .single();

  if (error) throw error;
  return mapSession(data);
}

export async function updateSessionStats(
  sessionId: string,
  stats: {
    total_sales: number;
    total_cash: number;
    total_card: number;
    total_returns: number;
    invoice_count: number;
  }
): Promise<void> {
  const { error } = await supabase.from(TABLE).update(stats).eq("id", sessionId);
  if (error) throw error;
}
