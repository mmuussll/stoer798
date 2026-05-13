import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchUsers, activateSubscription, suspendUser, extendSubscription, setSubscriptionEndDate, deleteUserAccount } from "@/api/users";
import { createNotification, broadcastNotification, fetchAllNotifications, deleteNotification, deleteAllNotifications } from "@/api/notifications";
import { fetchSettings, updateSettings } from "@/api/settings";
import { fetchSalesInvoices } from "@/api/sales";
import { toNumber } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield, Users, Loader2, Send, Megaphone, Phone, Mail, Eye, CalendarDays, Info, Wrench,
  TrendingUp, Activity, UserPlus, Zap, Clock, UserCheck,
  RefreshCw, CheckCircle, Ban, CreditCard, Crown, Star, Percent,
} from "lucide-react";
import { toast } from "sonner";
import { format, startOfWeek, startOfMonth } from "date-fns";
import { ar } from "date-fns/locale";
import { CURRENCY, PLANS, DISCOUNT_TIERS, getDiscountPrice, getTotalPrice, type PlanType } from "@/constants";
import type { UserWithSubscription, UserSubscription } from "@/types";

type StatCardData = { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; color: string; sub?: string };

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return "—";
  try { return format(new Date(dateStr), "yyyy/MM/dd", { locale: ar }); } catch { return dateStr; }
}
function formatCurrency(amount: number) { return `${amount.toLocaleString()} ${CURRENCY}`; }

const COLORS: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-100", text: "text-blue-600" },
  green: { bg: "bg-emerald-100", text: "text-emerald-600" },
  purple: { bg: "bg-purple-100", text: "text-purple-600" },
  red: { bg: "bg-rose-100", text: "text-rose-600" },
  orange: { bg: "bg-amber-100", text: "text-amber-600" },
  indigo: { bg: "bg-indigo-100", text: "text-indigo-600" },
  teal: { bg: "bg-teal-100", text: "text-teal-600" },
  slate: { bg: "bg-slate-100", text: "text-slate-600" },
};

