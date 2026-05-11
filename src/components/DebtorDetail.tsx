import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  User2, Phone, Wallet, Calendar, AlertTriangle,
  Pencil, Trash2, X, Banknote, History,
  FileText, Shield, Save, Landmark,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import * as debtsApi from "@/api/debts";
import * as customersApi from "@/api/customers";
import { CURRENCY } from "@/constants";
import {
  STATUS_MAP, PAYMENT_ICONS, PAYMENT_LABELS,
  getDueStatus, todayStr,
} from "@/lib/debt-utils";
import type { Debt } from "@/types";

interface DebtorDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  totalDebt: number;
  debtCount: number;
}

export function DebtorDetail({
  open, onOpenChange, customerId, customerName, customerPhone: _cp, totalDebt: _td, debtCount: _dc,
}: DebtorDetailProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // ============ Edit Mode ============
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDebtLimit, setEditDebtLimit] = useState("");

  // ============ Active Tab ============
  const [activeTab, setActiveTab] = useState<"debts" | "payments">("debts");

  // ============ Selected Debt & Payment ============
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "transfer">("cash");
  const [paymentNote, setPaymentNote] = useState("");

  // ============ Delete Confirm ============
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // ============ Edit Debt Inline ============
  const [editingDebtId, setEditingDebtId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editStatus, setEditStatus] = useState("active");
  const [editDebtorPhone, setEditDebtorPhone] = useState("");
  const [editGuarantorName, setEditGuarantorName] = useState("");
  const [editGuarantorPhone, setEditGuarantorPhone] = useState("");
  const [editNote, setEditNote] = useState("");

  const startEditDebt = (debt: Debt) => {
    setEditingDebtId(debt.id);
    setEditAmount(debt.total_amount.toFixed(2));
    setEditDueDate(debt.due_date || "");
    setEditStatus(debt.status);
    setEditDebtorPhone(debt.debtor_phone || "");
    setEditGuarantorName(debt.guarantor_name || "");
    setEditGuarantorPhone(debt.guarantor_phone || "");
    setEditNote(debt.notes || "");
  };

  const cancelEditDebt = () => {
    setEditingDebtId(null);
  };

  const editDebtMutation = useMutation({
    mutationFn: async () => {
      const debt = debts.find((d) => d.id === editingDebtId);
      if (!debt) throw new Error("الدين غير موجود");
      const amount = parseFloat(editAmount) || 0;
      const alreadyPaid = debt.total_amount - debt.remaining_amount;
      const remain = Math.max(0, amount - alreadyPaid);
      await debtsApi.updateDebt(editingDebtId!, {
        total_amount: amount,
        remaining_amount: remain,
        status: remain <= 0 ? "paid" : editStatus === "paid" ? "active" : editStatus,
        due_date: editDueDate || undefined,
        guarantor_name: editGuarantorName || undefined,
        guarantor_phone: editGuarantorPhone || undefined,
        debtor_phone: editDebtorPhone || undefined,
        notes: editNote || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-debts", customerId] });
      queryClient.invalidateQueries({ queryKey: ["debt-summary"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      toast({ title: "تم تعديل الدين بنجاح" });
      setEditingDebtId(null);
    },
    onError: (err: Error) =>
      toast({ title: "فشل تعديل الدين", description: err.message, variant: "destructive" }),
  });

  // ============ Queries ============
  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => customersApi.getCustomer(customerId),
    enabled: open && !!customerId,
  });

  const { data: debts = [], isLoading: debtsLoading } = useQuery({
    queryKey: ["customer-debts", customerId],
    queryFn: () => debtsApi.fetchCustomerDebts(customerId),
    enabled: open && !!customerId,
  });

  const { data: payments = [], isLoading: _paymentsLoading } = useQuery({
    queryKey: ["customer-payments", customerId],
    queryFn: () => debtsApi.fetchPayments(),
    enabled: open && !!customerId,
  });

  // Filter payments for this customer
  const customerPayments = payments.filter((p) => p.customer_id === customerId);

  // ============ Derived ============
  const activeDebts = debts.filter((d) => d.status !== "paid");
  const _paidDebts = debts.filter((d) => d.status === "paid");
  const totalRemaining = activeDebts.reduce((s, d) => s + d.remaining_amount, 0);
  const totalPaidAmount = customerPayments.reduce((s, p) => s + p.amount, 0);
  const debtLimit = customer?.debt_limit ?? 0;
  const isOverLimit = debtLimit > 0 && totalRemaining > debtLimit;

  // ============ Edit Customer ============
  const startEditing = () => {
    if (!customer) return;
    setEditName(customer.name);
    setEditPhone(customer.phone || "");
    setEditDebtLimit(String(customer.debt_limit || 0));
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      customersApi.updateCustomer(customerId, {
        name: editName,
        phone: editPhone || undefined,
        debt_limit: parseFloat(editDebtLimit) || 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["debt-summary"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["customer-debts", customerId] });
      toast({ title: "تم حفظ بيانات الزبون" });
      setEditing(false);
    },
    onError: (err: Error) =>
      toast({ title: "فشل الحفظ", description: err.message, variant: "destructive" }),
  });

  // ============ Payment ============
  const openPayment = (debt: Debt) => {
    setSelectedDebt(debt);
    setPaymentAmount(debt.remaining_amount.toFixed(2));
    setPaymentMethod("cash");
    setPaymentNote("");
    setShowPaymentDialog(true);
  };

  const paymentMutation = useMutation({
    mutationFn: () =>
      debtsApi.createDebtPayment({
        debt_id: selectedDebt!.id,
        customer_id: selectedDebt!.customer_id,
        amount: parseFloat(paymentAmount) || 0,
        payment_method: paymentMethod,
        payment_date: todayStr(),
        payment_time: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
        notes: paymentNote || undefined,
        cashier: user?.email || "البائع",
        user_id: user?.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-debts", customerId] });
      queryClient.invalidateQueries({ queryKey: ["customer-payments", customerId] });
      queryClient.invalidateQueries({ queryKey: ["debt-summary"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      toast({ title: "تم تسجيل الدفعة بنجاح" });
      setShowPaymentDialog(false);
    },
    onError: (err: Error) =>
      toast({ title: "فشل تسجيل الدفعة", description: err.message, variant: "destructive" }),
  });

  // ============ Cancel Debt Mutation ============
  const cancelMutation = useMutation({
    mutationFn: () => debtsApi.cancelDebt(deleteTargetId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-debts", customerId] });
      queryClient.invalidateQueries({ queryKey: ["customer-payments", customerId] });
      queryClient.invalidateQueries({ queryKey: ["debt-summary"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      toast({ title: "تم إلغاء الدين بنجاح" });
      setShowDeleteConfirm(false);
    },
    onError: (err: Error) =>
      toast({ title: "فشل إلغاء الدين", description: err.message, variant: "destructive" }),
  });

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setEditing(false);
      setShowPaymentDialog(false);
      setEditingDebtId(null);
      setShowDeleteConfirm(false);
    }
  }, [open]);

  const isLoading = customerLoading || debtsLoading;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent dir="rtl" className="max-w-3xl max-h-[92vh] overflow-y-auto p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>معلومات المديون</DialogTitle>
            <DialogDescription>تفاصيل ديون ومدفوعات الزبون</DialogDescription>
          </DialogHeader>
          {isLoading ? (
            <div className="space-y-4 p-6">
              <Skeleton className="h-12 w-48" />
              <Skeleton className="h-32 rounded-lg" />
              <Skeleton className="h-64 rounded-lg" />
            </div>
          ) : (
            <>
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                      <User2 className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      {editing ? (
                        <div className="space-y-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="text-lg font-bold bg-white/10 border-white/20 text-white placeholder:text-white/40 h-9"
                          />
                          <div className="flex gap-2">
                            <Input
                              type="tel"
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              dir="ltr"
                              className="text-sm bg-white/10 border-white/20 text-white placeholder:text-white/40 h-8"
                              placeholder="رقم الهاتف"
                            />
                            <Input
                              type="number"
                              value={editDebtLimit}
                              onChange={(e) => setEditDebtLimit(e.target.value)}
                              dir="ltr"
                              className="text-sm bg-white/10 border-white/20 text-white placeholder:text-white/40 h-8 w-32"
                              placeholder="حد الدين"
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <h2 className="text-xl font-bold">{customer?.name || customerName}</h2>
                          <div className="flex items-center gap-3 text-white/60 text-sm mt-1">
                            {customer?.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />{customer.phone}
                              </span>
                            )}
                            {debtLimit > 0 && (
                              <span className="flex items-center gap-1">
                                <Shield className="w-3 h-3" />حد الدين: {debtLimit.toFixed(0)} {CURRENCY}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {editing ? (
                      <>
                        <Button size="sm" variant="outline" onClick={cancelEditing}
                          className="border-white/30 text-white hover:bg-white/10 h-8">
                          <X className="w-3.5 h-3.5 ml-1" />إلغاء
                        </Button>
                        <Button size="sm" onClick={() => saveMutation.mutate()}
                          disabled={saveMutation.isPending}
                          className="bg-emerald-500 hover:bg-emerald-600 h-8">
                          {saveMutation.isPending ? "جاري الحفظ..." : <><Save className="w-3.5 h-3.5 ml-1" />حفظ</>}
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" onClick={startEditing}
                        className="border-white/30 text-white hover:bg-white/10 h-8">
                        <Pencil className="w-3.5 h-3.5 ml-1" />تعديل البيانات
                      </Button>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-4 mt-5">
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-white/50 text-xs">إجمالي الديون</p>
                    <p className="text-xl font-bold">{totalRemaining.toFixed(0)} {CURRENCY}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-white/50 text-xs">عدد الديون النشطة</p>
                    <p className="text-xl font-bold">{activeDebts.length}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-white/50 text-xs">إجمالي المسدد</p>
                    <p className="text-xl font-bold text-emerald-300">{totalPaidAmount.toFixed(0)} {CURRENCY}</p>
                  </div>
                  <div className={`rounded-lg p-3 ${isOverLimit ? "bg-red-500/30" : "bg-white/10"}`}>
                    <p className="text-white/50 text-xs">حد الدين</p>
                    <p className="text-xl font-bold">{debtLimit > 0 ? `${debtLimit.toFixed(0)} ${CURRENCY}` : "غير محدد"}</p>
                    {isOverLimit && <p className="text-xs text-red-200 mt-0.5">تم تجاوز الحد!</p>}
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b px-6">
                <button
                  onClick={() => setActiveTab("debts")}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "debts"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <FileText className="w-4 h-4 inline ml-1.5" />
                  الديون ({debts.length})
                </button>
                <button
                  onClick={() => setActiveTab("payments")}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "payments"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <History className="w-4 h-4 inline ml-1.5" />
                  سجل المدفوعات ({customerPayments.length})
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6 pt-4">
                {activeTab === "debts" && (
                  <div className="space-y-4">
                    {debts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <Landmark className="w-12 h-12 mb-3 opacity-30" />
                        <p className="text-lg font-medium">لا توجد ديون لهذا الزبون</p>
                      </div>
                    ) : (
                      debts.map((debt) => {
                        const status = STATUS_MAP[debt.status] || STATUS_MAP.active;
                        const StatusIcon = status.icon;
                        const dueStatus = getDueStatus(debt.due_date);
                        const paidPercent = debt.total_amount > 0
                          ? ((debt.total_amount - debt.remaining_amount) / debt.total_amount) * 100 : 0;

                        return (
                          <div key={debt.id} className="bg-white border rounded-lg p-4 hover:border-blue-200 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  debt.status === "paid" ? "bg-emerald-50" : debt.status === "overdue" ? "bg-red-50" : "bg-blue-50"
                                }`}>
                                  <StatusIcon className={`w-5 h-5 ${
                                    debt.status === "paid" ? "text-emerald-600" : debt.status === "overdue" ? "text-red-600" : "text-blue-600"
                                  }`} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    {debt.invoice_number ? (
                                      <Badge variant="outline" className="text-xs font-mono">{debt.invoice_number}</Badge>
                                    ) : (
                                      <span className="text-xs text-gray-400">يدوي</span>
                                    )}
                                    <Badge variant="outline" className={`text-xs ${status.color}`}>
                                      {status.label}
                                    </Badge>
                                  </div>
                                  {debt.notes && (
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{debt.notes}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {debt.status !== "paid" && editingDebtId !== debt.id && (
                                  <Button variant="ghost" size="sm" className="h-8 text-emerald-600 hover:bg-emerald-50"
                                    onClick={() => openPayment(debt)} title="تسجيل دفعة">
                                    <Banknote className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                                {editingDebtId !== debt.id && (
                                  <Button variant="ghost" size="sm" className="h-8 text-amber-600 hover:bg-amber-50"
                                    onClick={() => startEditDebt(debt)} title="تعديل الدين">
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                                {editingDebtId !== debt.id && (
                                  <Button variant="ghost" size="sm" className="h-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => { setDeleteTargetId(debt.id); setShowDeleteConfirm(true); }}
                                    title="إلغاء الدين">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            {editingDebtId === debt.id ? (
                              /* === Inline Edit Mode === */
                              <div className="space-y-3 mt-3 pt-3 border-t">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-xs text-gray-500 block mb-1">المبلغ الكلي</label>
                                    <Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)}
                                      dir="ltr" className="text-sm font-bold text-center" />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-500 block mb-1">المدفوع</label>
                                    <Input type="text" dir="ltr" className="text-sm font-bold text-center bg-gray-100"
                                      disabled value={(debt.total_amount - debt.remaining_amount).toFixed(2)} />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-xs text-gray-500 block mb-1">تاريخ الاستحقاق</label>
                                    <Input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} className="text-sm" />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-500 block mb-1">الحالة</label>
                                    <Select value={editStatus} onValueChange={setEditStatus}>
                                      <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="active">نشط</SelectItem>
                                        <SelectItem value="partially_paid">مدفوع جزئياً</SelectItem>
                                        <SelectItem value="overdue">متأخر</SelectItem>
                                        <SelectItem value="paid">مدفوع</SelectItem>
                                        <SelectItem value="cancelled">ملغي</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500 block mb-1">رقم هاتف المديون</label>
                                  <Input type="tel" value={editDebtorPhone} onChange={(e) => setEditDebtorPhone(e.target.value)}
                                    dir="ltr" className="text-sm" placeholder="رقم الهاتف" />
                                </div>
                                <div className="bg-gray-50 border rounded-lg p-2 space-y-2">
                                  <span className="text-xs font-medium text-gray-600">بيانات الكفيل</span>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-[11px] text-gray-400 block mb-0.5">اسم الكفيل</label>
                                      <Input value={editGuarantorName} onChange={(e) => setEditGuarantorName(e.target.value)}
                                        className="text-sm h-8" placeholder="اسم الكفيل" />
                                    </div>
                                    <div>
                                      <label className="text-[11px] text-gray-400 block mb-0.5">رقم الكفيل</label>
                                      <Input type="tel" value={editGuarantorPhone} onChange={(e) => setEditGuarantorPhone(e.target.value)}
                                        dir="ltr" className="text-sm h-8" placeholder="رقم الهاتف" />
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500 block mb-1">ملاحظات</label>
                                  <Input value={editNote} onChange={(e) => setEditNote(e.target.value)}
                                    className="text-sm" placeholder="ملاحظات..." />
                                </div>
                                <div className="flex gap-2 justify-end pt-1">
                                  <Button size="sm" variant="outline" className="h-8" onClick={cancelEditDebt}>
                                    <X className="w-3 h-3 ml-1" />إلغاء
                                  </Button>
                                  <Button size="sm" className="h-8 bg-amber-600 hover:bg-amber-700"
                                    onClick={() => editDebtMutation.mutate()}
                                    disabled={editDebtMutation.isPending || !editAmount || parseFloat(editAmount) <= 0}>
                                    {editDebtMutation.isPending ? "جاري..." : <><Save className="w-3 h-3 ml-1" />حفظ</>}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              /* === Normal Display === */
                              <>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                  <div>
                                    <span className="text-gray-400 text-xs">المبلغ الكلي</span>
                                    <p className="font-bold">{debt.total_amount.toFixed(2)} {CURRENCY}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-400 text-xs">المتبقي</span>
                                    <p className={`font-bold ${debt.remaining_amount > 0 ? "text-red-600" : "text-emerald-600"}`}>
                                      {debt.remaining_amount.toFixed(2)} {CURRENCY}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-gray-400 text-xs">المدفوع</span>
                                    <p className="font-bold text-emerald-600">
                                      {(debt.total_amount - debt.remaining_amount).toFixed(2)} {CURRENCY}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-gray-400 text-xs">تاريخ الاستحقاق</span>
                                    <p className={`font-medium flex items-center gap-1 ${dueStatus.color}`}>
                                      <Calendar className="w-3 h-3" />
                                      {debt.due_date || "غير محدد"}
                                    </p>
                                  </div>
                                </div>

                                {/* Progress bar */}
                                {paidPercent > 0 && debt.status !== "paid" && (
                                  <div className="mt-3">
                                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                                      <span>نسبة السداد</span>
                                      <span>{paidPercent.toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                        style={{ width: `${paidPercent}%` }}
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Guarantor info */}
                                {(debt.guarantor_name || debt.guarantor_phone) && (
                                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded p-2 text-xs">
                                    <span className="text-amber-700 font-medium">الكفيل: </span>
                                    {debt.guarantor_name && <span>{debt.guarantor_name}</span>}
                                    {debt.guarantor_phone && (
                                      <span className="mr-2" dir="ltr">{debt.guarantor_phone}</span>
                                    )}
                                  </div>
                                )}
                              </>)}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {activeTab === "payments" && (
                  <div>
                    {customerPayments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <Wallet className="w-12 h-12 mb-3 opacity-30" />
                        <p className="text-lg font-medium">لا توجد مدفوعات لهذا الزبون</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="text-right">التاريخ</TableHead>
                            <TableHead className="text-right">رقم الفاتورة</TableHead>
                            <TableHead className="text-right">المبلغ</TableHead>
                            <TableHead className="text-right">الطريقة</TableHead>
                            <TableHead className="text-right">الكاشير</TableHead>
                            <TableHead className="text-right">ملاحظات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customerPayments.map((p) => {
                            const PIcon = PAYMENT_ICONS[p.payment_method];
                            return (
                              <TableRow key={p.id}>
                                <TableCell className="text-sm">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-gray-400" />
                                    {p.payment_date}
                                    {p.payment_time && <span className="text-gray-400 text-xs">{p.payment_time}</span>}
                                  </div>
                                </TableCell>
                                <TableCell>{/* debt info could be linked here */}-</TableCell>
                                <TableCell className="font-bold text-emerald-600">
                                  +{p.amount.toFixed(2)} {CURRENCY}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs flex items-center gap-1 w-fit">
                                    <PIcon className="w-3 h-3" />{PAYMENT_LABELS[p.payment_method]}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm">{p.cashier || "-"}</TableCell>
                                <TableCell className="text-sm text-gray-500 max-w-[120px] truncate">
                                  {p.notes || "-"}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog (inside debtor detail) */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-600" />تسجيل دفعة
            </DialogTitle>
            <DialogDescription>
              {selectedDebt && <span>تسجيل دفعة من الزبون: <strong>{customerName}</strong></span>}
            </DialogDescription>
          </DialogHeader>
          {selectedDebt && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-3">
                <div>
                  <p className="text-xs text-gray-500">المبلغ الكلي</p>
                  <p className="font-bold text-lg">{selectedDebt.total_amount.toFixed(2)} {CURRENCY}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">المتبقي</p>
                  <p className="font-bold text-lg text-red-600">{selectedDebt.remaining_amount.toFixed(2)} {CURRENCY}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">المبلغ المدفوع</label>
                <Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00" dir="ltr" min={0} max={selectedDebt.remaining_amount} autoFocus />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">طريقة الدفع</label>
                <div className="flex gap-2">
                  {(["cash", "card", "transfer"] as const).map((m) => {
                    const Icon = PAYMENT_ICONS[m];
                    return (
                      <Button key={m} variant={paymentMethod === m ? "default" : "outline"} size="sm" className="flex-1 gap-1"
                        onClick={() => setPaymentMethod(m)}>
                        <Icon className="w-3.5 h-3.5" />{PAYMENT_LABELS[m]}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">ملاحظات</label>
                <Input value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} placeholder="ملاحظات..." />
              </div>
            </div>
          )}
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>إلغاء</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => paymentMutation.mutate()}
              disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || parseFloat(paymentAmount) > (selectedDebt?.remaining_amount || 0) || paymentMutation.isPending}>
              {paymentMutation.isPending ? "جاري التسجيل..." : "تسجيل الدفعة"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />تأكيد الإلغاء
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من إلغاء هذا الدين؟ جميع المدفوعات المرتبطة به ستبقى محفوظة.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? "جاري الإلغاء..." : "تأكيد الإلغاء"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
