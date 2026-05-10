import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Landmark, Search, Plus, Wallet, Calendar, AlertTriangle,
  User2, Phone, FileText, Banknote, CheckCircle2,
  Clock4, History, Filter, ShoppingBag,
  Pencil, Trash2, X, ChevronDown, ChevronUp, DollarSign,
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { DebtorDetail } from "@/components/DebtorDetail";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import * as debtsApi from "@/api/debts";
import * as customersApi from "@/api/customers";
import { CURRENCY } from "@/constants";
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
      console.error("فشل تسجيل الدفعة:", err);
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
        } catch (payErr) {
          console.error("فشل تسجيل الدفعة الأولية:", payErr);
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
      console.error("فشل إضافة الدين:", err);
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
          <h1 className="text-2xl font-bold text-gray-900">إدارة الديون</h1>
          <p className="text-sm text-gray-500 mt-1">متابعة وإدارة ديون الزبائن والمدفوعات</p>
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
          value={`${(summary?.total_outstanding || 0).toFixed(2)} ${CURRENCY}`}
          icon={Landmark} color="text-blue-600" bg="bg-blue-50 border border-blue-200"
          sub={`${activeStats.totalActive} دين نشط`} />
        <StatCard title="الديون المتأخرة"
          value={`${activeStats.totalOverdueAmount.toFixed(2)} ${CURRENCY}`}
          icon={AlertTriangle}
          color={activeStats.totalOverdue > 0 ? "text-red-600" : "text-gray-600"}
          bg={activeStats.totalOverdue > 0 ? "bg-red-50 border border-red-200" : "bg-gray-50"}
          sub={`${activeStats.totalOverdue} دين متأخر`} />
        <StatCard title="الديون النشطة"
          value={`${(summary?.total_active || 0).toFixed(2)} ${CURRENCY}`}
          icon={Clock4} color="text-amber-600" bg="bg-amber-50 border border-amber-200"
          sub="غير متأخرة" />
        <StatCard title="زبائن مدينون"
          value={String(summary?.total_customers_with_debt || 0)}
          icon={User2} color="text-violet-600" bg="bg-violet-50 border border-violet-200"
          sub="لديهم ديون نشطة" />
        <StatCard title="إجمالي الديون المسددة"
          value={`${debts.filter((d) => d.status === "paid").reduce((s, d) => s + d.total_amount, 0).toFixed(2)} ${CURRENCY}`}
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
                      {c.phone && <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{c.phone}</p>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-red-600">{c.total_debt.toFixed(2)} {CURRENCY}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
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
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-5 h-5 text-blue-600" />
            قائمة الديون ({filteredDebts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paginatedDebts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Landmark className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">لا توجد ديون</p>
              <p className="text-sm mt-1">{searchTerm || statusFilter !== "all" ? "جرب تغيير معايير البحث" : "ستظهر الديون هنا عند البيع بالآجل"}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الزبون</TableHead>
                      <TableHead className="text-right">الفاتورة</TableHead>
                      <TableHead className="text-right">المبلغ الكلي</TableHead>
                      <TableHead className="text-right">المتبقي</TableHead>
                      <TableHead className="text-center">الحالة</TableHead>
                      <TableHead className="text-right">تاريخ الاستحقاق</TableHead>
                      <TableHead className="text-center">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDebts.map((debt) => {
                      const status = STATUS_MAP[debt.status] || STATUS_MAP.active;
                      const StatusIcon = status.icon;
                      const dueStatus = getDueStatus(debt.due_date);
                      const paidPercent = debt.total_amount > 0
                        ? ((debt.total_amount - debt.remaining_amount) / debt.total_amount) * 100 : 0;

                      return (
                        <TableRow key={debt.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => {
                                setDebtorDetailId(debt.customer_id);
                                setDebtorDetailName(debt.customer_name);
                                setDebtorDetailPhone(debt.customer_phone);
                                setDebtorDetailTotal(debts.filter((d) => d.customer_id === debt.customer_id && d.status !== "paid").reduce((s, d) => s + d.remaining_amount, 0));
                                setDebtorDetailCount(debts.filter((d) => d.customer_id === debt.customer_id && d.status !== "paid").length);
                                setShowDebtorDetail(true);
                              }}>
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                                <User2 className="w-3.5 h-3.5 text-gray-600" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{debt.customer_name || "غير معروف"}</p>
                                {debt.customer_phone && (
                                  <p className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{debt.customer_phone}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {debt.invoice_number ? (
                              <Badge variant="outline" className="text-xs font-mono text-blue-600">{debt.invoice_number}</Badge>
                            ) : (
                              <span className="text-gray-300 text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell className="font-semibold">{debt.total_amount.toFixed(2)} {CURRENCY}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-bold text-red-600">{debt.remaining_amount.toFixed(2)} {CURRENCY}</p>
                              {paidPercent > 0 && (
                                <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1 max-w-[100px]">
                                  <div className="h-1.5 bg-emerald-500 rounded-full" style={{ width: `${paidPercent}%` }} />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={`text-xs flex items-center gap-1 w-fit mx-auto ${status.color}`}>
                              <StatusIcon className="w-3 h-3" />{status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span className={`text-sm ${dueStatus.color}`}>
                                {debt.due_date || <span className="text-gray-300">-</span>}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="sm" className="h-8 text-blue-600 hover:bg-blue-50"
                                onClick={() => openDetailDialog(debt)} title="التفاصيل والمدفوعات">
                                <History className="w-3.5 h-3.5" />
                              </Button>
                              {debt.status !== "paid" && (
                                <Button variant="ghost" size="sm" className="h-8 text-emerald-600 hover:bg-emerald-50"
                                  onClick={() => openPaymentDialog(debt)} title="تسجيل دفعة">
                                  <Banknote className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" className="h-8 text-amber-600 hover:bg-amber-50"
                                onClick={() => openEditDialog(debt)} title="تعديل الدين">
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 text-red-500 hover:bg-red-50"
                                onClick={() => { setDeleteTargetId(debt.id); setDeleteTargetName(debt.customer_name); setShowDeleteConfirm(true); }}
                                title="إلغاء الدين">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page} className="cursor-pointer">
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ==================== Payment Dialog ==================== */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-600" />تسجيل دفعة دين
            </DialogTitle>
            <DialogDescription>
              {selectedDebt && <span>تسجيل دفعة من الزبون: <strong>{selectedDebt.customer_name}</strong></span>}
            </DialogDescription>
          </DialogHeader>
          {selectedDebt && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-3">
                <div>
                  <p className="text-xs text-gray-500">المبلغ الكلي للدين</p>
                  <p className="font-bold text-lg">{selectedDebt.total_amount.toFixed(2)} {CURRENCY}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">المبلغ المتبقي</p>
                  <p className="font-bold text-lg text-red-600">{selectedDebt.remaining_amount.toFixed(2)} {CURRENCY}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">المبلغ المدفوع <span className="text-red-500">*</span></label>
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
                <Input value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} placeholder="ملاحظات إضافية..." />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>إلغاء</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => paymentMutation.mutate()}
              disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || parseFloat(paymentAmount) > (selectedDebt?.remaining_amount || 0) || paymentMutation.isPending}>
              {paymentMutation.isPending ? "جاري التسجيل..." : "تسجيل الدفعة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== Detail Dialog ==================== */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent dir="rtl" className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />تفاصيل الدين والمدفوعات
            </DialogTitle>
          </DialogHeader>
          {selectedDebt && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
                <div><p className="text-xs text-gray-500">الزبون</p><p className="font-semibold text-sm">{selectedDebt.customer_name || "-"}</p></div>
                <div><p className="text-xs text-gray-500">الفاتورة</p><p className="font-semibold text-sm font-mono">{selectedDebt.invoice_number || "-"}</p></div>
                <div><p className="text-xs text-gray-500">المبلغ الكلي</p><p className="font-bold text-blue-600">{selectedDebt.total_amount.toFixed(2)} {CURRENCY}</p></div>
                <div><p className="text-xs text-gray-500">المتبقي</p><p className="font-bold text-red-600">{selectedDebt.remaining_amount.toFixed(2)} {CURRENCY}</p></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><span className="text-gray-500">الحالة: </span><Badge variant="outline" className={STATUS_MAP[selectedDebt.status]?.color}>{STATUS_MAP[selectedDebt.status]?.label}</Badge></div>
                <div><span className="text-gray-500">تاريخ الاستحقاق: </span><span className={getDueStatus(selectedDebt.due_date).color}>{selectedDebt.due_date || "غير محدد"}</span></div>
                <div><span className="text-gray-500">المدفوع: </span><span className="text-emerald-600 font-semibold">{(selectedDebt.total_amount - selectedDebt.remaining_amount).toFixed(2)} {CURRENCY}</span></div>
                <div><span className="text-gray-500">نسبة السداد: </span><span className="text-emerald-600 font-semibold">{selectedDebt.total_amount > 0 ? ((1 - selectedDebt.remaining_amount / selectedDebt.total_amount) * 100).toFixed(1) : "0"}%</span></div>
              </div>
              {selectedDebt.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-700 font-medium mb-1">ملاحظات:</p>
                  <p className="text-sm text-amber-800">{selectedDebt.notes}</p>
                </div>
              )}
              {(selectedDebt.guarantor_name || selectedDebt.guarantor_phone) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700 font-medium mb-2">بيانات الكفيل:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {selectedDebt.guarantor_name && <div><span className="text-gray-500">اسم الكفيل: </span><span className="font-semibold">{selectedDebt.guarantor_name}</span></div>}
                    {selectedDebt.guarantor_phone && <div><span className="text-gray-500">رقم الكفيل: </span><span className="font-semibold" dir="ltr">{selectedDebt.guarantor_phone}</span></div>}
                  </div>
                </div>
              )}
              {selectedDebt.debtor_phone && selectedDebt.debtor_phone !== selectedDebt.customer_phone && (
                <div className="text-sm"><span className="text-gray-500">رقم هاتف المديون: </span><span className="font-semibold" dir="ltr">{selectedDebt.debtor_phone}</span></div>
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
                            <TableCell className="text-gray-400 text-xs">{idx + 1}</TableCell>
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
                  <Banknote className="w-4 h-4 text-gray-500" />سجل المدفوعات ({detailPayments.length})
                </h3>
                {detailPayments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <Wallet className="w-8 h-8 mb-2" /><p className="text-sm">لا توجد مدفوعات حتى الآن</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
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
                              <TableCell><div className="flex items-center gap-1 text-sm"><Calendar className="w-3 h-3 text-gray-400" />{p.payment_date}{p.payment_time && <span className="text-gray-400 text-xs">{p.payment_time}</span>}</div></TableCell>
                              <TableCell className="font-bold text-emerald-600">+{p.amount.toFixed(2)} {CURRENCY}</TableCell>
                              <TableCell><Badge variant="outline" className="text-xs flex items-center gap-1 w-fit"><PIcon className="w-3 h-3" />{PAYMENT_LABELS[p.payment_method]}</Badge></TableCell>
                              <TableCell className="text-sm">{p.cashier || "-"}</TableCell>
                              <TableCell className="text-sm text-gray-500">{p.notes || "-"}</TableCell>
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
        <DialogContent dir="rtl" className="max-w-lg max-h-[90vh] overflow-y-auto">
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
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                      <User2 className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{addSelectedCustomer.name}</p>
                      {addSelectedCustomer.phone && <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{addSelectedCustomer.phone}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {addSelectedCustomer.total_debt > 0 && (
                      <Badge variant="destructive" className="text-xs">عليه {addSelectedCustomer.total_debt.toFixed(2)} {CURRENCY}</Badge>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 text-gray-400 hover:text-red-500"
                      onClick={() => { setAddSelectedCustomer(null); setAddCustomerSearch(""); }}>
                      تغيير
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input value={addCustomerSearch} onChange={(e) => setAddCustomerSearch(e.target.value)}
                      placeholder="ابحث باسم الزبون أو رقم الهاتف..." className="pr-10" autoFocus />
                  </div>
                  {addCustomerSearch.trim().length >= 2 && (
                    <div className="border rounded-lg max-h-40 overflow-y-auto divide-y">
                      {searchLoading ? (
                        <div className="p-4 text-center text-sm text-gray-400">جاري البحث...</div>
                      ) : searchedCustomers.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-400">لا توجد نتائج - أدخل بيانات الزبون يدوياً أدناه</div>
                      ) : (
                        searchedCustomers.map((c: Customer) => (
                          <div key={c.id} className="flex items-center justify-between p-2.5 hover:bg-blue-50 cursor-pointer transition-colors"
                            onClick={() => { setAddSelectedCustomer(c); setAddCustomerSearch(""); }}>
                            <div className="flex items-center gap-2">
                              <User2 className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="font-medium text-sm">{c.name}</p>
                                {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                              </div>
                            </div>
                            {c.total_debt > 0 && (
                              <Badge variant="outline" className="text-xs text-red-500 border-red-200">عليه {c.total_debt.toFixed(0)} {CURRENCY}</Badge>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-3 space-y-2">
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
                  <label className="text-xs text-gray-500 block mb-1">المبلغ المدفوع</label>
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
                  <span className="text-gray-500">المبلغ المتبقي: </span>
                  <span className="font-bold text-red-600">{Math.max(0, (parseFloat(addAmount) || 0) - (parseFloat(addInitPayment) || 0)).toFixed(2)} {CURRENCY}</span>
                </div>
              )}
            </div>

            {/* 5. Advanced Options Toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  خيارات متقدمة
                </span>
                <span className="text-xs text-gray-400 font-normal">كفيل، بضاعة، هاتف المديون</span>
              </button>

              {showAdvanced && (
                <div className="mt-3 space-y-3">
                  {/* Guarantor */}
                  <div className="bg-gray-50 border rounded-lg p-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <User2 className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-semibold text-gray-700">بيانات الكفيل</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">اسم الكفيل</label>
                        <Input value={addGuarantorName} onChange={(e) => setAddGuarantorName(e.target.value)} placeholder="اسم الكفيل الكامل" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">رقم هاتف الكفيل</label>
                        <Input type="tel" value={addGuarantorPhone} onChange={(e) => setAddGuarantorPhone(e.target.value)} placeholder="07xxxxxxxxx" dir="ltr" />
                      </div>
                    </div>
                  </div>

                  {/* Debtor Phone (different from customer) */}
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">رقم هاتف المديون (إذا كان مختلفاً عن الزبون)</label>
                    <Input type="tel" value={addDebtorPhone} onChange={(e) => setAddDebtorPhone(e.target.value)}
                      placeholder={addSelectedCustomer?.phone || addCustomerPhone || "رقم الهاتف"} dir="ltr" />
                  </div>

                  {/* Debt Items */}
                  <div>
                    <label className="text-xs text-gray-500 block mb-1 flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3" />المنتجات / البضاعة المعطاة
                    </label>
                    <textarea value={addItems} onChange={(e) => setAddItems(e.target.value)}
                      placeholder={"أدخل منتجاً في كل سطر...\nمثال:\nرز بسمتي x5\nزيت نباتي x3\nسكر x10"}
                      rows={3} dir="rtl"
                      className="w-full rounded-md border border-gray-200 p-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    <p className="text-xs text-gray-400 mt-1">لكل سطر: اسم المنتج ثم x ثم الكمية</p>
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

      {/* ==================== Edit Debt Dialog ==================== */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent dir="rtl" className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-amber-600" />تعديل الدين
            </DialogTitle>
            <DialogDescription>
              {selectedDebt && <span>تعديل بيانات الدين للزبون: <strong>{selectedDebt.customer_name}</strong></span>}
            </DialogDescription>
          </DialogHeader>
          {selectedDebt && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">المبلغ الكلي</label>
                <Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)}
                  placeholder="0.00" dir="ltr" className="text-lg font-bold text-center" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">تاريخ الاستحقاق</label>
                <Input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">الحالة</label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="partially_paid">مدفوع جزئياً</SelectItem>
                    <SelectItem value="overdue">متأخر</SelectItem>
                    <SelectItem value="paid">مدفوع</SelectItem>
                    <SelectItem value="cancelled">ملغي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">رقم هاتف المديون</label>
                <Input type="tel" value={editDebtorPhone} onChange={(e) => setEditDebtorPhone(e.target.value)}
                  dir="ltr" placeholder="رقم الهاتف" />
              </div>
              <div className="bg-gray-50 border rounded-lg p-3 space-y-3">
                <span className="text-sm font-semibold text-gray-700">بيانات الكفيل</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">اسم الكفيل</label>
                    <Input value={editGuarantorName} onChange={(e) => setEditGuarantorName(e.target.value)} placeholder="اسم الكفيل" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">رقم الكفيل</label>
                    <Input type="tel" value={editGuarantorPhone} onChange={(e) => setEditGuarantorPhone(e.target.value)}
                      dir="ltr" placeholder="07xxxxxxxxx" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">ملاحظات</label>
                <Input value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="ملاحظات..." />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  المدفوع حتى الآن: <strong>{(selectedDebt.total_amount - selectedDebt.remaining_amount).toFixed(2)} {CURRENCY}</strong>
                  {" | "}
                  المتبقي: <strong>{selectedDebt.remaining_amount.toFixed(2)} {CURRENCY}</strong>
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>إلغاء</Button>
            <Button onClick={() => editMutation.mutate()} disabled={editMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700">
              {editMutation.isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== Delete Confirmation Dialog ==================== */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />تأكيد الإلغاء
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من إلغاء دين <strong>{deleteTargetName}</strong>؟
              <br />
              <span className="text-red-500 text-sm">هذا الإجراء لا يمكن التراجع عنه وسيتم إلغاء جميع المدفوعات المرتبطة به.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? "جاري الإلغاء..." : "تأكيد الإلغاء"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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