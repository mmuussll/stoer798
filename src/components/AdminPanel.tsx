import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchUsers, activateSubscription, suspendUser, extendSubscription } from "@/api/users";
import { createNotification, broadcastNotification } from "@/api/notifications";
import { fetchSettings, updateSettings } from "@/api/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  Users,
  Calendar,
  CreditCard,
  Ban,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  RefreshCw,
  PlusCircle,
  Loader2,
  Send,
  Megaphone,
  Phone,
  Mail,
  Eye,
  CalendarDays,
  StickyNote,
  Timer,
  UserCheck,
  Info,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CURRENCY } from "@/constants";
import type { UserWithSubscription, UserSubscription } from "@/types";

const SUBSCRIPTION_PRICE = 25000;

function getStatusBadge(status: string) {
  switch (status) {
    case "trial":
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 gap-1">
          <Clock className="w-3 h-3" />
          تجريبي
        </Badge>
      );
    case "active":
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 gap-1">
          <CheckCircle className="w-3 h-3" />
          نشط
        </Badge>
      );
    case "suspended":
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200 gap-1">
          <Ban className="w-3 h-3" />
          موقوف
        </Badge>
      );
    case "expired":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 gap-1">
          <XCircle className="w-3 h-3" />
          منتهي
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getRoleBadge(role: string) {
  if (role === "admin") {
    return (
      <Badge className="bg-purple-100 text-purple-800 border-purple-200 gap-1">
        <Shield className="w-3 h-3" />
        مدير
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <Users className="w-3 h-3" />
      مستخدم
    </Badge>
  );
}

function getDaysRemaining(sub: UserSubscription | null): number {
  if (!sub) return 0;
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

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "yyyy/MM/dd", { locale: ar });
  } catch {
    return dateStr;
  }
}

