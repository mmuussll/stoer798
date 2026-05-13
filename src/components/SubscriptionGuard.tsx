import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchMyProfile } from "@/api/users";
import { isCurrentUserAdmin } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Clock, MessageCircle, Star, Zap, Crown } from "lucide-react";
import { TRIAL_DAYS, WHATSAPP_NUMBER, WHATSAPP_MESSAGE, PLANS, getPlan } from "@/constants";
import type { UserSubscription } from "@/types";

function getDaysRemaining(sub: UserSubscription): number {
  const now = new Date();
  if (sub.status === "trial") {
    const end = new Date(sub.trial_end_date);
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }
  if ((sub.status === "active") && sub.subscription_end_date) {
    const end = new Date(sub.subscription_end_date);
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }
  return 0;
}

function isAccessBlocked(sub: UserSubscription | null, role: string): boolean {
  if (role === "admin") return false;
  if (!sub) return false;
  if (sub.status === "active") {
    const plan = getPlan(sub.plan);
    if (plan.key === "free") return false;
    if (sub.subscription_end_date) {
      return new Date(sub.subscription_end_date) <= new Date();
    }
    return false;
  }
  if (sub.status === "trial") {
    const end = new Date(sub.trial_end_date);
    return end <= new Date();
  }
  return true;
}

function PlanIcon({ plan }: { plan: string }) {
  if (plan === "pro") return <Crown className="w-5 h-5 text-amber-500" />;
  if (plan === "basic") return <Zap className="w-5 h-5 text-blue-500" />;
  return <Star className="w-5 h-5 text-gray-500" />;
}

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, isAdmin: contextIsAdmin } = useAuth();
  const [role, setRole] = useState<string>("user");
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([fetchMyProfile(), isCurrentUserAdmin()])
      .then(([profileData, serverIsAdmin]) => {
        const finalRole = serverIsAdmin || contextIsAdmin || profileData?.role === "admin" ? "admin" : (profileData?.role || "user");
        setRole(finalRole);
        setSubscription(profileData?.subscription || null);
        setLoading(false);
      })
      .catch(() => {
        setRole(contextIsAdmin ? "admin" : "user");
        setLoading(false);
      });
  }, [user, contextIsAdmin]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const blocked = isAccessBlocked(subscription, role);

  if (blocked) {
    const daysRemaining = subscription ? getDaysRemaining(subscription) : 0;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4" dir="rtl">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-700">
              {subscription?.status === "trial" && daysRemaining === 0
                ? "انتهت الفترة التجريبية"
                : "الحساب موقوف"}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {subscription?.status === "trial" && daysRemaining === 0
                ? `انتهت فترة الـ ${TRIAL_DAYS} يوم التجريبية المجانية. يرجى التواصل مع مدير النظام لتفعيل الاشتراك.`
                : subscription?.status === "suspended"
                ? "تم إيقاف حسابك من قبل مدير النظام. يرجى التواصل لمعرفة التفاصيل."
                : "انتهت مدة اشتراكك. يرجى التواصل مع مدير النظام لتجديد الاشتراك."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-red-50 rounded-lg border border-red-100 space-y-2">
              <p className="text-sm text-red-800 font-medium">الباقات المتاحة للتجديد:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white rounded p-2 text-center border border-blue-100">
                  <p className="font-bold text-blue-700">أساسي</p>
                  <p className="text-blue-600">10,000 د.ع / شهرياً</p>
                </div>
                <div className="bg-white rounded p-2 text-center border border-purple-100">
                  <p className="font-bold text-purple-700">برو</p>
                  <p className="text-purple-600">25,000 د.ع / شهرياً</p>
                </div>
              </div>
              <p className="text-xs text-red-600 mt-1">يرجى التواصل مع مدير النظام لتفعيل الاشتراك</p>
            </div>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              مراسلة الدعم عبر واتساب
            </a>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>الحساب: {user?.email}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (subscription?.status === "active") {
    const plan = getPlan(subscription.plan);
    const missing = plan.missingFeatures;
    if (missing.length > 0) {
      return (
        <div className="min-h-screen flex flex-col" dir="rtl">
          <div className={`bg-gradient-to-r ${plan.gradient} text-white px-4 py-2 flex items-center justify-between text-sm`}>
            <div className="flex items-center gap-2">
              <PlanIcon plan={plan.key} />
              <span>باقة {plan.nameAr} - بعض الميزات غير متاحة</span>
            </div>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("السلام عليكم، أرغب في الترقية إلى باقة برو")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs font-medium transition-colors"
            >
              ترقية إلى برو
            </a>
          </div>
          {children}
        </div>
      );
    }
  }

  if (subscription?.status === "trial") {
    const daysRemaining = getDaysRemaining(subscription);
    if (daysRemaining <= 3 && daysRemaining > 0) {
      return (
        <div className="min-h-screen flex flex-col" dir="rtl">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>الفترة التجريبية تنتهي خلال {daysRemaining} أيام</span>
            </div>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs font-medium transition-colors"
            >
              تفعيل الاشتراك
            </a>
          </div>
          {children}
        </div>
      );
    }
  }

  return <>{children}</>;
}
