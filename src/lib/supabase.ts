import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ubbdzoqmyztojonekwms.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViYmR6b3FteXp0b2pvbmVrd21zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4OTQ1MjQsImV4cCI6MjA5MzQ3MDUyNH0.qh3ms53L0ksD-TP9v9eyoem8bDYTitljSObMCYBjuvU";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getCurrentUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("User not authenticated");
  return session.user.id;
}

let _cachedAdmin: { id: string; isAdmin: boolean } | null = null;

export async function isCurrentUserAdmin(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  if (_cachedAdmin?.id === session.user.id) return _cachedAdmin.isAdmin;
  const { data } = await supabase.from("profiles").select("role").eq("id", session.user.id).maybeSingle();
  _cachedAdmin = { id: session.user.id, isAdmin: data?.role === "admin" };
  return _cachedAdmin.isAdmin;
}
