import type { ComponentType } from "react";
import {
  Clock4, Wallet, CheckCircle2, AlertTriangle,
  DollarSign, CreditCard, ArrowRightLeft,
} from "lucide-react";

export const STATUS_MAP: Record<string, { label: string; color: string; icon: ComponentType<{ className?: string }> }> = {
  active: { label: "نشط", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Clock4 },
  partially_paid: { label: "مدفوع جزئياً", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Wallet },
  paid: { label: "مدفوع", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  overdue: { label: "متأخر", color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle },
};

export const PAYMENT_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  cash: DollarSign, card: CreditCard, transfer: ArrowRightLeft,
};

export const PAYMENT_LABELS: Record<string, string> = {
  cash: "نقداً", card: "بطاقة", transfer: "تحويل",
};

export function getDaysDiff(dateStr?: string): number {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getDueStatus(dateStr?: string): { label: string; color: string } {
  if (!dateStr) return { label: "غير محدد", color: "text-gray-400" };
  const days = getDaysDiff(dateStr);
  if (days < 0) return { label: `متأخر ${Math.abs(days)} ${arabicPlural(Math.abs(days), "يوم", "يومان", "أيام")}`, color: "text-red-600" };
  if (days === 0) return { label: "اليوم", color: "text-amber-600" };
  return { label: `متبقي ${days} ${arabicPlural(days, "يوم", "يومان", "أيام")}`, color: days <= 3 ? "text-blue-600" : "text-emerald-600" };
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function defaultDueDate(): string {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function arabicPlural(n: number, singular: string, dual: string, plural: string): string {
  if (n === 1) return singular;
  if (n === 2) return dual;
  if (n >= 3 && n <= 10) return plural;
  return plural;
}
