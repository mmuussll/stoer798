import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchMyProfile } from "@/api/users";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Clock, MessageCircle } from "lucide-react";

const TRIAL_DAYS = 14;
const WHATSAPP_NUMBER = "9647850572326";
const WHATSAPP_MESSAGE = encodeURIComponent("السلام عليكم، أرغب في تجديد اشتراكي في نظام الكوثر للحسابات");

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

function isAccessBlocked(sub: UserSubscription | null, role: string): boolean {
  if (role === "admin") return false;
  if (!sub) return false;
  if (sub.status === "active") {
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

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<string>("user");
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchMyProfile()
      .then((data) => {
        if (data) {
          setRole(data.role);
          setSubscription(data.subscription);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [user]);

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
            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
              <p className="text-sm text-red-800 font-medium">سعر الاشتراك الشهري: 25,000 د.ع</p>
              <p className="text-xs text-red-600 mt-1">يرجى التواصل مع مدير النظام لتجديد الاشتراك</p>
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

  return <>{children}</>;
}
