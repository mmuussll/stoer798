import type { PlanType } from "@/types";

export const CURRENCY = "د.ع";
export const TRIAL_DAYS = 14;
export const WHATSAPP_NUMBER = "9647850572326";
export const WHATSAPP_MESSAGE = encodeURIComponent("السلام عليكم، أرغب في تجديد اشتراكي في نظام الكوثر للحسابات");

export type { PlanType };

export interface PlanDefinition {
  key: PlanType;
  name: string;
  nameAr: string;
  monthlyPrice: number;
  color: string;
  gradient: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  maxProducts: number;
  maxCustomers: number;
  maxDailyInvoices: number;
  features: string[];
  missingFeatures: string[];
}

export const PLANS: Record<PlanType, PlanDefinition> = {
  free: {
    key: "free",
    name: "Free",
    nameAr: "مجاني",
    monthlyPrice: 0,
    color: "#6b7280",
    gradient: "from-gray-500 to-slate-600",
    borderColor: "border-gray-200",
    badgeBg: "bg-gray-100",
    badgeText: "text-gray-700",
    maxProducts: 30,
    maxCustomers: 20,
    maxDailyInvoices: 25,
    features: [
      "حتى 30 منتج",
      "حتى 20 زبون",
      "حتى 25 فاتورة يومياً",
      "نظام كاشير أساسي",
      "جلسات النقدية",
      "المرتجعات والاستبدال",
      "تخزين سحابي آمن",
    ],
    missingFeatures: [
      "نظام الديون",
      "التقارير والتحليلات",
      "إدارة المشتريات",
    ],
  },
  basic: {
    key: "basic",
    name: "Basic",
    nameAr: "أساسي",
    monthlyPrice: 10000,
    color: "#2563eb",
    gradient: "from-blue-500 to-indigo-600",
    borderColor: "border-blue-200",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
    maxProducts: 300,
    maxCustomers: 150,
    maxDailyInvoices: 100,
    features: [
      "حتى 300 منتج",
      "حتى 150 زبون",
      "حتى 100 فاتورة يومياً",
      "نظام كاشير متقدم",
      "جلسات النقدية",
      "نظام الديون",
      "تقارير أساسية",
      "تخزين سحابي آمن",
    ],
    missingFeatures: [
      "إدارة المشتريات",
      "المرتجعات والاستبدال",
      "تقارير متقدمة",
    ],
  },
  pro: {
    key: "pro",
    name: "Pro",
    nameAr: "برو",
    monthlyPrice: 25000,
    color: "#7c3aed",
    gradient: "from-purple-500 to-violet-600",
    borderColor: "border-purple-200",
    badgeBg: "bg-purple-100",
    badgeText: "text-purple-700",
    maxProducts: Infinity,
    maxCustomers: Infinity,
    maxDailyInvoices: Infinity,
    features: [
      "كل الميزات بدون استثناء",
      "عدد غير محدود من المنتجات",
      "عدد غير محدود من الزبائن",
      "فواتير غير محدودة",
      "نظام كاشير متكامل",
      "جلسات النقدية",
      "نظام الديون المتقدم",
      "تقارير وتحليلات شاملة",
      "إدارة المشتريات",
      "المرتجعات والاستبدال",
      "تخزين سحابي آمن",
      "تحديثات مستمرة مجانية",
    ],
    missingFeatures: [],
  },
};

export interface DiscountTier {
  months: number;
  discountPercent: number;
  label: string;
  labelAr: string;
}

export const DISCOUNT_TIERS: DiscountTier[] = [
  { months: 1, discountPercent: 0, label: "شهري", labelAr: "شهري" },
  { months: 3, discountPercent: 10, label: "3 أشهر", labelAr: "3 أشهر" },
  { months: 6, discountPercent: 20, label: "6 أشهر", labelAr: "6 أشهر" },
  { months: 12, discountPercent: 30, label: "سنة", labelAr: "سنة" },
];

export function getPlan(planType: string | undefined | null): PlanDefinition {
  if (planType === "basic") return PLANS.basic;
  if (planType === "pro") return PLANS.pro;
  return PLANS.free;
}

export function getDiscountPrice(monthlyPrice: number, discountPercent: number): number {
  return Math.round(monthlyPrice * (1 - discountPercent / 100));
}

export function getTotalPrice(monthlyPrice: number, months: number, discountPercent: number): number {
  return getDiscountPrice(monthlyPrice, discountPercent) * months;
}
