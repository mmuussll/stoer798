import { supabase } from "@/lib/supabase";
import type { UserWithSubscription, UserSubscription } from "@/types";

export async function fetchUsers(): Promise<UserWithSubscription[]> {
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (profilesError) throw profilesError;

  const { data: subscriptions, error: subsError } = await supabase
    .from("user_subscriptions")
    .select("*");

  if (subsError) throw subsError;

  const subsMap = new Map<string, UserSubscription>();
  (subscriptions || []).forEach((row) => {
    subsMap.set(row.user_id as string, mapSubscription(row));
  });

  return (profiles || []).map((p) => ({
    id: p.id as string,
    email: (p.email as string) || "",
    full_name: (p.full_name as string) || "",
    phone: (p.phone as string) || undefined,
    role: (p.role as string) || "user",
    created_at: p.created_at as string | undefined,
    subscription: subsMap.get(p.id as string) || null,
  }));
}

export async function fetchMyProfile(): Promise<{
  role: string;
  subscription: UserSubscription | null;
} | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error || !profile) return null;

    const { data: sub } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    return {
      role: (profile.role as string) || "user",
      subscription: sub ? mapSubscription(sub) : null,
    };
  } catch {
    return null;
  }
}

export async function activateSubscription(
  userId: string,
  days: number,
  note?: string
): Promise<UserSubscription> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const now = new Date();
  const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const existing = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (existing.data) {
    const { data, error } = await supabase
      .from("user_subscriptions")
      .update({
        status: "active",
        is_trial_used: existing.data.is_trial_used,
        subscription_start_date: now.toISOString(),
        subscription_end_date: endDate.toISOString(),
        activated_by: session?.user.id,
        note: note || null,
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return mapSubscription(data);
  }

  const { data, error } = await supabase
    .from("user_subscriptions")
    .insert({
      user_id: userId,
      status: "active",
      is_trial_used: false,
      subscription_start_date: now.toISOString(),
      subscription_end_date: endDate.toISOString(),
      activated_by: session?.user.id,
      note: note || null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapSubscription(data);
}

export async function suspendUser(userId: string): Promise<UserSubscription> {
  const { data, error } = await supabase
    .from("user_subscriptions")
    .update({ status: "suspended" })
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return mapSubscription(data);
}

export async function extendSubscription(
  userId: string,
  extraDays: number
): Promise<UserSubscription> {
  const { data: existing } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const now = new Date();

  let currentEnd: Date;
  if (existing && existing.subscription_end_date) {
    const existingEnd = new Date(existing.subscription_end_date as string);
    currentEnd = existingEnd > now ? existingEnd : now;
  } else {
    currentEnd = now;
  }

  const newEnd = new Date(currentEnd.getTime() + extraDays * 24 * 60 * 60 * 1000);
  const payload: Record<string, unknown> = {
    status: "active",
    subscription_end_date: newEnd.toISOString(),
    subscription_start_date: existing?.subscription_start_date || now.toISOString(),
    is_trial_used: existing?.is_trial_used ?? false,
  };

  if (existing) {
    const { data, error } = await supabase
      .from("user_subscriptions")
      .update(payload)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return mapSubscription(data);
  }

  const { data, error } = await supabase
    .from("user_subscriptions")
    .insert({
      user_id: userId,
      ...payload,
    })
    .select()
    .single();

  if (error) throw error;
  return mapSubscription(data);
}

function mapSubscription(row: Record<string, unknown>): UserSubscription {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    status: (row.status as UserSubscription["status"]) || "trial",
    trial_start_date: row.trial_start_date as string,
    trial_end_date: row.trial_end_date as string,
    is_trial_used: Boolean(row.is_trial_used),
    subscription_start_date: row.subscription_start_date as string | undefined,
    subscription_end_date: row.subscription_end_date as string | undefined,
    activated_by: row.activated_by as string | undefined,
    note: row.note as string | undefined,
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
  };
}
