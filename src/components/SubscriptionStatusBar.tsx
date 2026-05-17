import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { fetchMyProfile } from "@/api/users";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, CreditCard, MessageCircle, Crown, Zap, Star, Tag } from "lucide-react";
import { getPlan, DISCOUNT_TIERS, getDiscountPrice, getTotalPrice, type PlanType } from "@/constants";
import type { UserSubscription } from "@/types";

function getDaysRemaining(sub: UserSubscription): number {
  const now = new Date();
  if (sub.status === "trial") {
    const end = new Date(sub.trial_end_date);
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }
  if (sub.status === "active" && sub.subscription_end_date) {
    const end = new Date(sub.subscription_end_date);
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }
  return 0;
}

function PlanIcon({ plan }: { plan: PlanType }) {
  if (plan === "pro") return <Crown className="w-3.5 h-3.5 text-amber-500" />;
  if (plan === "basic") return <Zap className="w-3.5 h-3.5 text-blue-500" />;
  return <Star className="w-3.5 h-3.5 text-muted-foreground" />;
}

export default function SubscriptionStatusBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchMyProfile().then((data) => {
      if (data?.subscription) {
        setSubscription(data.subscription);
      }
    });
  }, [user]);

  if (!subscription) return null;

  const days = getDaysRemaining(subscription);
  const isExpiring = days <= 3 && days > 0;
  const isExpired = days === 0 && (subscription.status === "trial" || subscription.status === "active");
  const plan = subscription.status === "active" ? getPlan(subscription.plan) : null;
  const isFree = plan?.key === "free";

  return (
    <>
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:shadow-sm"
        style={{
          background:
            subscription.status === "trial"
              ? "linear-gradient(135deg, #dbeafe, #ede9fe)"
              : isExpiring
              ? "linear-gradient(135deg, #fee2e2, #fef3c7)"
              : isExpired
              ? "linear-gradient(135deg, #fee2e2, #fce7f3)"
              : isFree
              ? "linear-gradient(135deg, #f3f4f6, #e5e7eb)"
              : "linear-gradient(135deg, #dcfce7, #dbeafe)",
          border:
            subscription.status === "trial"
              ? "1px solid #93c5fd"
              : isExpiring
              ? "1px solid #fca5a5"
              : isExpired
              ? "1px solid #fca5a5"
              : "1px solid #86efac",
        }}
      >
        {subscription.status === "trial" ? (
          <Clock className="w-3.5 h-3.5 text-blue-600" />
        ) : isExpiring ? (
          <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
        ) : isExpired ? (
          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
        ) : (
          <PlanIcon plan={(subscription.plan || "free") as PlanType} />
        )}
        <span
          className={
            subscription.status === "trial"
              ? "text-primary/80"
              : isExpiring
              ? "text-orange-700"
              : isExpired
              ? "text-red-700"
              : isFree
              ? "text-foreground/80"
              : "text-green-700"
          }
        >
          {subscription.status === "trial"
            ? `تجريبي - متبقي ${days} يوم`
            : isExpired
            ? "انتهى الاشتراك"
            : isFree
            ? `مجاني`
            : `نشط - متبقي ${days} يوم`}
        </span>
      </button>

      {showDetails && (
        <div className="fixed top-16 left-4 z-50 w-80 bg-white rounded-xl shadow-xl border border-gray-200 p-4 animate-in slide-in-from-top-2" dir="rtl">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-foreground text-sm">حالة الاشتراك</h4>
            <button
              onClick={() => setShowDetails(false)}
              className="text-muted-foreground/60 hover:text-muted-foreground text-lg leading-none"
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            {plan && (
              <div className={`p-3 rounded-lg bg-gradient-to-r ${plan.gradient} text-white`}>
                <div className="flex items-center gap-2">
                  <PlanIcon plan={plan.key} />
                  <div>
                    <p className="text-sm font-bold">باقة {plan.nameAr}</p>
                    <p className="text-xs opacity-90">
                      {plan.key === "free" ? "مجاني مدى الحياة" : `${plan.monthlyPrice.toLocaleString()} د.ع / شهرياً`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className={`p-2 rounded-lg ${isExpiring ? "bg-red-50" : "bg-muted/50"}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">الحالة</span>
                <Badge
                  className={
                    subscription.status === "trial"
                      ? "bg-primary/10 text-primary border-primary/20 text-[10px]"
                      : subscription.status === "active"
                      ? "bg-green-100 text-green-800 border-green-200 text-[10px]"
                      : "bg-red-100 text-red-800 border-red-200 text-[10px]"
                  }
                >
                  {subscription.status === "trial" ? "تجريبي" : subscription.status === "active" ? "نشط" : "منتهي"}
                </Badge>
              </div>
              {!isFree && subscription.status === "active" && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">المتبقي</span>
                  <span className={`text-xs font-bold ${isExpiring || isExpired ? "text-red-600" : "text-green-600"}`}>
                    {days} يوم
                  </span>
                </div>
              )}
            </div>

            {plan && plan.key !== "free" && (
              <>
                <div className="border-t border-gray-100 pt-2">
                  <p className="text-xs font-semibold text-foreground/80 mb-2">خصومات الاشتراك طويل المدى:</p>
                  <div className="space-y-1">
                    {DISCOUNT_TIERS.filter((t) => t.discountPercent > 0).map((tier) => (
                      <div key={tier.months} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{tier.label} (خصم {tier.discountPercent}%)</span>
                        <span className="font-bold text-green-700">
                          {getDiscountPrice(plan.monthlyPrice, tier.discountPercent).toLocaleString()} د.ع / شهرياً
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-amber-50 rounded-lg p-2 border border-amber-100">
                  <div className="flex items-start gap-2">
                    <CreditCard className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-900">الأسعار مع الخصم:</p>
                      <div className="mt-1 space-y-0.5">
                        {DISCOUNT_TIERS.filter((t) => t.discountPercent > 0).map((tier) => (
                          <p key={tier.months} className="text-[10px] text-amber-700">
                            {tier.label}: {getTotalPrice(plan.monthlyPrice, tier.months, tier.discountPercent).toLocaleString()} د.ع (بدلاً من {(plan.monthlyPrice * tier.months).toLocaleString()})
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {plan && plan.key === "free" && (
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                <p className="text-xs text-amber-800 font-medium mb-2">للحصول على الميزات الكاملة:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white rounded p-2 text-center border border-primary/20">
                    <p className="font-bold text-primary/80">أساسي</p>
                    <p className="text-blue-600">10,000 د.ع</p>
                  </div>
                  <div className="bg-white rounded p-2 text-center border border-purple-100">
                    <p className="font-bold text-purple-700">برو</p>
                    <p className="text-purple-600">25,000 د.ع</p>
                  </div>
                </div>
              </div>
            )}

            {!plan && (
              <div className="p-2 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-start gap-2">
                  <MessageCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-purple-900">للتجديد أو التفعيل</p>
                    <p className="text-[10px] text-purple-700 mt-0.5">
                      يرجى مراسلة الدعم الفني عبر واتساب لتجديد الاشتراك أو تفعيل حسابك
                    </p>
                  </div>
                </div>
              </div>
            )}

            <a
              onClick={(e) => { e.preventDefault(); navigate("/pricing"); setShowDetails(false); }}
              href="/pricing"
              className="flex items-center justify-center gap-1.5 w-full p-2 rounded-lg bg-gradient-to-r from-primary/5 to-purple-50/30 border border-primary/20 text-xs font-bold text-primary/80 hover:from-primary/10 hover:to-purple-50/40 transition-all cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5" />
              عرض كل الباقات والأسعار
            </a>
          </div>
        </div>
      )}
    </>
  );
}
