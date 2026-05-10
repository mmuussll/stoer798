import { supabase } from "@/lib/supabase";
import { toNumber } from "@/lib/db";
import type { Customer } from "@/types";

const TABLE = "customers";

function mapCustomer(row: Record<string, unknown>): Customer {
  return {
    id: row.id as string,
    name: row.name as string,
    phone: row.phone as string | undefined,
    email: row.email as string | undefined,
    address: row.address as string | undefined,
    total_purchases: toNumber(row.total_purchases),
    total_visits: toNumber(row.total_visits),
    points: toNumber(row.points),
    total_debt: toNumber(row.total_debt),
    debt_limit: toNumber(row.debt_limit),
    note: row.note as string | undefined,
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
  };
}

export async function fetchCustomers(page?: number, limit?: number): Promise<Customer[]> {
  let query = supabase
    .from(TABLE)
    .select("*")
    .order("name", { ascending: true });

  if (limit && page !== undefined) {
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []).map(mapCustomer);
}

export async function fetchCustomersCount(): Promise<number> {
  const { count, error } = await supabase
    .from(TABLE)
    .select("*", { count: "exact", head: true });

  if (error) throw error;
  return count || 0;
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).single();
  if (error) return null;
  return mapCustomer(data);
}

export async function createCustomer(
  customer: Omit<Customer, "id" | "total_purchases" | "total_visits" | "points" | "created_at" | "updated_at">
): Promise<Customer> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      name: customer.name,
      phone: customer.phone || null,
      email: customer.email || null,
      address: customer.address || null,
      note: customer.note || null,
      total_debt: customer.total_debt ?? 0,
      debt_limit: customer.debt_limit ?? 0,
    })
    .select()
    .single();

  if (error) throw error;
  return mapCustomer(data);
}

export async function updateCustomer(
  id: string,
  updates: Partial<Omit<Customer, "id" | "created_at">>
): Promise<Customer> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.email !== undefined) payload.email = updates.email;
  if (updates.address !== undefined) payload.address = updates.address;
  if (updates.note !== undefined) payload.note = updates.note;
  if (updates.debt_limit !== undefined) payload.debt_limit = updates.debt_limit;

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // Sync customer name/phone to all related debt records
  if (updates.name !== undefined || updates.phone !== undefined) {
    const debtUpdate: Record<string, unknown> = {};
    if (updates.name !== undefined) debtUpdate.customer_name = updates.name;
    if (updates.phone !== undefined) debtUpdate.customer_phone = updates.phone;
    await supabase
      .from("debts")
      .update(debtUpdate)
      .eq("customer_id", id);
  }

  return mapCustomer(data);
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

export async function searchCustomers(term: string): Promise<Customer[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .or(`name.ilike.%${term}%,phone.ilike.%${term}%`)
    .order("name")
    .limit(20);

  if (error) throw error;
  return (data || []).map(mapCustomer);
}
