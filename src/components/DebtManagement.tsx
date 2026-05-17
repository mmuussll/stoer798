import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Landmark, Search, Plus, Wallet, Calendar, AlertTriangle,
  User2, Phone, Banknote, CheckCircle2,
  Clock4, History, Filter, ShoppingBag,
  ChevronDown, ChevronUp, DollarSign,
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { DebtorDetail } from "@/components/DebtorDetail";
import DebtsTable from "@/components/debts/DebtsTable";
import RecordPaymentDialog from "@/components/debts/RecordPaymentDialog";
import EditDebtDialog from "@/components/debts/EditDebtDialog";
import DeleteDebtConfirmDialog from "@/components/debts/DeleteDebtConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import * as debtsApi from "@/api/debts";
import * as customersApi from "@/api/customers";
import { formatCurrency, formatCurrencyDisplay, formatNumberDisplay } from "@/lib/format";
import {
  STATUS_MAP, PAYMENT_ICONS, PAYMENT_LABELS,
  getDueStatus, todayStr, defaultDueDate,
} from "@/lib/debt-utils";
import type { Customer, Debt, DebtItem, DebtPayment } from "@/types";

const ITEMS_PER_PAGE = 15;

// ============================================================
// المكون الرئيسي
// ============================================================

export default function DebtManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Payment dialog
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "transfer">("cash");
  const [paymentNote, setPaymentNote] = useState("");

  // Detail dialog
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [detailPayments, setDetailPayments] = useState<DebtPayment[]>([]);

  // Add debt dialog
  const [showAddDebtDialog, setShowAddDebtDialog] = useState(false);
  const [addCustomerSearch, setAddCustomerSearch] = useState("");
  const [addSelectedCustomer, setAddSelectedCustomer] = useState<Customer | null>(null);
  const [addCustomerName, setAddCustomerName] = useState("");
  const [addCustomerPhone, setAddCustomerPhone] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [addDueDate, setAddDueDate] = useState(defaultDueDate());
  const [addDebtorPhone, setAddDebtorPhone] = useState("");
  const [addGuarantorName, setAddGuarantorName] = useState("");
  const [addGuarantorPhone, setAddGuarantorPhone] = useState("");
  const [addNote, setAddNote] = useState("");
  const [addItems, setAddItems] = useState("");
  const [addInitPayment, setAddInitPayment] = useState("");
  const [addPaymentMethod, setAddPaymentMethod] = useState<"cash" | "card" | "transfer">("cash");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Edit debt dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editAmount, setEditAmount] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editStatus, setEditStatus] = useState("active");
  const [editDebtorPhone, setEditDebtorPhone] = useState("");
  const [editGuarantorName, setEditGuarantorName] = useState("");
  const [editGuarantorPhone, setEditGuarantorPhone] = useState("");
  const [editNote, setEditNote] = useState("");

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState("");

  // Debtor detail
  const [showDebtorDetail, setShowDebtorDetail] = useState(false);
  const [debtorDetailId, setDebtorDetailId] = useState("");
  const [debtorDetailName, setDebtorDetailName] = useState("");
  const [debtorDetailPhone, setDebtorDetailPhone] = useState<string | undefined>("");
  const [debtorDetailTotal, setDebtorDetailTotal] = useState(0);
  const [debtorDetailCount, setDebtorDetailCount] = useState(0);

  // ============ Queries ============

  const { data: searchedCustomers = [], isLoading: searchLoading } = useQuery({
    queryKey: ["add-debt-customer-search", addCustomerSearch],
    queryFn: () => customersApi.searchCustomers(addCustomerSearch),
    enabled: addCustomerSearch.trim().length >= 2,
    staleTime: 10000,
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["debt-summary"],
    queryFn: debtsApi.getDebtSummary,
  });

  const { data: debts = [], isLoading: debtsLoading, isError: debtsError } = useQuery({
    queryKey: ["debts"],
    queryFn: debtsApi.fetchDebts,
  });

  // ============ Derived Data ============

  const filteredDebts = useMemo(() => {
    let result = debts;
    if (statusFilter !== "all") result = result.filter((d) => d.status === statusFilter);
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (d) =>
          d.customer_name.toLowerCase().includes(term) ||
          d.customer_phone.includes(term) ||
          (d.invoice_number && d.invoice_number.toLowerCase().includes(term))
      );
    }
    return result;
  }, [debts, statusFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredDebts.length / ITEMS_PER_PAGE));
  const paginatedDebts = filteredDebts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const activeStats = useMemo(() => {
    const active = debts.filter((d) => d.status !== "paid");
    const overdue = active.filter((d) => d.due_date && d.due_date < todayStr());
    return {
      totalActive: active.length,
      totalOverdue: overdue.length,
      totalOverdueAmount: overdue.reduce((s, d) => s + d.remaining_amount, 0),
    };
  }, [debts]);

  // ============ Payment Mutation ============

  const openPaymentDialog = (debt: Debt) => {
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
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["debt-summary"] });
      if (selectedDebt) {
        queryClient.invalidateQueries({ queryKey: ["customer-debts", selectedDebt.customer_id] });
        queryClient.invalidateQueries({ queryKey: ["customer-payments", selectedDebt.customer_id] });
      }
      toast({ title: "تم تسجيل الدفعة بنجاح" });
      setShowPaymentDialog(false);
    },
    onError: (err: Error) => {
      toast({ title: "فشل تسجيل الدفعة", description: err.message, variant: "destructive" });
    },
  });

  // ============ Detail Dialog ============

  const openDetailDialog = async (debt: Debt) => {
    setSelectedDebt(debt);
    setShowDetailDialog(true);
    try {
      const payments = await debtsApi.fetchPayments(debt.id);
      setDetailPayments(payments);
    } catch {
      setDetailPayments([]);
    }
  };

  // ============ Add Debt Mutation ============

  const openAddDialog = () => {
    setAddCustomerSearch("");
    setAddSelectedCustomer(null);
    setAddCustomerName("");
    setAddCustomerPhone("");
    setAddAmount("");
    setAddDueDate(defaultDueDate());
    setAddDebtorPhone("");
    setAddGuarantorName("");
    setAddGuarantorPhone("");
    setAddNote("");
    setAddItems("");
    setAddInitPayment("");
    setAddPaymentMethod("cash");
    setShowAdvanced(false);
    setShowAddDebtDialog(true);
  };

  const addDebtMutation = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(addAmount) || 0;
      const initPayment = parseFloat(addInitPayment) || 0;
      const remaining = Math.max(0, amount - initPayment);

      // Determine customer info
      let customerId: string;
      let customerName: string;
      let customerPhone: string;

      if (addSelectedCustomer) {
        customerId = addSelectedCustomer.id;
        customerName = addSelectedCustomer.name;
        customerPhone = addSelectedCustomer.phone || "";
      } else {
        const name = addCustomerName.trim() || addCustomerPhone.trim() || addDebtorPhone.trim() || "زبون";
        const phone = addCustomerPhone.trim() || addDebtorPhone.trim() || "";
        try {
          const c = await customersApi.createCustomer({ name, phone: phone || undefined, total_debt: 0, debt_limit: 0 });
          customerId = c.id;
          customerName = c.name;
          customerPhone = c.phone || phone || "";
        } catch (custErr) {
          throw new Error(`فشل إنشاء الزبون: ${(custErr as Error).message}`);
        }
      }

      if (!customerId) throw new Error("تعذر تحديد الزبون");

      // Parse items
      let parsedItems: DebtItem[] = [];
      if (addItems.trim()) {
        parsedItems = addItems
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .map((line) => {
            const m = line.match(/^(.+?)\s*x\s*(\d+)$/i);
            return m
              ? { name: m[1].trim(), price: 0, quantity: parseInt(m[2]) || 1 }
              : { name: line, price: 0, quantity: 1 };
          });
      }

      const debt = await debtsApi.createDebt({
        customer_id: customerId,
        customer_name: customerName,
        customer_phone: customerPhone,
        total_amount: amount,
        remaining_amount: remaining,
        status: remaining <= 0 ? "paid" : "active",
        due_date: addDueDate || undefined,
        guarantor_name: addGuarantorName || undefined,
        guarantor_phone: addGuarantorPhone || undefined,
        debtor_phone: addDebtorPhone || customerPhone || undefined,
        debt_items: parsedItems,
        notes: addNote || `دين مضاف يدوياً`,
      });

      // Initial payment
      if (initPayment > 0 && remaining > 0) {
        try {
          await debtsApi.createDebtPayment({
            debt_id: debt.id,
            customer_id: debt.customer_id,
            amount: initPayment,
            payment_method: addPaymentMethod,
            payment_date: todayStr(),
            payment_time: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
            notes: "دفعة أولية",
            cashier: user?.email || "البائع",
            user_id: user?.id,
          });
        } catch {
          toast({ title: "تنبيه", description: "تم إضافة الدين لكن فشل تسجيل الدفعة الأولية", variant: "destructive" });
        }
      }

      return debt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["debt-summary"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "تم إضافة الدين بنجاح" });
      setShowAddDebtDialog(false);
    },
    onError: (err: Error) => {
      toast({ title: "فشل إضافة الدين", description: err.message, variant: "destructive" });
    },
  });

  // ============ Edit Debt Mutation ============

  const openEditDialog = (debt: Debt) => {
    setSelectedDebt(debt);
    setEditAmount(debt.total_amount.toFixed(2));
    setEditDueDate(debt.due_date || "");
    setEditStatus(debt.status);
    setEditDebtorPhone(debt.debtor_phone || "");
    setEditGuarantorName(debt.guarantor_name || "");
    setEditGuarantorPhone(debt.guarantor_phone || "");
    setEditNote(debt.notes || "");
    setShowEditDialog(true);
  };

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDebt) throw new Error("لم يتم تحديد الدين");
      const amount = parseFloat(editAmount) || 0;
      const remain = Math.max(0, amount - (selectedDebt.total_amount - selectedDebt.remaining_amount));
      await debtsApi.updateDebt(selectedDebt.id, {
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
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["debt-summary"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      if (selectedDebt) {
        queryClient.invalidateQueries({ queryKey: ["customer-debts", selectedDebt.customer_id] });
        queryClient.invalidateQueries({ queryKey: ["customer-payments", selectedDebt.customer_id] });
      }
      toast({ title: "تم تعديل الدين بنجاح" });
      setShowEditDialog(false);
    },
    onError: (err: Error) => toast({ title: "فشل تعديل الدين", description: err.message, variant: "destructive" }),
  });

  // ============ Cancel Debt Mutation ============

  const cancelMutation = useMutation({
    mutationFn: () => debtsApi.cancelDebt(deleteTargetId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["debt-summary"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      if (selectedDebt) {
        queryClient.invalidateQueries({ queryKey: ["customer-debts", selectedDebt.customer_id] });
      }
      toast({ title: "تم إلغاء الدين بنجاح" });
      setShowDeleteConfirm(false);
    },
    onError: (err: Error) => toast({ title: "فشل إلغاء الدين", description: err.message, variant: "destructive" }),
  });

  // ============ Cancel Payment Mutation ============

  const cancelPaymentMutation = useMutation({
    mutationFn: (paymentId: string) => debtsApi.cancelDebtPayment(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["debt-summary"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      if (selectedDebt) {
        debtsApi.getDebt(selectedDebt.id).then((d) => { if (d) setSelectedDebt(d); }).catch(() => {});
        debtsApi.fetchPayments(selectedDebt.id).then(setDetailPayments).catch(() => {});
      }
      toast({ title: "تم إلغاء الدفعة بنجاح" });
    },
    onError: (err: Error) => toast({ title: "فشل إلغاء الدفعة", description: err.message, variant: "destructive" }),
  });

  const canAddDebt =
    (addSelectedCustomer || addCustomerName.trim() || addCustomerPhone.trim() || addDebtorPhone.trim()) &&
    addAmount && parseFloat(addAmount) > 0 &&
    (!addInitPayment || parseFloat(addInitPayment) <= (parseFloat(addAmount) || 0));

  // ============ Loading State ============

  if (summaryLoading || debtsLoading) {
    return (
      <div className="space-y-6 p-4" dir="rtl">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  // ============ Render ============

  return (
    <div className="space-y-6 p-4" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة الديون</h1>
          <p className="text-sm text-muted-foreground mt-1">متابعة وإدارة ديون الزبائن والمدفوعات</p>
        </div>
        <Button onClick={openAddDialog} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
          <Plus className="w-4 h-4" /> إضافة دين جديد
        </Button>
      </div>

      {/* Error banner */}
      {debtsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          فشل تحميل قائمة الديون. تحقق من اتصال الانترنت أو صلاحيات الحساب.
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard title="إجمالي الديون المستحقة"
          value={formatCurrencyDisplay(summary?.total_outstanding || 0, 2)}
          icon={Landmark} color="text-primary" bg="bg-primary/5 border border-primary/20"
          sub={`${activeStats.totalActive} دين نشط`} />
        <StatCard title="الديون المتأخرة"
          value={formatCurrencyDisplay(activeStats.totalOverdueAmount, 2)}
          icon={AlertTriangle}
          color={activeStats.totalOverdue > 0 ? "text-red-600" : "text-muted-foreground"}
          bg={activeStats.totalOverdue > 0 ? "bg-red-50 border border-red-200" : "bg-muted/50"}
          sub={`${activeStats.totalOverdue} دين متأخر`} />
        <StatCard title="الديون النشطة"
          value={formatCurrencyDisplay(summary?.total_active || 0, 2)}
          icon={Clock4} color="text-amber-600" bg="bg-amber-50 border border-amber-200"
          sub="غير متأخرة" />
        <StatCard title="زبائن مدينون"
          value={String(summary?.total_customers_with_debt || 0)}
          icon={User2} color="text-violet-600" bg="bg-violet-50 border border-violet-200"
          sub="لديهم ديون نشطة" />
        <StatCard title="إجمالي الديون المسددة"
          value={formatCurrencyDisplay(debts.filter((d) => d.status === "paid").reduce((s, d) => s + d.total_amount, 0), 2)}
          icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50 border border-emerald-200"
          sub="تم تسديدها بالكامل" />
      </div>

      {/* Top Customers with Debt */}
      {summary && summary.customers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {summary.customers.slice(0, 8).map((c) => (
            <Card key={c.id} className="border-l-4 border-l-red-400 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setDebtorDetailId(c.id);
                setDebtorDetailName(c.name);
                setDebtorDetailPhone(c.phone);
                setDebtorDetailTotal(c.total_debt);
                setDebtorDetailCount(c.debt_count);
                setShowDebtorDetail(true);
              }}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <User2 className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{c.name}</p>
                      {c.phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{c.phone}</p>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-red-600">{formatCurrency(c.total_debt, 2)}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{c.debt_count} دين</span>
                      {c.debt_limit > 0 && c.total_debt > c.debt_limit && (
                        <Badge variant="destructive" className="text-xs">تجاوز الحد</Badge>
                      )}
                    </div>
                  </div>
                  {c.oldest_due_date && (
                    <Badge variant="outline" className={getDueStatus(c.oldest_due_date).color + " text-xs"}>
                      {getDueStatus(c.oldest_due_date).label}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Search & Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3 items-center flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <Input value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="ابحث باسم الزبون أو رقم الفاتورة..." className="pr-10" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <Filter className="w-3.5 h-3.5 ml-1.5" />
                <SelectValue placeholder="كل الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="partially_paid">مدفوع جزئياً</SelectItem>
                <SelectItem value="overdue">متأخر</SelectItem>
                <SelectItem value="paid">مدفوع</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Debts Table */}
      <DebtsTable
        debts={paginatedDebts}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onDetail={openDetailDialog}
        onPayment={openPaymentDialog}
        onEdit={openEditDialog}
        onDelete={(debt) => { setDeleteTargetId(debt.id); setDeleteTargetName(debt.customer_name); setShowDeleteConfirm(true); }}
        onDebtorDetail={(debt) => {
          setDebtorDetailId(debt.customer_id);
          setDebtorDetailName(debt.customer_name);
          setDebtorDetailPhone(debt.customer_phone);
          setDebtorDetailTotal(debts.filter((d) => d.customer_id === debt.customer_id && d.status !== "paid").reduce((s, d) => s + d.remaining_amount, 0));
          setDebtorDetailCount(debts.filter((d) => d.customer_id === debt.customer_id && d.status !== "paid").length);
          setShowDebtorDetail(true);
        }}
      />

      <RecordPaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        debt={selectedDebt}
        paymentAmount={paymentAmount}
        onPaymentAmountChange={setPaymentAmount}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        paymentNote={paymentNote}
        onPaymentNoteChange={setPaymentNote}
        onSubmit={() => paymentMutation.mutate()}
        isPending={paymentMutation.isPending}
      />

      {/* ==================== Detail Dialog ==================== */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent dir="rtl" className="max-w-2xl max-h-[85vh] overflow-y-auto max-sm:mx-2 max-sm:w-[calc(100%-16px)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />تفاصيل الدين والمدفوعات
            </DialogTitle>
          </DialogHeader>
          {selectedDebt && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-muted/50 rounded-lg">
                <div><p className="text-xs text-muted-foreground">الزبون</p><p className="font-semibold text-sm">{selectedDebt.customer_name || "-"}</p></div>
                <div><p className="text-xs text-muted-foreground">الفاتورة</p><p className="font-semibold text-sm font-mono">{selectedDebt.invoice_number || "-"}</p></div>
                <div><p className="text-xs text-muted-foreground">المبلغ الكلي</p><p className="font-bold text-primary">{formatCurrency(selectedDebt.total_amount, 2)}</p></div>
                <div><p className="text-xs text-muted-foreground">المتبقي</p><p className="font-bold text-red-600">{formatCurrency(selectedDebt.remaining_amount, 2)}</p></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><span className="text-muted-foreground">الحالة: </span><Badge variant="outline" className={STATUS_MAP[selectedDebt.status]?.color}>{STATUS_MAP[selectedDebt.status]?.label}</Badge></div>
                <div><span className="text-muted-foreground">تاريخ الاستحقاق: </span><span className={getDueStatus(selectedDebt.due_date).color}>{selectedDebt.due_date || "غير محدد"}</span></div>
                <div><span className="text-muted-foreground">المدفوع: </span><span className="text-emerald-600 font-semibold">{formatCurrency(selectedDebt.total_amount - selectedDebt.remaining_amount, 2)}</span></div>
                <div><span className="text-muted-foreground">نسبة السداد: </span><span className="text-emerald-600 font-semibold">{formatNumberDisplay(selectedDebt.total_amount > 0 ? (1 - selectedDebt.remaining_amount / selectedDebt.total_amount) * 100 : 0, 1)}%</span></div>
              </div>
              {selectedDebt.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-700 font-medium mb-1">ملاحظات:</p>
                  <p className="text-sm text-amber-800">{selectedDebt.notes}</p>
                </div>
              )}
              {(selectedDebt.guarantor_name || selectedDebt.guarantor_phone) && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <p className="text-xs text-primary/80 font-medium mb-2">بيانات الكفيل:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {selectedDebt.guarantor_name && <div><span className="text-muted-foreground">اسم الكفيل: </span><span className="font-semibold">{selectedDebt.guarantor_name}</span></div>}
                    {selectedDebt.guarantor_phone && <div><span className="text-muted-foreground">رقم الكفيل: </span><span className="font-semibold" dir="ltr">{selectedDebt.guarantor_phone}</span></div>}
                  </div>
                </div>
              )}
              {selectedDebt.debtor_phone && selectedDebt.debtor_phone !== selectedDebt.customer_phone && (
                <div className="text-sm"><span className="text-muted-foreground">رقم هاتف المديون: </span><span className="font-semibold" dir="ltr">{selectedDebt.debtor_phone}</span></div>
              )}
              {selectedDebt.debt_items && selectedDebt.debt_items.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-orange-500" />المنتجات المعطاة للمديون
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-orange-50">
                          <TableHead className="text-right text-xs">#</TableHead>
                          <TableHead className="text-right text-xs">المنتج</TableHead>
                          <TableHead className="text-right text-xs">الكمية</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedDebt.debt_items.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-muted-foreground/60 text-xs">{idx + 1}</TableCell>
                            <TableCell className="font-medium text-sm">{item.name}</TableCell>
                            <TableCell><Badge variant="secondary" className="text-xs">{item.quantity}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
              <Separator />
              <div>
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-muted-foreground" />سجل المدفوعات ({detailPayments.length})
                </h3>
                {detailPayments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/60">
                    <Wallet className="w-8 h-8 mb-2" /><p className="text-sm">لا توجد مدفوعات حتى الآن</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-right">التاريخ</TableHead>
                          <TableHead className="text-right">المبلغ</TableHead>
                          <TableHead className="text-right">الطريقة</TableHead>
                          <TableHead className="text-right">الكاشير</TableHead>
                          <TableHead className="text-right">ملاحظات</TableHead>
                          <TableHead className="text-center">إجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailPayments.map((p) => {
                          const PIcon = PAYMENT_ICONS[p.payment_method] || DollarSign;
                          return (
                            <TableRow key={p.id}>
                              <TableCell><div className="flex items-center gap-1 text-sm"><Calendar className="w-3 h-3 text-muted-foreground/60" />{p.payment_date}{p.payment_time && <span className="text-muted-foreground/60 text-xs">{p.payment_time}</span>}</div></TableCell>
                              <TableCell className="font-bold text-emerald-600">+{formatCurrency(p.amount, 2)}</TableCell>
                              <TableCell><Badge variant="outline" className="text-xs flex items-center gap-1 w-fit"><PIcon className="w-3 h-3" />{PAYMENT_LABELS[p.payment_method]}</Badge></TableCell>
                              <TableCell className="text-sm">{p.cashier || "-"}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{p.notes || "-"}</TableCell>
                              <TableCell className="text-center">
                                <Button variant="ghost" size="sm"
                                  className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => { if (confirm("إلغاء هذه الدفعة؟")) cancelPaymentMutation.mutate(p.id); }}
                                  title="إلغاء الدفعة">
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== Add Debt Dialog ==================== */}
      <Dialog open={showAddDebtDialog} onOpenChange={(open) => { if (!open) setShowAddDebtDialog(false); }}>
        <DialogContent dir="rtl" className="max-w-lg max-h-[90vh] overflow-y-auto max-sm:mx-2 max-sm:w-[calc(100%-16px)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-emerald-600" />إضافة دين جديد
            </DialogTitle>
            <DialogDescription>أضف ديناً جديداً على الزبون مع إمكانية تسجيل دفعة أولية</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 1. Customer */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">الزبون <span className="text-red-500">*</span></label>
              {addSelectedCustomer ? (
                <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                      <User2 className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{addSelectedCustomer.name}</p>
                      {addSelectedCustomer.phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{addSelectedCustomer.phone}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {addSelectedCustomer.total_debt > 0 && (
                      <Badge variant="destructive" className="text-xs">عليه {formatCurrency(addSelectedCustomer.total_debt, 2)}</Badge>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 text-muted-foreground/60 hover:text-red-500"
                      onClick={() => { setAddSelectedCustomer(null); setAddCustomerSearch(""); }}>
                      تغيير
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <Input value={addCustomerSearch} onChange={(e) => setAddCustomerSearch(e.target.value)}
                      placeholder="ابحث باسم الزبون أو رقم الهاتف..." className="pr-10" autoFocus />
                  </div>
                  {addCustomerSearch.trim().length >= 2 && (
                    <div className="border rounded-lg max-h-40 overflow-y-auto divide-y">
                      {searchLoading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground/60">جاري البحث...</div>
                      ) : searchedCustomers.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground/60">لا توجد نتائج - أدخل بيانات الزبون يدوياً أدناه</div>
                      ) : (
                        searchedCustomers.map((c: Customer) => (
                          <div key={c.id} className="flex items-center justify-between p-2.5 hover:bg-primary/5 cursor-pointer transition-colors"
                            onClick={() => { setAddSelectedCustomer(c); setAddCustomerSearch(""); }}>
                            <div className="flex items-center gap-2">
                              <User2 className="w-4 h-4 text-muted-foreground/60" />
                              <div>
                                <p className="font-medium text-sm">{c.name}</p>
                                {c.phone && <p className="text-xs text-muted-foreground/60">{c.phone}</p>}
                              </div>
                            </div>
                            {c.total_debt > 0 && (
                              <Badge variant="outline" className="text-xs text-red-500 border-red-200">عليه {formatCurrency(c.total_debt, 0)}</Badge>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  <div className="bg-muted/30 border border-dashed border-muted-foreground/25 rounded-lg p-3 space-y-2">
                    <p className="text-xs text-slate-500 font-medium">أو أدخل بيانات زبون جديد:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-500 block mb-0.5">الاسم</label>
                        <Input value={addCustomerName} onChange={(e) => setAddCustomerName(e.target.value)} placeholder="اسم الزبون" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 block mb-0.5">رقم الهاتف</label>
                        <Input type="tel" value={addCustomerPhone} onChange={(e) => setAddCustomerPhone(e.target.value)} placeholder="07xxxxxxxxx" dir="ltr" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Amount + Due Date (side by side) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">المبلغ <span className="text-red-500">*</span></label>
                <Input type="number" value={addAmount} onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="0.00" dir="ltr" className="text-lg font-bold text-center" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">تاريخ الاستحقاق</label>
                <Input type="date" value={addDueDate} onChange={(e) => setAddDueDate(e.target.value)} />
              </div>
            </div>

            {/* 3. Notes */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">ملاحظات</label>
              <Input value={addNote} onChange={(e) => setAddNote(e.target.value)} placeholder="سبب الدين، وصف البضاعة..." />
            </div>

            {/* 4. Initial Payment */}
            <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-800">دفعة أولية (اختياري)</span>
              </div>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground block mb-1">المبلغ المدفوع</label>
                  <Input type="number" value={addInitPayment} onChange={(e) => setAddInitPayment(e.target.value)}
                    placeholder="0.00" dir="ltr" max={addAmount || undefined} />
                </div>
                <div className="flex gap-1">
                  {(["cash", "card", "transfer"] as const).map((m) => {
                    const Icon = PAYMENT_ICONS[m];
                    return (
                      <Button key={m} variant={addPaymentMethod === m ? "default" : "outline"} size="sm"
                        className={`h-9 px-2.5 text-xs gap-1 ${addPaymentMethod === m ? "bg-amber-600 hover:bg-amber-700" : ""}`}
                        onClick={() => setAddPaymentMethod(m)}>
                        <Icon className="w-3 h-3" />{PAYMENT_LABELS[m]}
                      </Button>
                    );
                  })}
                </div>
              </div>
              {addInitPayment && parseFloat(addInitPayment) > 0 && addAmount && (
                <div className="text-center text-sm">
                  <span className="text-muted-foreground">المبلغ المتبقي: </span>
                  <span className="font-bold text-red-600">{formatCurrency(Math.max(0, (parseFloat(addAmount) || 0) - (parseFloat(addInitPayment) || 0)), 2)}</span>
                </div>
              )}
            </div>

            {/* 5. Advanced Options Toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  خيارات متقدمة
                </span>
                <span className="text-xs text-muted-foreground/60 font-normal">كفيل، بضاعة، هاتف المديون</span>
              </button>

              {showAdvanced && (
                <div className="mt-3 space-y-3">
                  {/* Guarantor */}
                  <div className="bg-muted/50 border rounded-lg p-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <User2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-semibold text-foreground/80">بيانات الكفيل</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">اسم الكفيل</label>
                        <Input value={addGuarantorName} onChange={(e) => setAddGuarantorName(e.target.value)} placeholder="اسم الكفيل الكامل" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">رقم هاتف الكفيل</label>
                        <Input type="tel" value={addGuarantorPhone} onChange={(e) => setAddGuarantorPhone(e.target.value)} placeholder="07xxxxxxxxx" dir="ltr" />
                      </div>
                    </div>
                  </div>

                  {/* Debtor Phone (different from customer) */}
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">رقم هاتف المديون (إذا كان مختلفاً عن الزبون)</label>
                    <Input type="tel" value={addDebtorPhone} onChange={(e) => setAddDebtorPhone(e.target.value)}
                      placeholder={addSelectedCustomer?.phone || addCustomerPhone || "رقم الهاتف"} dir="ltr" />
                  </div>

                  {/* Debt Items */}
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1 flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3" />المنتجات / البضاعة المعطاة
                    </label>
                    <textarea value={addItems} onChange={(e) => setAddItems(e.target.value)}
                      placeholder={"أدخل منتجاً في كل سطر...\nمثال:\nرز بسمتي x5\nزيت نباتي x3\nسكر x10"}
                      rows={3} dir="rtl"
                      className="w-full rounded-md border border-gray-200 p-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    <p className="text-xs text-muted-foreground/60 mt-1">لكل سطر: اسم المنتج ثم x ثم الكمية</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowAddDebtDialog(false)}>إلغاء</Button>
            <Button onClick={() => addDebtMutation.mutate()} disabled={!canAddDebt || addDebtMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
              {addDebtMutation.isPending ? "جاري الإضافة..." : "إضافة الدين"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditDebtDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        selectedDebt={selectedDebt}
        editAmount={editAmount}
        setEditAmount={setEditAmount}
        editDueDate={editDueDate}
        setEditDueDate={setEditDueDate}
        editStatus={editStatus}
        setEditStatus={setEditStatus}
        editDebtorPhone={editDebtorPhone}
        setEditDebtorPhone={setEditDebtorPhone}
        editGuarantorName={editGuarantorName}
        setEditGuarantorName={setEditGuarantorName}
        editGuarantorPhone={editGuarantorPhone}
        setEditGuarantorPhone={setEditGuarantorPhone}
        editNote={editNote}
        setEditNote={setEditNote}
        editMutation={editMutation}
      />

      <DeleteDebtConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        customerName={deleteTargetName}
        onSubmit={() => cancelMutation.mutate()}
        isPending={cancelMutation.isPending}
      />

      {/* ==================== Debtor Detail ==================== */}
      <DebtorDetail
        open={showDebtorDetail}
        onOpenChange={setShowDebtorDetail}
        customerId={debtorDetailId}
        customerName={debtorDetailName}
        customerPhone={debtorDetailPhone}
        totalDebt={debtorDetailTotal}
        debtCount={debtorDetailCount}
      />

    </div>
  );
}