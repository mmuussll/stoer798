import { supabase, getCurrentUserId, isCurrentUserAdmin } from "@/lib/supabase";
import type { Notification } from "@/types";

function mapNotification(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    title: row.title as string,
    message: row.message as string,
    type: (row.type as Notification["type"]) || "system",
    is_read: Boolean(row.is_read),
    expires_at: row.expires_at as string | undefined,
    created_at: row.created_at as string | undefined,
  };
}

export async function fetchNotifications(): Promise<Notification[]> {
  const [userId, isAdmin] = await Promise.all([getCurrentUserId(), isCurrentUserAdmin()]);
  const now = new Date().toISOString();
  let query = supabase
    .from("notifications")
    .select("*")
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("created_at", { ascending: false })
    .limit(50);
  if (!isAdmin) query = query.eq("user_id", userId);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapNotification);
}

export async function fetchAllNotifications(page?: number, limit?: number): Promise<{ data: Notification[]; count: number }> {
  const [userId, isAdmin] = await Promise.all([getCurrentUserId(), isCurrentUserAdmin()]);
  const now = new Date().toISOString();
  let query = supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("created_at", { ascending: false });

  if (!isAdmin) query = query.eq("user_id", userId);

  if (limit && page !== undefined) {
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);
  }

  const { data, count, error } = await query;
  if (error) throw error;
  return { data: (data || []).map(mapNotification), count: count || 0 };
}

export async function fetchUnreadCount(): Promise<number> {
  const [userId, isAdmin] = await Promise.all([getCurrentUserId(), isCurrentUserAdmin()]);
  const now = new Date().toISOString();
  let countQuery = supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("is_read", false)
    .or(`expires_at.is.null,expires_at.gt.${now}`);
  if (!isAdmin) countQuery = countQuery.eq("user_id", userId);
  const { count, error } = await countQuery;
  if (error) throw error;
  return count || 0;
}

export async function markAsRead(id: string): Promise<void> {
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  if (error) throw error;
}

export async function markAllAsRead(): Promise<void> {
  const [userId, isAdmin] = await Promise.all([getCurrentUserId(), isCurrentUserAdmin()]);
  let query = supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
  if (!isAdmin) query = query.eq("user_id", userId);
  const { error } = await query;
  if (error) throw error;
}

export async function deleteNotification(id: string): Promise<void> {
  const { error } = await supabase.from("notifications").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteAllNotifications(): Promise<void> {
  const [userId, isAdmin] = await Promise.all([getCurrentUserId(), isCurrentUserAdmin()]);
  let query = supabase.from("notifications").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (!isAdmin) query = query.eq("user_id", userId);
  const { error } = await query;
  if (error) throw error;
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: Notification["type"] = "system",
  expiresInHours?: number
): Promise<Notification> {
  const payload: Record<string, unknown> = { user_id: userId, title, message, type };
  if (expiresInHours && expiresInHours > 0) {
    payload.expires_at = new Date(Date.now() + expiresInHours * 3600000).toISOString();
  }
  const { data, error } = await supabase.from("notifications").insert(payload).select().single();
  if (error) throw error;
  return mapNotification(data as Record<string, unknown>);
}

export async function broadcastNotification(
  title: string,
  message: string,
  type: Notification["type"] = "system",
  expiresInHours?: number
): Promise<void> {
  const { data: profiles } = await supabase.from("profiles").select("id");
  if (!profiles || profiles.length === 0) return;

  const payload: Record<string, unknown> = { title, message, type };
  if (expiresInHours && expiresInHours > 0) {
    payload.expires_at = new Date(Date.now() + expiresInHours * 3600000).toISOString();
  }

  const notifications = profiles.map((p) => ({ user_id: p.id, ...payload }));
  const { error } = await supabase.from("notifications").insert(notifications);
  if (error) throw error;
}

export function subscribeToNotifications(
  onInsert: (notification: Notification) => void
) {
  const channel = supabase
    .channel("notifications-realtime")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
      onInsert(mapNotification(payload.new as Record<string, unknown>));
    })
    .subscribe();
  return () => { supabase.removeChannel(channel).catch(() => {}); };
}