function StatCard({ card }: { card: StatCardData }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${COLORS[card.color].bg}`}>
          <card.icon className={`w-6 h-6 ${COLORS[card.color].text}`} />
        </div>
        <div>
          <p className="text-xl font-bold">{card.value}</p>
          <p className="text-xs text-muted-foreground">{card.label}</p>
          {card.sub && <p className="text-[10px] text-gray-400">{card.sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function StatSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-4" dir="rtl">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (<Skeleton key={i} className="h-24 rounded-lg" />))}
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const queryClient = useQueryClient();

  const [notifyDialog, setNotifyDialog] = useState(false);
  const [notifyTitle, setNotifyTitle] = useState("");
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifyType, setNotifyType] = useState<string>("system");
  const [notifyTarget, setNotifyTarget] = useState<string>("all");
  const [infoUser, setInfoUser] = useState<UserWithSubscription | null>(null);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [activateDialog, setActivateDialog] = useState(false);
  const [extendDialog, setExtendDialog] = useState(false);
  const [activationDays, setActivationDays] = useState(30);
  const [activationNote, setActivationNote] = useState("");
  const [extendDays, setExtendDays] = useState(30);
  const [expiryHours, setExpiryHours] = useState(0);
  const [endDateDialog, setEndDateDialog] = useState(false);
  const [endDateValue, setEndDateValue] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("pro");
  const [selectedDiscountTier, setSelectedDiscountTier] = useState(0);

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"], queryFn: fetchUsers,
  });
  const { data: settings } = useQuery({
    queryKey: ["store-settings"], queryFn: fetchSettings,
  });
  const { data: invoices = [], isLoading: invLoading } = useQuery({
    queryKey: ["admin-invoices"], queryFn: () => fetchSalesInvoices(),
  });
  const { data: allNotifs, refetch: refetchNotifs } = useQuery({
    queryKey: ["admin-notifications"], queryFn: () => fetchAllNotifications(1, 200),
  });

  const meta = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const weekStart = startOfWeek(now, { weekStartsOn: 6 }).toISOString().slice(0, 10);
    const monthStart = startOfMonth(now).toISOString().slice(0, 10);

    const activeToday = new Set<string>();
    const activeWeek = new Set<string>();
    let todaySales = 0, weekSales = 0, monthSales = 0, todayCount = 0;

    invoices.forEach((inv) => {
      const d = String(inv.date).slice(0, 10);
      const uid = inv.user_id as string;
      const t = toNumber(inv.total);
      if (d === today) { activeToday.add(uid); todaySales += t; todayCount++; }
      if (d >= weekStart) { activeWeek.add(uid); weekSales += t; }
      if (d >= monthStart) monthSales += t;
    });

    const regToday = users.filter((u) => u.created_at && String(u.created_at).slice(0, 10) === today).length;
    const regWeek = users.filter((u) => u.created_at && String(u.created_at).slice(0, 10) >= weekStart).length;
    const regMonth = users.filter((u) => u.created_at && String(u.created_at).slice(0, 10) >= monthStart).length;

    return {
      activeToday: activeToday.size, activeWeek: activeWeek.size,
      todaySales, weekSales, monthSales, todayCount,
      regToday, regWeek, regMonth,
    };
  }, [invoices, users]);

  const stats: StatCardData[] = [
    { label: "المسجلين", value: users.length, icon: Users, color: "blue", sub: "" },
    { label: "نشطون اليوم", value: meta.activeToday, icon: Activity, color: "green", sub: `${meta.todayCount} معاملة` },
    { label: "نشطون هذا الأسبوع", value: meta.activeWeek, icon: TrendingUp, color: "teal", sub: "" },
    { label: "مسجل اليوم", value: meta.regToday, icon: UserPlus, color: "indigo", sub: meta.regToday > 0 ? "مستخدم جديد" : "لا جديد" },
    { label: "مسجل هذا الأسبوع", value: meta.regWeek, icon: UserPlus, color: "purple", sub: "" },
    { label: "مسجل هذا الشهر", value: meta.regMonth, icon: UserCheck, color: "slate", sub: "" },
  ];

  const notifyMutation = useMutation({
    mutationFn: async () => {
      const title = notifyTitle.trim();
      const message = notifyMessage.trim();
      const type = notifyType as "system" | "debt" | "alert" | "info";
      if (notifyTarget === "all") await broadcastNotification(title, message, type, expiryHours > 0 ? expiryHours : undefined);
      else await createNotification(notifyTarget, title, message, type, expiryHours > 0 ? expiryHours : undefined);
    },
    onSuccess: () => {
      toast.success("تم إرسال الإشعار بنجاح");
      setNotifyDialog(false); setNotifyTitle(""); setNotifyMessage(""); setNotifyType("system"); setNotifyTarget("all"); setExpiryHours(0);
      refetchNotifs();
    },
    onError: (err: Error) => toast.error(err.message || "فشل إرسال الإشعار"),
  });

  const maintenanceMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      updateSettings({ maintenance_mode: enabled, maintenance_message: enabled ? (maintenanceMessage || undefined) : undefined }),
    onSuccess: (_d: unknown, enabled: boolean) => {
      toast.success(enabled ? "تم تفعيل وضع الصيانة" : "تم إيقاف وضع الصيانة");
      queryClient.invalidateQueries({ queryKey: ["store-settings"] });
    },
    onError: (err: Error) => toast.error(err.message || "فشل تحديث حالة الصيانة"),
  });

  const activateMutation = useMutation({
    mutationFn: ({ userId, days, plan }: { userId: string; days: number; plan: PlanType }) =>
      activateSubscription(userId, days, plan, activationNote || undefined),
    onSuccess: () => {
      toast.success("تم تفعيل الاشتراك بنجاح");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setActivateDialog(false);
      setActivationDays(30);
      setActivationNote("");
      setSelectedPlan("pro");
      setSelectedDiscountTier(0);
    },
    onError: (err: Error) => toast.error(err.message || "فشل التفعيل"),
  });

  const suspendMutation = useMutation({
    mutationFn: (userId: string) => suspendUser(userId),
    onSuccess: () => {
      toast.success("تم إيقاف المستخدم");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => toast.error(err.message || "فشل الإيقاف"),
  });

  const extendMutation = useMutation({
    mutationFn: ({ userId, days, plan }: { userId: string; days: number; plan: PlanType }) =>
      extendSubscription(userId, days, plan),
    onSuccess: () => {
      toast.success(`تمت إضافة ${extendDays} يوم بنجاح`);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setExtendDialog(false);
      setExtendDays(30);
      setSelectedPlan("pro");
      setSelectedDiscountTier(0);
    },
    onError: (err: Error) => toast.error(err.message || "فشل التمديد"),
  });

  const setEndDateMutation = useMutation({
    mutationFn: ({ userId, endDate }: { userId: string; endDate: string }) =>
      setSubscriptionEndDate(userId, endDate),
    onSuccess: () => {
      toast.success("تم تعديل تاريخ انتهاء الاشتراك");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setEndDateDialog(false);
    },
    onError: (err: Error) => toast.error(err.message || "فشل تعديل التاريخ"),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => deleteUserAccount(userId),
    onSuccess: () => {
      toast.success("تم حذف الحساب وجميع بياناته");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => toast.error(err.message || "فشل حذف الحساب"),
  });

  const handleActivate = () => {
    if (!selectedUser) return;
    activateMutation.mutate({ userId: selectedUser, days: activationDays, plan: selectedPlan });
  };

  const handleExtend = () => {
    if (!selectedUser) return;
    extendMutation.mutate({ userId: selectedUser, days: extendDays, plan: selectedPlan });
  };

  const handleSetEndDate = () => {
    if (!selectedUser || !endDateValue) return;
    setEndDateMutation.mutate({ userId: selectedUser, endDate: new Date(endDateValue).toISOString() });
  };

  if (usersLoading || invLoading) return <StatSkeleton />;

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">مركز القيادة</h2>
            <p className="text-sm text-muted-foreground">إحصائيات المنصة ونشاط المستخدمين</p>
          </div>
        </div>
        <Badge className={meta.activeToday > 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200/60" : "bg-gray-50 text-gray-600 border-gray-200/60"}>
          {meta.activeToday > 0 ? `${meta.activeToday} نشط` : "خامل"}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((card, i) => (<StatCard key={i} card={card} />))}
      </div>

      {/* Maintenance + Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wrench className="w-5 h-5" />وضع الصيانة</CardTitle>
            <CardDescription>إيقاف المنصة عن جميع المستخدمين</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{settings?.maintenance_mode ? "المنصة متوقفة" : "المنصة تعمل"}</p>
                  <p className="text-sm text-gray-500">{settings?.maintenance_mode ? "المستخدمون لا يمكنهم الوصول" : "جميع المستخدمين يمكنهم الوصول"}</p>
                </div>
                <Switch
                  checked={settings?.maintenance_mode || false}
                  onCheckedChange={(ch) => { if (ch) setMaintenanceMessage(settings?.maintenance_message || ""); maintenanceMutation.mutate(ch); }}
                  disabled={maintenanceMutation.isPending}
                />
              </div>
              {settings?.maintenance_mode && (
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 space-y-2">
                  <Label htmlFor="mm" className="text-sm text-orange-800">رسالة الصيانة</Label>
                  <Input
                    id="mm" value={maintenanceMessage || settings?.maintenance_message || ""}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    onBlur={() => { if (maintenanceMessage.trim()) updateSettings({ maintenance_message: maintenanceMessage }); }}
                    placeholder="المنصة تحت الصيانة..."
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Megaphone className="w-5 h-5" />إرسال إشعار</CardTitle>
            <CardDescription>إشعار جماعي أو فردي للمستخدمين</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setNotifyDialog(true)} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Send className="w-4 h-4 ml-2" />إرسال إشعار
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />المستخدمين المسجلين</CardTitle>
          <CardDescription>{users.length} مستخدم في المنصة — اضغط لرؤية التفاصيل</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {users.map((u) => {
              const userInvs = invoices.filter((inv) => inv.user_id === u.id);
              const userSalesTotal = userInvs.reduce((s, inv) => s + toNumber(inv.total), 0);
              const lastActivity = userInvs.length > 0 ? formatDate(userInvs[0].date) : null;
              return (
                <div
                  key={u.id}
                  onClick={() => setInfoUser(u)}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer transition-all border border-transparent hover:border-gray-200"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">{(u.full_name || u.email || "?").charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{u.full_name || u.email}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {lastActivity && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />{lastActivity}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 text-left shrink-0">
                    {userSalesTotal > 0 ? formatCurrency(userSalesTotal) : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Subscription Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" />إدارة الاشتراكات</CardTitle>
          <CardDescription>تفعيل وتمديد وإيقاف اشتراكات المستخدمين</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {users.map((u) => {
              const sub = u.subscription;
              const daysLeft = (() => {
                if (!sub) return 0;
                const now = Date.now();
                const end = sub.status === "trial" ? sub.trial_end_date : sub.subscription_end_date;
                if (!end) return 0;
                return Math.max(0, Math.ceil((new Date(end).getTime() - now) / 86400000));
              })();
              if (u.role === "admin") return null;
              return (
                <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">{(u.full_name || u.email).charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{u.full_name || u.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {sub ? (
                          <div className="flex items-center gap-1.5">
                            <Badge className={
                              sub.status === "active" ? "bg-green-100 text-green-800 border-green-200 text-[10px]" :
                              sub.status === "trial" ? "bg-blue-100 text-blue-800 border-blue-200 text-[10px]" :
                              "bg-red-100 text-red-800 border-red-200 text-[10px]"
                            }>
                              {sub.status === "active" ? `${sub.plan === "free" ? "مجاني" : sub.plan === "basic" ? "أساسي" : "برو"} - ${daysLeft} يوم` : sub.status === "trial" ? `تجريبي - ${daysLeft} يوم` : sub.status}
                            </Badge>
                          </div>
                        ) : <span className="text-gray-400">بدون اشتراك</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                      <Button
                        size="sm" variant="outline"
                        className="h-7 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        onClick={() => { setSelectedUser(u.id); setExtendDays(30); setSelectedPlan("pro"); setSelectedDiscountTier(0); setExtendDialog(true); }}
                      >
                        <RefreshCw className="w-3 h-3 ml-1" />تمديد
                      </Button>
                    <Button
                      size="sm" variant="outline"
                      className="h-7 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                      onClick={() => { setSelectedUser(u.id); setEndDateValue(sub?.subscription_end_date ? new Date(sub.subscription_end_date).toISOString().slice(0, 10) : ""); setEndDateDialog(true); }}
                    >
                      تاريخ
                    </Button>
                    {sub?.status !== "active" && (
                      <Button
                        size="sm" variant="outline"
                        className="h-7 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => { setSelectedUser(u.id); setActivationDays(30); setSelectedPlan("pro"); setSelectedDiscountTier(0); setActivateDialog(true); }}
                      >
                        <CheckCircle className="w-3 h-3 ml-1" />تفعيل
                      </Button>
                    )}
                    {sub?.status === "active" && (
                      <Button
                        size="sm" variant="outline"
                        className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          if (confirm("هل أنت متأكد من إيقاف هذا المستخدم؟")) suspendMutation.mutate(u.id);
                        }}
                      >
                        <Ban className="w-3 h-3 ml-1" />إيقاف
                      </Button>
                    )}
                    <Button
                      size="sm" variant="ghost"
                      className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (confirm(`تحذير: سيتم حذف الحساب وجميع بياناته بشكل نهائي!\n\nالمستخدم: ${u.full_name || u.email}\n\nلا يمكن التراجع عن هذا الإجراء. هل أنت متأكد؟`)) {
                          deleteUserMutation.mutate(u.id);
                        }
                      }}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              );
            })}
            {users.filter((u) => u.role !== "admin").length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">لا يوجد مستخدمين للإدارة</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Megaphone className="w-5 h-5" />سجل الإشعارات</CardTitle>
            <CardDescription>{allNotifs?.count || 0} إشعار في السجل</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {allNotifs?.data && allNotifs.data.length > 0 && (
              <Button
                variant="outline" size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs h-8"
                onClick={() => {
                  if (confirm("هل أنت متأكد من حذف جميع الإشعارات؟")) {
                    deleteAllNotifications().then(() => {
                      toast.success("تم حذف جميع الإشعارات");
                      refetchNotifs();
                    }).catch((err) => toast.error(err.message));
                  }
                }}
              >
                حذف الكل
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {allNotifs?.data && allNotifs.data.length > 0 ? (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {allNotifs.data.map((n) => (
                <div key={n.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge className={
                        n.type === "alert" ? "bg-red-100 text-red-800 border-red-200 text-[10px]" :
                        n.type === "debt" ? "bg-amber-100 text-amber-800 border-amber-200 text-[10px]" :
                        n.type === "info" ? "bg-blue-100 text-blue-800 border-blue-200 text-[10px]" :
                        "bg-gray-100 text-gray-600 border-gray-200 text-[10px]"
                      }>
                        {n.type === "alert" ? "تنبيه" : n.type === "debt" ? "ديون" : n.type === "info" ? "معلومة" : "النظام"}
                      </Badge>
                      <span className="text-sm font-semibold truncate">{n.title}</span>
                      {n.expires_at && (
                        <span className="text-[10px] text-orange-500">
                          ينتهي {format(new Date(n.expires_at), "yyyy/MM/dd HH:mm", { locale: ar })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{n.message}</p>
                  </div>
                  <Button
                    variant="ghost" size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0 ml-2 shrink-0"
                    onClick={() => {
                      deleteNotification(n.id).then(() => {
                        refetchNotifs();
                      }).catch((err) => toast.error(err.message));
                    }}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-6">لا توجد إشعارات</p>
          )}
        </CardContent>
      </Card>

      {/* Notify Dialog */}
      <Dialog open={notifyDialog} onOpenChange={setNotifyDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Send className="w-5 h-5 text-blue-600" />إرسال إشعار</DialogTitle>
            <DialogDescription>أرسل إشعاراً للمستخدمين</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nt">المستلم</Label>
              <Select value={notifyTarget} onValueChange={setNotifyTarget}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المستخدمين</SelectItem>
                  {users.map((u) => (<SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ntype">نوع الإشعار</Label>
              <Select value={notifyType} onValueChange={setNotifyType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">النظام</SelectItem>
                  <SelectItem value="debt">ديون</SelectItem>
                  <SelectItem value="alert">تنبيه</SelectItem>
                  <SelectItem value="info">معلومة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ntitle">العنوان</Label>
              <Input id="ntitle" value={notifyTitle} onChange={(e) => setNotifyTitle(e.target.value)} placeholder="عنوان الإشعار" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nmsg">الرسالة</Label>
              <Input id="nmsg" value={notifyMessage} onChange={(e) => setNotifyMessage(e.target.value)} placeholder="نص الإشعار" />
            </div>
            <div className="space-y-2">
              <Label>حذف تلقائي بعد</Label>
              <div className="grid grid-cols-6 gap-2">
                {[
                  { label: "لا", hours: 0 },
                  { label: "ساعة", hours: 1 },
                  { label: "6 ساعات", hours: 6 },
                  { label: "يوم", hours: 24 },
                  { label: "أسبوع", hours: 168 },
                  { label: "شهر", hours: 720 },
                ].map((p) => (
                  <Button
                    key={p.hours}
                    variant={expiryHours === p.hours ? "default" : "outline"}
                    size="sm"
                    className={expiryHours === p.hours ? "bg-amber-600 hover:bg-amber-700 text-[11px]" : "text-[11px]"}
                    onClick={() => setExpiryHours(p.hours)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifyDialog(false)}>إلغاء</Button>
            <Button onClick={() => notifyMutation.mutate()} disabled={notifyMutation.isPending || !notifyTitle.trim() || !notifyMessage.trim()} className="bg-blue-600 hover:bg-blue-700">
              {notifyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Send className="w-4 h-4 ml-2" />}إرسال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Info Dialog */}
      <Dialog open={!!infoUser} onOpenChange={(open) => { if (!open) setInfoUser(null); }}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Info className="w-5 h-5 text-blue-600" />معلومات المستخدم</DialogTitle>
            <DialogDescription>تفاصيل الحساب والنشاط</DialogDescription>
          </DialogHeader>
          {infoUser && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg space-y-1">
                  <p className="text-xs text-blue-500 flex items-center gap-1"><Users className="w-3 h-3" />الاسم</p>
                  <p className="font-bold text-gray-900">{infoUser.full_name || "—"}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg space-y-1">
                  <p className="text-xs text-blue-500 flex items-center gap-1"><Mail className="w-3 h-3" />البريد</p>
                  <p className="font-bold text-gray-900 text-sm" dir="ltr">{infoUser.email}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg space-y-1">
                  <p className="text-xs text-blue-500 flex items-center gap-1"><Phone className="w-3 h-3" />الهاتف</p>
                  <p className="font-bold text-gray-900" dir="ltr">{infoUser.phone || <span className="text-gray-400">غير متوفر</span>}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg space-y-1">
                  <p className="text-xs text-blue-500 flex items-center gap-1"><Activity className="w-3 h-3" />إجمالي المبيعات</p>
                  <p className="font-bold text-gray-900">
                    {(() => {
                      const userTotal = invoices.filter((inv) => inv.user_id === infoUser.id).reduce((s, inv) => s + toNumber(inv.total), 0);
                      return formatCurrency(userTotal);
                    })()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Activate Dialog */}
      <Dialog open={activateDialog} onOpenChange={setActivateDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" />تفعيل الاشتراك</DialogTitle>
            <DialogDescription>اختر الباقة والمدة المناسبة</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>الباقة</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["free", "basic", "pro"] as PlanType[]).map((p) => {
                  const plan = PLANS[p];
                  const isSelected = selectedPlan === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => { setSelectedPlan(p); }}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        isSelected
                          ? p === "pro" ? "border-purple-400 bg-purple-50" : p === "basic" ? "border-blue-400 bg-blue-50" : "border-gray-400 bg-gray-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex justify-center mb-1">
                        {p === "pro" ? <Crown className="w-4 h-4 text-amber-500" /> : p === "basic" ? <Zap className="w-4 h-4 text-blue-500" /> : <Star className="w-4 h-4 text-gray-500" />}
                      </div>
                      <p className={`text-xs font-bold ${isSelected ? (p === "pro" ? "text-purple-700" : p === "basic" ? "text-blue-700" : "text-gray-700") : "text-gray-600"}`}>{plan.nameAr}</p>
                      <p className="text-[10px] text-gray-500">{plan.key === "free" ? "مجاني" : `${plan.monthlyPrice.toLocaleString()} د.ع`}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedPlan !== "free" && (
              <div className="space-y-2">
                <Label>المدة والخصم</Label>
                <div className="grid grid-cols-4 gap-2">
                  {DISCOUNT_TIERS.map((tier, idx) => {
                    const planPrice = PLANS[selectedPlan].monthlyPrice;
                    const monthlyWithDiscount = getDiscountPrice(planPrice, tier.discountPercent);
                    const totalDays = tier.months * 30;
                    const isSelected = selectedDiscountTier === idx;
                    return (
                      <button
                        key={tier.months}
                        type="button"
                        onClick={() => {
                          setSelectedDiscountTier(idx);
                          setActivationDays(totalDays);
                        }}
                        className={`p-2 rounded-lg border text-center transition-all text-xs ${
                          isSelected ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <p className="font-bold text-gray-700">{tier.label}</p>
                        <p className={`font-bold ${tier.discountPercent > 0 ? "text-green-600" : "text-gray-500"}`}>
                          {monthlyWithDiscount.toLocaleString()}
                        </p>
                        {tier.discountPercent > 0 && (
                          <p className="text-[9px] text-green-500">خصم {tier.discountPercent}%</p>
                        )}
                        <p className="text-[9px] text-gray-400">{totalDays} يوم</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="days">عدد مخصص من الأيام</Label>
              <Input id="days" type="number" min={1} value={activationDays} onChange={(e) => { setActivationDays(Number(e.target.value)); setSelectedDiscountTier(-1); }} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">ملاحظة (اختياري)</Label>
              <Input id="note" value={activationNote} onChange={(e) => setActivationNote(e.target.value)} placeholder="مثال: تم الدفع نقداً" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivateDialog(false)}>إلغاء</Button>
            <Button onClick={handleActivate} disabled={activateMutation.isPending || activationDays < 1} className="bg-green-600 hover:bg-green-700">
              {activateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <CheckCircle className="w-4 h-4 ml-2" />}
              تفعيل {PLANS[selectedPlan].nameAr} - {activationDays} يوم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Dialog */}
      <Dialog open={extendDialog} onOpenChange={setExtendDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><RefreshCw className="w-5 h-5 text-purple-600" />تمديد الاشتراك</DialogTitle>
            <DialogDescription>اختر الباقة والمدة الإضافية مع الخصم</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>الباقة</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["free", "basic", "pro"] as PlanType[]).map((p) => {
                  const plan = PLANS[p];
                  const isSelected = selectedPlan === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => { setSelectedPlan(p); }}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        isSelected
                          ? p === "pro" ? "border-purple-400 bg-purple-50" : p === "basic" ? "border-blue-400 bg-blue-50" : "border-gray-400 bg-gray-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex justify-center mb-1">
                        {p === "pro" ? <Crown className="w-4 h-4 text-amber-500" /> : p === "basic" ? <Zap className="w-4 h-4 text-blue-500" /> : <Star className="w-4 h-4 text-gray-500" />}
                      </div>
                      <p className={`text-xs font-bold ${isSelected ? (p === "pro" ? "text-purple-700" : p === "basic" ? "text-blue-700" : "text-gray-700") : "text-gray-600"}`}>{plan.nameAr}</p>
                      <p className="text-[10px] text-gray-500">{plan.key === "free" ? "مجاني" : `${plan.monthlyPrice.toLocaleString()} د.ع`}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedPlan !== "free" && (
              <div className="space-y-2">
                <Label>المدة والخصم</Label>
                <div className="grid grid-cols-4 gap-2">
                  {DISCOUNT_TIERS.map((tier, idx) => {
                    const planPrice = PLANS[selectedPlan].monthlyPrice;
                    const monthlyWithDiscount = getDiscountPrice(planPrice, tier.discountPercent);
                    const totalDays = tier.months * 30;
                    const isSelected = selectedDiscountTier === idx;
                    return (
                      <button
                        key={tier.months}
                        type="button"
                        onClick={() => {
                          setSelectedDiscountTier(idx);
                          setExtendDays(totalDays);
                        }}
                        className={`p-2 rounded-lg border text-center transition-all text-xs ${
                          isSelected ? "border-purple-400 bg-purple-50" : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <p className="font-bold text-gray-700">{tier.label}</p>
                        <p className={`font-bold ${tier.discountPercent > 0 ? "text-green-600" : "text-gray-500"}`}>
                          {monthlyWithDiscount.toLocaleString()}
                        </p>
                        {tier.discountPercent > 0 && (
                          <p className="text-[9px] text-green-500">خصم {tier.discountPercent}%</p>
                        )}
                        <p className="text-[9px] text-gray-400">{totalDays} يوم</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="extendDays">عدد مخصص من الأيام</Label>
              <Input id="extendDays" type="number" min={1} value={extendDays} onChange={(e) => { setExtendDays(Number(e.target.value)); setSelectedDiscountTier(-1); }} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendDialog(false)}>إلغاء</Button>
            <Button onClick={handleExtend} disabled={extendMutation.isPending || extendDays < 1} className="bg-purple-600 hover:bg-purple-700">
              {extendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <RefreshCw className="w-4 h-4 ml-2" />}
              تمديد {selectedPlan === "free" ? "مجاني" : `${extendDays} يوم`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set End Date Dialog */}
      <Dialog open={endDateDialog} onOpenChange={setEndDateDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CalendarDays className="w-5 h-5 text-amber-600" />تعديل تاريخ الانتهاء</DialogTitle>
            <DialogDescription>حدد تاريخ انتهاء الاشتراك مباشرة لتصحيح الأخطاء</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="endDate">تاريخ انتهاء الاشتراك</Label>
              <Input id="endDate" type="date" value={endDateValue} onChange={(e) => setEndDateValue(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEndDateDialog(false)}>إلغاء</Button>
            <Button onClick={handleSetEndDate} disabled={setEndDateMutation.isPending || !endDateValue} className="bg-amber-600 hover:bg-amber-700">
              {setEndDateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <CalendarDays className="w-4 h-4 ml-2" />}حفظ التاريخ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
