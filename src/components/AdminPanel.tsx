import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchUsers, activateSubscription, suspendUser, extendSubscription } from "@/api/users";
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
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CURRENCY } from "@/constants";

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

function getDaysRemaining(sub: NonNullable<ReturnType<typeof formatSubscription>["subscription"]>): number {
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

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchUsers,
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
      toast.success("تم تمديد الاشتراك بنجاح");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setExtendDialog(false);
      setExtendDays(30);
    },
    onError: (err: Error) => {
      toast.error(err.message || "فشل التمديد");
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
          {Array.from({ length: 4 }).map((_, i) => (
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
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ الانتهاء</TableHead>
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
                      <TableCell className="font-medium">{user.full_name || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground" dir="ltr">
                        {user.email}
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        {user.subscription ? getStatusBadge(user.subscription.status) : "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {user.subscription?.status === "trial"
                          ? formatDate(user.subscription.trial_end_date)
                          : formatDate(user.subscription?.subscription_end_date)}
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
                              {user.subscription?.status === "suspended" || user.subscription?.status === "expired" ? (
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
                              ) : (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                    onClick={() => {
                                      setSelectedUser(user.id);
                                      setExtendDialog(true);
                                    }}
                                  >
                                    <RefreshCw className="w-3.5 h-3.5 ml-1" />
                                    تمديد
                                  </Button>
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
                                </>
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
              تمديد الاشتراك
            </DialogTitle>
            <DialogDescription>
              أضف أيام إضافية إلى اشتراك المستخدم الحالي
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="extendDays">عدد الأيام الإضافية</Label>
              <Input
                id="extendDays"
                type="number"
                min={1}
                value={extendDays}
                onChange={(e) => setExtendDays(Number(e.target.value))}
              />
            </div>
            {extendDays >= 30 && (
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                <p className="text-sm text-purple-800">
                  السعر التقريبي:{" "}
                  <span className="font-bold">
                    {Math.ceil(extendDays / 30) * SUBSCRIPTION_PRICE.toLocaleString()} {CURRENCY}
                  </span>
                </p>
              </div>
            )}
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
              تمديد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
