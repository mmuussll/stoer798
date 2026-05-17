import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchUsers, activateSubscription, suspendUser, extendSubscription, setSubscriptionEndDate, deleteUserAccount } from "@/api/users";
import { createNotification, broadcastNotification, fetchAllNotifications, deleteNotification, deleteAllNotifications } from "@/api/notifications";
import { fetchSettings, updateSettings } from "@/api/settings";
import { fetchSalesInvoices } from "@/api/sales";
import { fetchProductsCountForUser } from "@/api/products";
import { fetchCustomersCountForUser } from "@/api/customers";
import { toNumber } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Users, Loader2, Send, Megaphone, Phone, Mail, CalendarDays, Info, Wrench,
  TrendingUp, Activity, UserPlus, Zap, Clock, UserCheck,
  RefreshCw, CheckCircle, Ban, CreditCard, Search, DollarSign,
  ShoppingCart, Package, Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { format, startOfWeek, startOfMonth } from "date-fns";
import { ar } from "date-fns/locale";
import { CURRENCY, type PlanType } from "@/constants";
import type { UserWithSubscription } from "@/types";
import NotifyDialog from "@/components/admin/NotifyDialog";
import ActivateDialog from "@/components/admin/ActivateDialog";
import ExtendDialog from "@/components/admin/ExtendDialog";

type StatCardData = { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; color: string; sub?: string };

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return "—";
  try { return format(new Date(dateStr), "yyyy/MM/dd", { locale: ar }); } catch { return dateStr; }
}
function formatCurrency(amount: number) { return `${amount.toLocaleString()} ${CURRENCY}`; }