export default function AdminPanel() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [activateDialog, setActivateDialog] = useState(false);
  const [extendDialog, setExtendDialog] = useState(false);
  const [activationDays, setActivationDays] = useState(30);
  const [activationNote, setActivationNote] = useState("");
  const [extendDays, setExtendDays] = useState(30);

  const [notifyDialog, setNotifyDialog] = useState(false);
  const [notifyTitle, setNotifyTitle] = useState("");
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifyType, setNotifyType] = useState<string>("system");
  const [notifyTarget, setNotifyTarget] = useState<string>("all");

  const [infoUser, setInfoUser] = useState<UserWithSubscription | null>(null);

  const [maintenanceMessage, setMaintenanceMessage] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchUsers,
  });

  const { data: settings } = useQuery({
    queryKey: ["store-settings"],
    queryFn: fetchSettings,
  });

  const activateMutation = useMutation({
    mutationFn: ({ userId, days }: { userId: string; days: number }) =>
      activateSubscription(userId, days, activationNote || undefined),
    onSuccess: () => {
      toast.success("تم تفعيل الاشتراك بنجاح");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setActivateDialog(false);
      setActivationDays(30);
      setActivationNote("");
    },
    onError: (err: Error) => {
      toast.error(err.message || "فشل التفعيل");
    },
  });

  const suspendMutation = useMutation({
    mutationFn: (userId: string) => suspendUser(userId),
    onSuccess: () => {
      toast.success("تم إيقاف المستخدم");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "فشل الإيقاف");
    },
  });

  const extendMutation = useMutation({
    mutationFn: ({ userId, days }: { userId: string; days: number }) =>
      extendSubscription(userId, days),
    onSuccess: () => {
      toast.success(`تمت إضافة ${extendDays} يوم بنجاح`);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["store-settings"] });
      setExtendDialog(false);
      setExtendDays(30);
    },
    onError: (err: Error) => {
      toast.error(err.message || "فشل التمديد");
    },
  });

  const notifyMutation = useMutation({
    mutationFn: async () => {
      const title = notifyTitle.trim();
      const message = notifyMessage.trim();
      const type = notifyType as "system" | "subscription" | "debt" | "alert" | "info";
      if (notifyTarget === "all") {
        await broadcastNotification(title, message, type);
      } else {
        await createNotification(notifyTarget, title, message, type);
      }
    },
    onSuccess: () => {
      toast.success("تم إرسال الإشعار بنجاح");
      setNotifyDialog(false);
      setNotifyTitle("");
      setNotifyMessage("");
      setNotifyType("system");
      setNotifyTarget("all");
    },
    onError: (err: Error) => {
      toast.error(err.message || "فشل إرسال الإشعار");
    },
  });

  const maintenanceMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      updateSettings({
        maintenance_mode: enabled,
        maintenance_message: enabled ? (maintenanceMessage || undefined) : undefined,
      }),
    onSuccess: (_data: unknown, enabled: boolean) => {
      toast.success(enabled ? "تم تفعيل وضع الصيانة" : "تم إيقاف وضع الصيانة");
      queryClient.invalidateQueries({ queryKey: ["store-settings"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "فشل تحديث حالة الصيانة");
    },
  });

  const handleActivate = () => {
    if (!selectedUser) return;
    activateMutation.mutate({ userId: selectedUser, days: activationDays });
  };

  const handleExtend = () => {
    if (!selectedUser) return;
    extendMutation.mutate({ userId: selectedUser, days: extendDays });
  };

  const colorClasses: Record<string, { bg: string; text: string }> = {
    blue: { bg: "bg-blue-100", text: "text-blue-600" },
    green: { bg: "bg-green-100", text: "text-green-600" },
    purple: { bg: "bg-purple-100", text: "text-purple-600" },
    red: { bg: "bg-red-100", text: "text-red-600" },
  };

  const statCards = [
    { label: "إجمالي المستخدمين", value: users?.length || 0, icon: Users, color: "blue" },
    {
      label: "المستخدمين النشطين",
      value: users?.filter((u) => u.subscription?.status === "active").length || 0,
      icon: CheckCircle,
      color: "green",
    },
    {
      label: "التجريبي",
      value: users?.filter((u) => u.subscription?.status === "trial").length || 0,
      icon: Clock,
      color: "purple",
    },
    {
      label: "الموقوفين",
      value: users?.filter((u) => u.subscription?.status === "suspended" || u.subscription?.status === "expired").length || 0,
      icon: Ban,
      color: "red",
    },
  ];

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4" dir="rtl">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_item, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">لوحة التحكم</h2>
          <p className="text-sm text-muted-foreground">إدارة المستخدمين والاشتراكات</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4 flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[card.color].bg}`}
              >
                <card.icon className={`w-6 h-6 ${colorClasses[card.color].text}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>التسعير</CardTitle>
          <CardDescription>معلومات الاشتراك الشهري</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <CreditCard className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">
                {SUBSCRIPTION_PRICE.toLocaleString()} {CURRENCY}
              </p>
              <p className="text-sm text-muted-foreground">رسوم الاشتراك الشهري</p>
            </div>
            <div className="flex-1" />
            <div className="text-left">
              <p className="text-xs text-muted-foreground">لكل مستخدم</p>
              <p className="text-sm font-semibold text-blue-700">شهر كامل</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            وضع الصيانة
          </CardTitle>
          <CardDescription>إيقاف الموقع عن المستخدمين أثناء التطوير أو الصيانة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {settings?.maintenance_mode ? "الموقع متوقف حالياً" : "الموقع يعمل بشكل طبيعي"}
                </p>
                <p className="text-sm text-gray-500">
                  {settings?.maintenance_mode
                    ? "المستخدمون العاديون لا يمكنهم الوصول"
                    : "جميع المستخدمين يمكنهم الوصول"}
                </p>
              </div>
              <Switch
                checked={settings?.maintenance_mode || false}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setMaintenanceMessage(settings?.maintenance_message || "");
                  }
                  maintenanceMutation.mutate(checked);
                }}
                disabled={maintenanceMutation.isPending}
              />
            </div>

            {settings?.maintenance_mode && (
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 space-y-2">
                <Label htmlFor="maintMsg" className="text-sm text-orange-800">
                  رسالة الصيانة (تظهر للمستخدمين)
                </Label>
                <Input
                  id="maintMsg"
                  value={maintenanceMessage || settings?.maintenance_message || ""}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  onBlur={() => {
                    if (maintenanceMessage.trim()) {
                      updateSettings({ maintenance_message: maintenanceMessage });
                    }
                  }}
                  placeholder="الموقع تحت الصيانة..."
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            إرسال إشعار
          </CardTitle>
          <CardDescription>إرسال إشعار إلى جميع المستخدمين أو مستخدم محدد</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => setNotifyDialog(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Send className="w-4 h-4 ml-2" />
            إرسال إشعار
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            المستخدمين
          </CardTitle>
          <CardDescription>قائمة جميع المستخدمين المسجلين في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الأيام المتبقية</TableHead>
                  <TableHead>تاريخ التسجيل</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => {
                  const daysRemaining = getDaysRemaining(user.subscription);
                  const isExpiring = daysRemaining <= 3 && user.subscription?.status !== "suspended";
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <button
                          onClick={() => setInfoUser(user)}
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          {user.full_name || "—"}
                        </button>
                      </TableCell>
                      <TableCell className="text-sm" dir="ltr">
                        {user.phone ? (
                          <span className="text-blue-600">{user.phone}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground" dir="ltr">
                        {user.email}
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        {user.subscription ? getStatusBadge(user.subscription.status) : "—"}
                      </TableCell>
                      <TableCell>
                        {user.subscription?.status === "trial" || user.subscription?.status === "active" ? (
                          <Badge
                            className={
                              isExpiring
                                ? "bg-red-100 text-red-800 border-red-200"
                                : "bg-green-100 text-green-800 border-green-200"
                            }
                          >
                            {daysRemaining} يوم
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {user.role !== "admin" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                onClick={() => {
                                  setSelectedUser(user.id);
                                  setExtendDays(1);
                                  setExtendDialog(true);
                                }}
                              >
                                <RefreshCw className="w-3.5 h-3.5 ml-1" />
                                إضافة أيام
                              </Button>
                              {user.subscription?.status !== "active" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => {
                                    setSelectedUser(user.id);
                                    setActivateDialog(true);
                                  }}
                                >
                                  <CheckCircle className="w-3.5 h-3.5 ml-1" />
                                  تفعيل
                                </Button>
                              )}
                              {user.subscription?.status === "active" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => {
                                    if (confirm("هل أنت متأكد من إيقاف هذا المستخدم؟")) {
                                      suspendMutation.mutate(user.id);
                                    }
                                  }}
                                >
                                  <Ban className="w-3.5 h-3.5 ml-1" />
                                  إيقاف
                                </Button>
                              )}
                            </>
                          )}
                          {user.role === "admin" && (
                            <span className="text-xs text-muted-foreground">المدير</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={activateDialog} onOpenChange={setActivateDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              تفعيل الاشتراك
            </DialogTitle>
            <DialogDescription>
              حدد عدد الأيام لتفعيل حساب المستخدم. السعر الشهري {SUBSCRIPTION_PRICE.toLocaleString()} {CURRENCY}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="days">عدد الأيام</Label>
              <Input
                id="days"
                type="number"
                min={1}
                value={activationDays}
                onChange={(e) => setActivationDays(Number(e.target.value))}
              />
            </div>
            {activationDays >= 30 && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800">
                  السعر التقريبي:{" "}
                  <span className="font-bold">
                    {Math.ceil(activationDays / 30) * SUBSCRIPTION_PRICE.toLocaleString()} {CURRENCY}
                  </span>
                  <span className="text-xs block text-blue-600">
                    ({Math.ceil(activationDays / 30)} شهر × {SUBSCRIPTION_PRICE.toLocaleString()} {CURRENCY})
                  </span>
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="note">ملاحظة (اختياري)</Label>
              <Input
                id="note"
                value={activationNote}
                onChange={(e) => setActivationNote(e.target.value)}
                placeholder="مثال: تم الدفع نقداً"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivateDialog(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleActivate}
              disabled={activateMutation.isPending || activationDays < 1}
              className="bg-green-600 hover:bg-green-700"
            >
              {activateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <PlusCircle className="w-4 h-4 ml-2" />
              )}
              تفعيل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={extendDialog} onOpenChange={setExtendDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              إضافة أيام
            </DialogTitle>
            <DialogDescription>
              أضف عدد من الأيام للمستخدم (حتى لو كان منتهي الاشتراك)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="extendDays">عدد الأيام</Label>
              <Input
                id="extendDays"
                type="number"
                min={1}
                value={extendDays}
                onChange={(e) => setExtendDays(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendDialog(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleExtend}
              disabled={extendMutation.isPending || extendDays < 1}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {extendMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <RefreshCw className="w-4 h-4 ml-2" />
              )}
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={notifyDialog} onOpenChange={setNotifyDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" />
              إرسال إشعار
            </DialogTitle>
            <DialogDescription>
              أرسل إشعاراً إلى المستخدمين لإعلامهم بالتحديثات أو التنبيهات
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="notifyTarget">المستلم</Label>
              <Select value={notifyTarget} onValueChange={setNotifyTarget}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المستخدمين</SelectItem>
                  {(users || []).map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notifyType">نوع الإشعار</Label>
              <Select value={notifyType} onValueChange={setNotifyType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">النظام</SelectItem>
                  <SelectItem value="subscription">اشتراك</SelectItem>
                  <SelectItem value="debt">ديون</SelectItem>
                  <SelectItem value="alert">تنبيه</SelectItem>
                  <SelectItem value="info">معلومة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notifyTitle">العنوان</Label>
              <Input
                id="notifyTitle"
                value={notifyTitle}
                onChange={(e) => setNotifyTitle(e.target.value)}
                placeholder="عنوان الإشعار"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notifyMessage">الرسالة</Label>
              <Input
                id="notifyMessage"
                value={notifyMessage}
                onChange={(e) => setNotifyMessage(e.target.value)}
                placeholder="نص الإشعار"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifyDialog(false)}>
              إلغاء
            </Button>
            <Button
              onClick={() => notifyMutation.mutate()}
              disabled={notifyMutation.isPending || !notifyTitle.trim() || !notifyMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {notifyMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <Send className="w-4 h-4 ml-2" />
              )}
              إرسال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!infoUser} onOpenChange={(open) => { if (!open) setInfoUser(null); }}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              معلومات المستخدم
            </DialogTitle>
            <DialogDescription>
              كافة التفاصيل الخاصة بالمستخدم
            </DialogDescription>
          </DialogHeader>
          {infoUser && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg space-y-1">
                  <p className="text-xs text-blue-500 flex items-center gap-1">
                    <Users className="w-3 h-3" /> الاسم
                  </p>
                  <p className="font-bold text-gray-900">{infoUser.full_name || "—"}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg space-y-1">
                  <p className="text-xs text-blue-500 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> البريد الإلكتروني
                  </p>
                  <p className="font-bold text-gray-900 text-sm" dir="ltr">{infoUser.email}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg space-y-1">
                  <p className="text-xs text-blue-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> الهاتف
                  </p>
                  <p className="font-bold text-gray-900" dir="ltr">
                    {infoUser.phone || <span className="text-gray-400">غير متوفر</span>}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg space-y-1">
                  <p className="text-xs text-blue-500 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> الدور
                  </p>
                  <div>{getRoleBadge(infoUser.role)}</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg space-y-1">
                  <p className="text-xs text-blue-500 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" /> تاريخ التسجيل
                  </p>
                  <p className="font-bold text-gray-900 text-sm">
                    {infoUser.created_at
                      ? format(new Date(infoUser.created_at), "yyyy/MM/dd  hh:mm a", { locale: ar })
                      : "—"}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg space-y-1">
                  <p className="text-xs text-blue-500 flex items-center gap-1">
                    <Timer className="w-3 h-3" /> الأيام المتبقية
                  </p>
                  <p className="font-bold text-gray-900">
                    {getDaysRemaining(infoUser.subscription)} يوم
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-600" />
                  تفاصيل الاشتراك
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-500">الحالة</span>
                    <span>{infoUser.subscription ? getStatusBadge(infoUser.subscription.status) : "—"}</span>
                  </div>

                  {(infoUser.subscription?.status === "trial" || infoUser.subscription?.trial_start_date) && (
                    <>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-500">بداية التجربة</span>
                        <span className="text-sm font-medium" dir="ltr">
                          {infoUser.subscription?.trial_start_date
                            ? format(new Date(infoUser.subscription.trial_start_date), "yyyy/MM/dd  hh:mm a", { locale: ar })
                            : "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-500">نهاية التجربة</span>
                        <span className="text-sm font-medium" dir="ltr">
                          {infoUser.subscription?.trial_end_date
                            ? format(new Date(infoUser.subscription.trial_end_date), "yyyy/MM/dd  hh:mm a", { locale: ar })
                            : "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-500">تم استخدام التجربة</span>
                        <Badge className={infoUser.subscription?.is_trial_used ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}>
                          {infoUser.subscription?.is_trial_used ? "نعم" : "لا"}
                        </Badge>
                      </div>
                    </>
                  )}

                  {infoUser.subscription?.subscription_start_date && (
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-500">بداية الاشتراك</span>
                      <span className="text-sm font-medium" dir="ltr">
                        {format(new Date(infoUser.subscription.subscription_start_date), "yyyy/MM/dd  hh:mm a", { locale: ar })}
                      </span>
                    </div>
                  )}

                  {infoUser.subscription?.subscription_end_date && (
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-500">نهاية الاشتراك</span>
                      <span className="text-sm font-medium" dir="ltr">
                        {format(new Date(infoUser.subscription.subscription_end_date), "yyyy/MM/dd  hh:mm a", { locale: ar })}
                      </span>
                    </div>
                  )}

                  {infoUser.subscription?.note && (
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <StickyNote className="w-3 h-3" /> ملاحظة
                      </span>
                      <span className="text-sm font-medium">{infoUser.subscription.note}</span>
                    </div>
                  )}

                  {infoUser.subscription?.activated_by && (
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <UserCheck className="w-3 h-3" /> مفعل من قبل
                      </span>
                      <span className="text-sm font-medium" dir="ltr">
                        {infoUser.subscription.activated_by}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
