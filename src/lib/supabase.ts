import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getCurrentUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("User not authenticated");
  return session.user.id;
}

let _cachedAdmin: { id: string; isAdmin: boolean } | null = null;
let _adminCheckPromise: Promise<boolean> | null = null;

export async function isCurrentUserAdmin(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  if (_cachedAdmin?.id === session.user.id) return _cachedAdmin.isAdmin;
  if (_adminCheckPromise) return _adminCheckPromise;
  _adminCheckPromise = supabase.from("profiles").select("role").eq("id", session.user.id).maybeSingle().then(({ data }) => {
    _cachedAdmin = { id: session.user.id, isAdmin: data?.role === "admin" };
    return _cachedAdmin.isAdmin;
  }).finally(() => {
    _adminCheckPromise = null;
  });
  return _adminCheckPromise;
}