const COLORS: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-primary/10", text: "text-primary" },
  green: { bg: "bg-emerald-100", text: "text-emerald-600" },
  purple: { bg: "bg-purple-100", text: "text-purple-600" },
  red: { bg: "bg-rose-100", text: "text-rose-600" },
  orange: { bg: "bg-amber-100", text: "text-amber-600" },
  indigo: { bg: "bg-primary/10", text: "text-primary" },
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
          {card.sub && <p className="text-[10px] text-muted-foreground/60">{card.sub}</p>}
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
  const [userSearch, setUserSearch] = useState("");
  const [infoUserStats, setInfoUserStats] = useState<{ productsCount: number; customersCount: number } | null>(null);

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
    { label: "إيرادات اليوم", value: formatCurrency(meta.todaySales), icon: DollarSign, color: "green", sub: `${meta.todayCount} فاتورة` },
    { label: "إيرادات الأسبوع", value: formatCurrency(meta.weekSales), icon: TrendingUp, color: "teal", sub: "" },
    { label: "إيرادات الشهر", value: formatCurrency(meta.monthSales), icon: DollarSign, color: "indigo", sub: "" },
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

  const handleSetEndDate = () => {
    if (!selectedUser || !endDateValue) return;
    setEndDateMutation.mutate({ userId: selectedUser, endDate: new Date(endDateValue).toISOString() });
  };

  const filteredUsers = useMemo(
    () => {
      const q = userSearch.trim().toLowerCase();
      if (!q) return users;
      return users.filter(
        (u) =>
          (u.full_name || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          (u.phone || "").includes(q)
      );
    },
    [users, userSearch],
  );

  const handleUserClick = async (u: UserWithSubscription) => {
    setInfoUser(u);
    try {
      const [pCount, cCount] = await Promise.all([
        fetchProductsCountForUser(u.id).catch(() => 0),
        fetchCustomersCountForUser(u.id).catch(() => 0),
      ]);
      setInfoUserStats({ productsCount: pCount, customersCount: cCount });
    } catch {
      setInfoUserStats(null);
    }
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
            <h2 className="text-xl font-bold text-foreground">مركز القيادة</h2>
            <p className="text-sm text-muted-foreground">إحصائيات المنصة ونشاط المستخدمين</p>
          </div>
        </div>
        <Badge className={meta.activeToday > 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200/60" : "bg-muted/50 text-muted-foreground border-border/60/60"}>
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
                  <p className="text-sm text-muted-foreground">{settings?.maintenance_mode ? "المستخدمون لا يمكنهم الوصول" : "جميع المستخدمين يمكنهم الوصول"}</p>
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />المستخدمين المسجلين</CardTitle>
              <CardDescription>{filteredUsers.length} من {users.length} مستخدم — اضغط لرؤية التفاصيل</CardDescription>
            </div>
          </div>
          <div className="relative mt-3">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <Input
              placeholder="بحث عن مستخدم بالاسم أو البريد..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="pr-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredUsers.map((u) => {
              const userInvs = invoices.filter((inv) => inv.user_id === u.id);
              const userSalesTotal = userInvs.reduce((s, inv) => s + toNumber(inv.total), 0);
              const lastActivity = userInvs.length > 0 ? formatDate(userInvs[0].date) : null;
              return (
                <div
                  key={u.id}
                  onClick={() => handleUserClick(u)}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl hover:bg-muted/70 cursor-pointer transition-all border border-transparent hover:border-border/60"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/60 to-purple-500/60 flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">{(u.full_name || u.email || "?").charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{u.full_name || u.email}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {lastActivity && (
                        <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />{lastActivity}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground/60 text-left shrink-0">
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
              return (
                <div key={u.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/60 to-purple-500/60 flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">{(u.full_name || u.email).charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{u.full_name || u.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {sub ? (
                          <div className="flex items-center gap-1.5">
                            <Badge className={
                              sub.status === "active" ? "bg-green-100 text-green-800 border-green-200 text-[10px]" :
                              sub.status === "trial" ? "bg-primary/100 text-primary border-primary/20 text-[10px]" :
                              "bg-red-100 text-red-800 border-red-200 text-[10px]"
                            }>
                              {sub.status === "active" ? `${sub.plan === "free" ? "مجاني" : sub.plan === "basic" ? "أساسي" : "برو"} - ${daysLeft} يوم` : sub.status === "trial" ? `تجريبي - ${daysLeft} يوم` : sub.status}
                            </Badge>
            {filteredUsers.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                {userSearch.trim() ? "لا توجد نتائج مطابقة للبحث" : ""}
              </div>
            )}
          </div>
                        ) : <span className="text-muted-foreground/60">بدون اشتراك</span>}
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
                      className="h-7 w-7 p-0 text-muted-foreground/60 hover:text-red-600 hover:bg-red-50"
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
                <div key={n.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge className={
                        n.type === "alert" ? "bg-red-100 text-red-800 border-red-200 text-[10px]" :
                        n.type === "debt" ? "bg-amber-100 text-amber-800 border-amber-200 text-[10px]" :
                        n.type === "info" ? "bg-primary/100 text-primary border-primary/20 text-[10px]" :
                        "bg-muted text-muted-foreground border-border/60 text-[10px]"
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
      <NotifyDialog
        open={notifyDialog}
        onOpenChange={setNotifyDialog}
        users={users}
        notifyTitle={notifyTitle}
        setNotifyTitle={setNotifyTitle}
        notifyMessage={notifyMessage}
        setNotifyMessage={setNotifyMessage}
        notifyType={notifyType}
        setNotifyType={setNotifyType}
        notifyTarget={notifyTarget}
        setNotifyTarget={setNotifyTarget}
        expiryHours={expiryHours}
        setExpiryHours={setExpiryHours}
        notifyMutation={notifyMutation}
      />

      {/* User Info Dialog */}
      <Dialog open={!!infoUser} onOpenChange={(open) => { if (!open) { setInfoUser(null); setInfoUserStats(null); } }}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Info className="w-5 h-5 text-primary" />معلومات المستخدم</DialogTitle>
            <DialogDescription>تفاصيل الحساب والنشاط</DialogDescription>
          </DialogHeader>
          {infoUser && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-primary/5 rounded-lg space-y-1">
                  <p className="text-xs text-primary/80 flex items-center gap-1"><Users className="w-3 h-3" />الاسم</p>
                  <p className="font-bold text-foreground">{infoUser.full_name || "—"}</p>
                </div>
                <div className="p-3 bg-primary/5 rounded-lg space-y-1">
                  <p className="text-xs text-primary/80 flex items-center gap-1"><Mail className="w-3 h-3" />البريد</p>
                  <p className="font-bold text-foreground text-sm" dir="ltr">{infoUser.email}</p>
                </div>
                <div className="p-3 bg-primary/5 rounded-lg space-y-1">
                  <p className="text-xs text-primary/80 flex items-center gap-1"><Phone className="w-3 h-3" />الهاتف</p>
                  <p className="font-bold text-foreground" dir="ltr">{infoUser.phone || <span className="text-muted-foreground/60">غير متوفر</span>}</p>
                </div>
                <div className="p-3 bg-primary/5 rounded-lg space-y-1">
                  <p className="text-xs text-primary/80 flex items-center gap-1"><CalendarDays className="w-3 h-3" />تاريخ التسجيل</p>
                  <p className="font-bold text-foreground text-sm">{infoUser.created_at ? formatDate(infoUser.created_at) : "—"}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg space-y-1">
                  <p className="text-xs text-emerald-600 flex items-center gap-1"><DollarSign className="w-3 h-3" />إجمالي المبيعات</p>
                  <p className="font-bold text-foreground">
                    {(() => {
                      const userTotal = invoices.filter((inv) => inv.user_id === infoUser.id).reduce((s, inv) => s + toNumber(inv.total), 0);
                      return formatCurrency(userTotal);
                    })()}
                  </p>
                </div>
                <div className="p-3 bg-violet-50 rounded-lg space-y-1">
                  <p className="text-xs text-violet-600 flex items-center gap-1"><ShoppingCart className="w-3 h-3" />عدد الفواتير</p>
                  <p className="font-bold text-foreground">{invoices.filter((inv) => inv.user_id === infoUser.id).length}</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg space-y-1">
                  <p className="text-xs text-amber-600 flex items-center gap-1"><Package className="w-3 h-3" />المنتجات</p>
                  <p className="font-bold text-foreground">{infoUserStats?.productsCount ?? <span className="text-muted-foreground/60">—</span>}</p>
                </div>
                <div className="p-3 bg-rose-50 rounded-lg space-y-1">
                  <p className="text-xs text-rose-600 flex items-center gap-1"><Users className="w-3 h-3" />الزبائن</p>
                  <p className="font-bold text-foreground">{infoUserStats?.customersCount ?? <span className="text-muted-foreground/60">—</span>}</p>
                </div>
              </div>
              {infoUser.subscription && (
                <>
                  <Separator />
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-2.5 bg-muted/50 rounded-lg text-center">
                      <p className="text-[10px] text-muted-foreground">الحالة</p>
                      <Badge className={
                        infoUser.subscription.status === "active" ? "bg-green-100 text-green-800 mt-0.5" :
                        infoUser.subscription.status === "trial" ? "bg-primary/10 text-primary/80 mt-0.5" :
                        "bg-red-100 text-red-800 mt-0.5"
                      }>
                        {infoUser.subscription.status === "active" ? "نشط" : infoUser.subscription.status === "trial" ? "تجريبي" : infoUser.subscription.status}
                      </Badge>
                    </div>
                    <div className="p-2.5 bg-muted/50 rounded-lg text-center">
                      <p className="text-[10px] text-muted-foreground">الباقة</p>
                      <p className="text-sm font-bold text-foreground mt-0.5">
                        {infoUser.subscription.plan === "pro" ? "برو" : infoUser.subscription.plan === "basic" ? "أساسي" : infoUser.subscription.plan === "free" ? "مجاني" : infoUser.subscription.plan || "—"}
                      </p>
                    </div>
                    <div className="p-2.5 bg-muted/50 rounded-lg text-center">
                      <p className="text-[10px] text-muted-foreground">تاريخ الانتهاء</p>
                      <p className="text-sm font-bold text-foreground mt-0.5">
                        {infoUser.subscription.status === "trial"
                          ? formatDate(infoUser.subscription.trial_end_date)
                          : formatDate(infoUser.subscription.subscription_end_date)}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Activate Dialog */}
      <ActivateDialog
        open={activateDialog}
        onOpenChange={setActivateDialog}
        selectedUser={selectedUser}
        activationDays={activationDays}
        setActivationDays={setActivationDays}
        activationNote={activationNote}
        setActivationNote={setActivationNote}
        selectedPlan={selectedPlan}
        setSelectedPlan={setSelectedPlan}
        selectedDiscountTier={selectedDiscountTier}
        setSelectedDiscountTier={setSelectedDiscountTier}
        activateMutation={activateMutation}
      />

      {/* Extend Dialog */}
      <ExtendDialog
        open={extendDialog}
        onOpenChange={setExtendDialog}
        selectedUser={selectedUser}
        extendDays={extendDays}
        setExtendDays={setExtendDays}
        selectedPlan={selectedPlan}
        setSelectedPlan={setSelectedPlan}
        selectedDiscountTier={selectedDiscountTier}
        setSelectedDiscountTier={setSelectedDiscountTier}
        extendMutation={extendMutation}
      />

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
