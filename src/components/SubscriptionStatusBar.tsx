import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchMyProfile } from "@/api/users";
import { Badge } from "@/components/ui/badge";
import { Clock, ShieldCheck, AlertTriangle, CreditCard, MessageCircle } from "lucide-react";
import type { UserSubscription } from "@/types";

const SUBSCRIPTION_PRICE = "25,000";
const CURRENCY = "د.ع";

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

export default function SubscriptionStatusBar() {
  const { user } = useAuth();
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
          <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
        )}
        <span
          className={
            subscription.status === "trial"
              ? "text-blue-700"
              : isExpiring
              ? "text-orange-700"
              : isExpired
              ? "text-red-700"
              : "text-green-700"
          }
        >
          {subscription.status === "trial"
            ? `تجريبي - متبقي ${days} يوم`
            : isExpired
            ? "انتهى الاشتراك"
            : `نشط - متبقي ${days} يوم`}
        </span>
      </button>

      {showDetails && (
        <div className="fixed top-16 left-4 z-50 w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-4 animate-in slide-in-from-top-2" dir="rtl">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-gray-900 text-sm">حالة الاشتراك</h4>
            <button
              onClick={() => setShowDetails(false)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
              <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-blue-900">
                  {SUBSCRIPTION_PRICE} {CURRENCY} / شهرياً
                </p>
                <p className="text-[10px] text-blue-600">رسوم الاشتراك الشهري</p>
              </div>
            </div>

            <div className="p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">الحالة</span>
                <Badge
                  className={
                    subscription.status === "trial"
                      ? "bg-blue-100 text-blue-800 border-blue-200 text-[10px]"
                      : subscription.status === "active"
                      ? "bg-green-100 text-green-800 border-green-200 text-[10px]"
                      : "bg-red-100 text-red-800 border-red-200 text-[10px]"
                  }
                >
                  {subscription.status === "trial" ? "تجريبي" : subscription.status === "active" ? "نشط" : "منتهي"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">المتبقي</span>
                <span className={`text-xs font-bold ${isExpiring || isExpired ? "text-red-600" : "text-green-600"}`}>
                  {days} يوم
                </span>
              </div>
            </div>

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
          </div>
        </div>
      )}
    </>
  );
}
