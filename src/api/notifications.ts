import { supabase } from "@/lib/supabase";
import type { Notification } from "@/types";

function mapNotification(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    title: row.title as string,
    message: row.message as string,
    type: (row.type as Notification["type"]) || "system",
    is_read: Boolean(row.is_read),
    created_at: row.created_at as string | undefined,
  };
}

export async function fetchNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data || []).map(mapNotification);
}

export async function fetchUnreadCount(): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("is_read", false);

  if (error) throw error;
  return count || 0;
}

export async function markAsRead(id: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);

  if (error) throw error;
}

export async function markAllAsRead(): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("is_read", false);

  if (error) throw error;
}

export async function deleteNotification(id: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: Notification["type"] = "system"
): Promise<Notification> {
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      title,
      message,
      type,
    })
    .select()
    .single();

  if (error) throw error;
  return mapNotification(data as Record<string, unknown>);
}

export async function broadcastNotification(
  title: string,
  message: string,
  type: Notification["type"] = "system"
): Promise<void> {
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id");

  if (!profiles || profiles.length === 0) return;

  const notifications = profiles.map((p) => ({
    user_id: p.id,
    title,
    message,
    type,
  }));

  const { error } = await supabase
    .from("notifications")
    .insert(notifications);

  if (error) throw error;
}

export function subscribeToNotifications(
  onInsert: (notification: Notification) => void
) {
  const channel = supabase
    .channel("notifications-realtime")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications" },
      (payload) => {
        onInsert(mapNotification(payload.new as Record<string, unknown>));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel).catch(() => {});
  };
}
