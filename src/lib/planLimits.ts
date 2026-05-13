import { supabase, isCurrentUserAdmin } from "@/lib/supabase";
import { getPlan, type PlanType } from "@/constants";

async function getCurrentUserPlan(): Promise<{ plan: PlanType; isAdmin: boolean } | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const admin = await isCurrentUserAdmin();
  if (admin) return { plan: "pro", isAdmin: true };

  const { data: sub } = await supabase
    .from("user_subscriptions")
    .select("plan, status")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (!sub || sub.status !== "active") return null;

  const plan = (sub.plan || "free") as PlanType;
  return { plan, isAdmin: false };
}

export class PlanLimitError extends Error {
  constructor(public readonly plan: PlanType, what: string, current: number, max: number) {
    const planName = plan === "free" ? "المجانية" : plan === "basic" ? "الأساسية" : "";
    super(
      `لقد وصلت إلى الحد الأقصى ${planName ? `للباقة ${planName}` : ""}: ${what} (${current}/${max}). يرجى الترقية إلى باقة أعلى.`
    );
    this.name = "PlanLimitError";
  }
}

export async function checkProductLimit(userId: string): Promise<void> {
  const result = await getCurrentUserPlan();
  if (!result || result.isAdmin) return;

  const planDef = getPlan(result.plan);
  if (planDef.maxProducts === Infinity) return;

  const { count, error } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw error;
  if (count !== null && count >= planDef.maxProducts) {
    throw new PlanLimitError(result.plan, "المنتجات", count, planDef.maxProducts);
  }
}

export async function checkCustomerLimit(userId: string): Promise<void> {
  const result = await getCurrentUserPlan();
  if (!result || result.isAdmin) return;

  const planDef = getPlan(result.plan);
  if (planDef.maxCustomers === Infinity) return;

  const { count, error } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw error;
  if (count !== null && count >= planDef.maxCustomers) {
    throw new PlanLimitError(result.plan, "الزبائن", count, planDef.maxCustomers);
  }
}

export async function checkDailyInvoiceLimit(userId: string): Promise<void> {
  const result = await getCurrentUserPlan();
  if (!result || result.isAdmin) return;

  const planDef = getPlan(result.plan);
  if (planDef.maxDailyInvoices === Infinity) return;

  const today = new Date().toISOString().slice(0, 10);
  const { count, error } = await supabase
    .from("sales_invoices")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("date", today)
    .lt("date", today + "T23:59:59Z");

  if (error) throw error;
  if (count !== null && count >= planDef.maxDailyInvoices) {
    throw new PlanLimitError(result.plan, "فواتير اليوم", count, planDef.maxDailyInvoices);
  }
}
