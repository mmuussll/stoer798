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
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import {
  Landmark, Search, Plus, DollarSign, Wallet, Calendar, Clock, AlertTriangle,
  User2, Phone, FileText, TrendingUp, TrendingDown, Banknote, CreditCard,
  ArrowRightLeft, CheckCircle2, Clock4, Ban, Eye, History, Receipt, Filter,
  ShoppingBag,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import * as debtsApi from "@/api/debts";
import * as customersApi from "@/api/customers";
import { CURRENCY } from "@/constants";
import type { Debt, DebtPayment, DebtSummary } from "@/types";

const ITEMS_PER_PAGE = 15;

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: "نشط", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Clock4 },
  partially_paid: { label: "مدفوع جزئياً", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Wallet },
  paid: { label: "مدفوع", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  overdue: { label: "متأخر", color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle },
};

const PAYMENT_ICONS: Record<string, any> = {
  cash: DollarSign,
  card: CreditCard,
  transfer: ArrowRightLeft,
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: "نقداً",
  card: "بطاقة",
  transfer: "تحويل",
};

function getDaysDiff(dateStr?: string): number {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getDueStatus(dateStr?: string): { label: string; color: string } {
  if (!dateStr) return { label: "غير محدد", color: "text-gray-400" };
  const days = getDaysDiff(dateStr);
  if (days < 0) return { label: `متأخر ${Math.abs(days)} يوم`, color: "text-red-600" };
  if (days === 0) return { label: "اليوم", color: "text-amber-600" };
  if (days <= 3) return { label: `متبقي ${days} أيام`, color: "text-blue-600" };
  return { label: `متبقي ${days} يوم`, color: "text-emerald-600" };
}

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
  const [addDebtCustomerSearch, setAddDebtCustomerSearch] = useState("");
  const [addDebtSelectedCustomer, setAddDebtSelectedCustomer] = useState<any>(null);
  const [addDebtAmount, setAddDebtAmount] = useState("");
  const [addDebtDueDate, setAddDebtDueDate] = useState("");
  const [addDebtDebtorPhone, setAddDebtDebtorPhone] = useState("");
  const [addDebtGuarantorName, setAddDebtGuarantorName] = useState("");
  const [addDebtGuarantorPhone, setAddDebtGuarantorPhone] = useState("");
  const [addDebtNote, setAddDebtNote] = useState("");
  const [addDebtItems, setAddDebtItems] = useState("");
  const [addDebtInitialPayment, setAddDebtInitialPayment] = useState("");
  const [addDebtPaymentMethod, setAddDebtPaymentMethod] = useState<"cash" | "card" | "transfer">("cash");

  // Search customers for add-debt dialog
  const { data: searchedCustomers = [], isLoading: customerSearchLoading } = useQuery({
    queryKey: ["add-debt-customer-search", addDebtCustomerSearch],
    queryFn: () => customersApi.searchCustomers(addDebtCustomerSearch),
    enabled: addDebtCustomerSearch.length >= 2,
  });

  // Summary
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["debt-summary"],
    queryFn: debtsApi.getDebtSummary,
    refetchInterval: 30000,
  });

  // All debts
  const { data: debts = [], isLoading: debtsLoading } = useQuery({
    queryKey: ["debts"],
    queryFn: debtsApi.fetchDebts,
    refetchInterval: 30000,
  });

  const filteredDebts = useMemo(() => {
    let result = debts;
    if (statusFilter !== "all") {
      result = result.filter((d) => d.status === statusFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (d) =>
          (d.customer?.name && d.customer.name.toLowerCase().includes(term)) ||
          (d.customer?.phone && d.customer.phone.includes(term)) ||
          (d.invoice?.invoice_number && d.invoice.invoice_number.toLowerCase().includes(term))
      );
    }
    return result;
  }, [debts, statusFilter, searchTerm]);

  const totalPages = Math.ceil(filteredDebts.length / ITEMS_PER_PAGE);
  const paginatedDebts = filteredDebts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const activeStats = useMemo(() => {
    const active = debts.filter((d) => d.status !== "paid");
    const totalRemaining = active.reduce((s, d) => s + d.remaining_amount, 0);
    const overdue = active.filter(
      (d) => d.due_date && d.due_date < new Date().toISOString().slice(0, 10)
    );
    return {
      totalActive: active.length,
      totalRemaining,
      totalOverdue: overdue.length,
      totalOverdueAmount: overdue.reduce((s, d) => s + d.remaining_amount, 0),
    };
  }, [debts]);

  const openPaymentDialog = (debt: Debt) => {
    setSelectedDebt(debt);
    setPaymentAmount(debt.remaining_amount.toString());
    setPaymentMethod("cash");
    setPaymentNote("");
    setShowPaymentDialog(true);
  };

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

  const paymentMutation = useMutation({
    mutationFn: () =>
      debtsApi.createDebtPayment({
        debt_id: selectedDebt!.id,
        customer_id: selectedDebt!.customer_id,
        invoice_id: selectedDebt?.invoice_id || undefined,
        amount: parseFloat(paymentAmount) || 0,
        payment_method: paymentMethod,
        payment_date: new Date().toISOString().slice(0, 10),
        payment_time: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
        notes: paymentNote || undefined,
        cashier: user?.email || "البائع",
        user_id: user?.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["debt-summary"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "تم تسجيل الدفعة بنجاح" });
      setShowPaymentDialog(false);
      setSelectedDebt(null);
    },
    onError: (err: Error) =>
      toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const openAddDebtDialog = () => {
    setAddDebtCustomerSearch("");
    setAddDebtSelectedCustomer(null);
    setAddDebtAmount("");
    setAddDebtDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setAddDebtDebtorPhone("");
    setAddDebtGuarantorName("");
    setAddDebtGuarantorPhone("");
    setAddDebtNote("");
    setAddDebtItems("");
    setAddDebtInitialPayment("");
    setAddDebtPaymentMethod("cash");
    setShowAddDebtDialog(true);
  };

  const addDebtMutation = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(addDebtAmount) || 0;
      const initPayment = parseFloat(addDebtInitialPayment) || 0;
      const remaining = Math.max(0, amount - initPayment);

      // Parse debt items from textarea (one per line: productName xQty)
      let parsedItems: any[] = [];
      if (addDebtItems.trim()) {
        parsedItems = addDebtItems
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .map((line) => {
            const match = line.match(/^(.+?)\s*x\s*(\d+)$/i);
            if (match) {
              return { name: match[1].trim(), price: 0, quantity: parseInt(match[2]) || 1 };
            }
            return { name: line, price: 0, quantity: 1 };
          });
      }

      const debt = await debtsApi.createDebt({
        customer_id: addDebtSelectedCustomer.id,
        invoice_id: undefined,
        total_amount: amount,
        remaining_amount: remaining,
        status: remaining <= 0 ? "paid" : "active",
        due_date: addDebtDueDate || undefined,
        guarantor_name: addDebtGuarantorName || undefined,
        guarantor_phone: addDebtGuarantorPhone || undefined,
        debtor_phone: addDebtDebtorPhone || addDebtSelectedCustomer.phone || undefined,
        debt_items: parsedItems,
        notes: addDebtNote || `دين مضاف يدوياً`,
      });

      if (initPayment > 0 && remaining > 0) {
        try {
          await debtsApi.createDebtPayment({
            debt_id: debt.id,
            customer_id: debt.customer_id,
            invoice_id: undefined,
            amount: initPayment,
            payment_method: addDebtPaymentMethod,
            payment_date: new Date().toISOString().slice(0, 10),
            payment_time: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
            notes: "دفعة أولية عند إنشاء الدين",
            cashier: user?.email || "البائع",
            user_id: user?.id,
          });
        } catch {}
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
    onError: (err: Error) =>
      toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const StatCard = ({ title, value, icon: Icon, color, bg, sub }: any) => (
    <Card className={bg}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
          </div>
          <Icon className={`w-9 h-9 opacity-40 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );

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

  return (
    <div className="space-y-6 p-4" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة الديون</h1>
          <p className="text-sm text-gray-500 mt-1">متابعة وإدارة ديون الزبائن والمدفوعات</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openAddDebtDialog} className="bg-red-600 hover:bg-red-700 gap-2">
            <Plus className="w-4 h-4" />
            إضافة دين جديد
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard
          title="إجمالي الديون المستحقة"
          value={`${summary?.total_outstanding.toFixed(2) || "0.00"} ${CURRENCY}`}
          icon={Landmark}
          color="text-blue-600"
          bg="bg-blue-50 border border-blue-200"
          sub={`${activeStats.totalActive} دين نشط`}
        />
        <StatCard
          title="الديون المتأخرة"
          value={`${activeStats.totalOverdueAmount.toFixed(2)} ${CURRENCY}`}
          icon={AlertTriangle}
          color={activeStats.totalOverdue > 0 ? "text-red-600" : "text-gray-600"}
          bg={activeStats.totalOverdue > 0 ? "bg-red-50 border border-red-200" : "bg-gray-50"}
          sub={`${activeStats.totalOverdue} دين متأخر`}
        />
        <StatCard
          title="الديون النشطة"
          value={`${(summary?.total_active || 0).toFixed(2)} ${CURRENCY}`}
          icon={Clock4}
          color="text-amber-600"
          bg="bg-amber-50 border border-amber-200"
          sub={`غير متأخرة`}
        />
        <StatCard
          title="زبائن مدينون"
          value={String(summary?.total_customers_with_debt || 0)}
          icon={User2}
          color="text-violet-600"
          bg="bg-violet-50 border border-violet-200"
          sub="لديهم ديون نشطة"
        />
        <StatCard
          title="إجمالي الديون المسددة"
          value={`${debts.filter((d) => d.status === "paid").reduce((s, d) => s + d.total_amount, 0).toFixed(2)} ${CURRENCY}`}
          icon={CheckCircle2}
          color="text-emerald-600"
          bg="bg-emerald-50 border border-emerald-200"
          sub="تم تسديدها بالكامل"
        />
      </div>

      {/* Top Customers with Debt */}
      {summary && summary.customers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {summary.customers.slice(0, 8).map((c) => (
            <Card key={c.id} className="border-l-4 border-l-red-400 hover:shadow-md transition-shadow">
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
              <Input
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="ابحث باسم الزبون أو رقم الفاتورة..."
                className="pr-10"
              />
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
                        ? ((debt.total_amount - debt.remaining_amount) / debt.total_amount) * 100
                        : 0;

                      return (
                        <TableRow key={debt.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                                <User2 className="w-3.5 h-3.5 text-gray-600" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{debt.customer?.name || "غير معروف"}</p>
                                {debt.customer?.phone && (
                                  <p className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{debt.customer.phone}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {debt.invoice ? (
                              <Badge variant="outline" className="text-xs font-mono text-blue-600">
                                {debt.invoice.invoice_number}
                              </Badge>
                            ) : (
                              <span className="text-gray-300 text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {debt.total_amount.toFixed(2)} {CURRENCY}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-bold text-red-600">
                                {debt.remaining_amount.toFixed(2)} {CURRENCY}
                              </p>
                              {paidPercent > 0 && (
                                <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1 max-w-[100px]">
                                  <div
                                    className="h-1.5 bg-emerald-500 rounded-full"
                                    style={{ width: `${paidPercent}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={`text-xs flex items-center gap-1 w-fit mx-auto ${status.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {status.label}
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
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-blue-600 hover:bg-blue-50"
                                onClick={() => openDetailDialog(debt)}
                                title="التفاصيل والمدفوعات"
                              >
                                <History className="w-3.5 h-3.5" />
                              </Button>
                              {debt.status !== "paid" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-emerald-600 hover:bg-emerald-50"
                                  onClick={() => openPaymentDialog(debt)}
                                  title="تسجيل دفعة"
                                >
                                  <Banknote className="w-3.5 h-3.5" />
                                </Button>
                              )}
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
                        <PaginationPrevious
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page} className="cursor-pointer">
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-600" />
              تسجيل دفعة دين
            </DialogTitle>
            <DialogDescription>
              {selectedDebt?.customer?.name && (
                <span>تسجيل دفعة من الزبون: <strong>{selectedDebt.customer.name}</strong></span>
              )}
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
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  dir="ltr"
                  min={0}
                  max={selectedDebt.remaining_amount}
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">طريقة الدفع</label>
                <div className="flex gap-2">
                  {(["cash", "card", "transfer"] as const).map((m) => {
                    const Icon = PAYMENT_ICONS[m];
                    return (
                      <Button
                        key={m}
                        variant={paymentMethod === m ? "default" : "outline"}
                        size="sm"
                        className="flex-1 gap-1"
                        onClick={() => setPaymentMethod(m)}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {PAYMENT_LABELS[m]}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">ملاحظات</label>
                <Input
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="ملاحظات إضافية..."
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>إلغاء</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => paymentMutation.mutate()}
              disabled={
                !paymentAmount ||
                parseFloat(paymentAmount) <= 0 ||
                parseFloat(paymentAmount) > (selectedDebt?.remaining_amount || 0) ||
                paymentMutation.isPending
              }
            >
              {paymentMutation.isPending ? "جاري التسجيل..." : "تسجيل الدفعة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Debt Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent dir="rtl" className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              تفاصيل الدين والمدفوعات
            </DialogTitle>
          </DialogHeader>
          {selectedDebt && (
            <div className="space-y-4">
              {/* Debt Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">الزبون</p>
                  <p className="font-semibold text-sm">{selectedDebt.customer?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">الفاتورة</p>
                  <p className="font-semibold text-sm font-mono">{selectedDebt.invoice?.invoice_number || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">المبلغ الكلي</p>
                  <p className="font-bold text-blue-600">{selectedDebt.total_amount.toFixed(2)} {CURRENCY}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">المتبقي</p>
                  <p className="font-bold text-red-600">{selectedDebt.remaining_amount.toFixed(2)} {CURRENCY}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">الحالة: </span>
                  <Badge variant="outline" className={STATUS_MAP[selectedDebt.status]?.color}>
                    {STATUS_MAP[selectedDebt.status]?.label}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-500">تاريخ الاستحقاق: </span>
                  <span className={getDueStatus(selectedDebt.due_date).color}>
                    {selectedDebt.due_date || "غير محدد"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">المدفوع: </span>
                  <span className="text-emerald-600 font-semibold">
                    {(selectedDebt.total_amount - selectedDebt.remaining_amount).toFixed(2)} {CURRENCY}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">نسبة السداد: </span>
                  <span className="text-emerald-600 font-semibold">
                    {selectedDebt.total_amount > 0
                      ? ((1 - selectedDebt.remaining_amount / selectedDebt.total_amount) * 100).toFixed(1)
                      : "0"}%
                  </span>
                </div>
              </div>

              {selectedDebt.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-700 font-medium mb-1">ملاحظات:</p>
                  <p className="text-sm text-amber-800">{selectedDebt.notes}</p>
                </div>
              )}

              {/* Guarantor Info */}
              {(selectedDebt.guarantor_name || selectedDebt.guarantor_phone) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700 font-medium mb-2">بيانات الكفيل:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {selectedDebt.guarantor_name && (
                      <div>
                        <span className="text-gray-500">اسم الكفيل: </span>
                        <span className="font-semibold">{selectedDebt.guarantor_name}</span>
                      </div>
                    )}
                    {selectedDebt.guarantor_phone && (
                      <div>
                        <span className="text-gray-500">رقم الكفيل: </span>
                        <span className="font-semibold" dir="ltr">{selectedDebt.guarantor_phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Debtor Phone */}
              {selectedDebt.debtor_phone && selectedDebt.debtor_phone !== selectedDebt.customer?.phone && (
                <div className="text-sm">
                  <span className="text-gray-500">رقم هاتف المديون: </span>
                  <span className="font-semibold" dir="ltr">{selectedDebt.debtor_phone}</span>
                </div>
              )}

              {/* Debt Items (products given) */}
              {selectedDebt.debt_items && selectedDebt.debt_items.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-orange-500" />
                    المنتجات المعطاة للمديون
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
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">{item.quantity}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <Separator />

              {/* Payments List */}
              <div>
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-gray-500" />
                  سجل المدفوعات ({detailPayments.length})
                </h3>
                {detailPayments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <Wallet className="w-8 h-8 mb-2" />
                    <p className="text-sm">لا توجد مدفوعات حتى الآن</p>
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
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailPayments.map((p) => {
                          const PIcon = PAYMENT_ICONS[p.payment_method] || DollarSign;
                          return (
                            <TableRow key={p.id}>
                              <TableCell>
                                <div className="flex items-center gap-1 text-sm">
                                  <Calendar className="w-3 h-3 text-gray-400" />
                                  {p.payment_date}
                                  {p.payment_time && <span className="text-gray-400 text-xs">{p.payment_time}</span>}
                                </div>
                              </TableCell>
                              <TableCell className="font-bold text-emerald-600">
                                +{p.amount.toFixed(2)} {CURRENCY}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs flex items-center gap-1 w-fit">
                                  <PIcon className="w-3 h-3" />
                                  {PAYMENT_LABELS[p.payment_method]}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">{p.cashier || "-"}</TableCell>
                              <TableCell className="text-sm text-gray-500">{p.notes || "-"}</TableCell>
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

      {/* Add Debt Dialog */}
      <Dialog open={showAddDebtDialog} onOpenChange={setShowAddDebtDialog}>
        <DialogContent dir="rtl" className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-red-600" />
              إضافة دين جديد
            </DialogTitle>
            <DialogDescription>
              أضف ديناً جديداً على الزبون مع إمكانية تسجيل دفعة أولية
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Customer Search */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                الزبون <span className="text-red-500">*</span>
              </label>
              {addDebtSelectedCustomer ? (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                      <User2 className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{addDebtSelectedCustomer.name}</p>
                      {addDebtSelectedCustomer.phone && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5" />{addDebtSelectedCustomer.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {addDebtSelectedCustomer.total_debt > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        عليه {addDebtSelectedCustomer.total_debt.toFixed(2)} {CURRENCY}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-gray-400 hover:text-red-500"
                      onClick={() => {
                        setAddDebtSelectedCustomer(null);
                        setAddDebtCustomerSearch("");
                      }}
                    >
                      تغيير
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={addDebtCustomerSearch}
                      onChange={(e) => setAddDebtCustomerSearch(e.target.value)}
                      placeholder="ابحث باسم الزبون أو رقم الهاتف..."
                      className="pr-10"
                      autoFocus
                    />
                  </div>
                  {addDebtCustomerSearch.length >= 2 && (
                    <div className="border rounded-lg max-h-40 overflow-y-auto divide-y">
                      {customerSearchLoading ? (
                        <div className="p-4 text-center text-sm text-gray-400">جاري البحث...</div>
                      ) : searchedCustomers.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-400">لا توجد نتائج</div>
                      ) : (
                        searchedCustomers.map((c: any) => (
                          <div
                            key={c.id}
                            className="flex items-center justify-between p-2.5 hover:bg-blue-50 cursor-pointer transition-colors"
                            onClick={() => {
                              setAddDebtSelectedCustomer(c);
                              setAddDebtCustomerSearch("");
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <User2 className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="font-medium text-sm">{c.name}</p>
                                {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                              </div>
                            </div>
                            {c.total_debt > 0 && (
                              <Badge variant="outline" className="text-xs text-red-500 border-red-200">
                                عليه {c.total_debt.toFixed(0)} {CURRENCY}
                              </Badge>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                المبلغ <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={addDebtAmount}
                onChange={(e) => setAddDebtAmount(e.target.value)}
                placeholder="0.00"
                dir="ltr"
                className="text-lg font-bold text-center"
              />
              {addDebtSelectedCustomer?.debt_limit > 0 && parseFloat(addDebtAmount) > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  الحد الائتماني المسموح: {addDebtSelectedCustomer.debt_limit.toFixed(2)} {CURRENCY}
                  {parseFloat(addDebtAmount) + (addDebtSelectedCustomer.total_debt || 0) > addDebtSelectedCustomer.debt_limit && (
                    <span className="text-red-500"> - تجاوز الحد!</span>
                  )}
                </p>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label className="text-sm font-medium mb-1 block">تاريخ الاستحقاق</label>
              <Input
                type="date"
                value={addDebtDueDate}
                onChange={(e) => setAddDebtDueDate(e.target.value)}
              />
            </div>

            {/* Debtor Phone */}
            <div>
              <label className="text-sm font-medium mb-1 block">رقم هاتف المديون</label>
              <Input
                type="tel"
                value={addDebtDebtorPhone}
                onChange={(e) => setAddDebtDebtorPhone(e.target.value)}
                placeholder={addDebtSelectedCustomer?.phone || "رقم الهاتف"}
                dir="ltr"
              />
            </div>

            {/* Guarantor */}
            <div className="bg-gray-50 border rounded-lg p-3 space-y-3">
              <div className="flex items-center gap-2">
                <User2 className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-semibold text-gray-700">بيانات الكفيل</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">اسم الكفيل</label>
                  <Input
                    value={addDebtGuarantorName}
                    onChange={(e) => setAddDebtGuarantorName(e.target.value)}
                    placeholder="اسم الكفيل الكامل"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">رقم هاتف الكفيل</label>
                  <Input
                    type="tel"
                    value={addDebtGuarantorPhone}
                    onChange={(e) => setAddDebtGuarantorPhone(e.target.value)}
                    placeholder="07xxxxxxxxx"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {/* Debt Items */}
            <div>
              <label className="text-sm font-medium mb-1 block">المنتجات / البضاعة المعطاة</label>
              <textarea
                value={addDebtItems}
                onChange={(e) => setAddDebtItems(e.target.value)}
                placeholder={`أدخل منتجاً في كل سطر...
مثال:
رز بسمتي x5
زيت نباتي x3
سكر x10`}
                rows={4}
                dir="rtl"
                className="w-full rounded-md border border-gray-200 p-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">لكل سطر: اسم المنتج ثم x ثم الكمية</p>
            </div>

            {/* Note */}
            <div>
              <label className="text-sm font-medium mb-1 block">ملاحظات</label>
              <Input
                value={addDebtNote}
                onChange={(e) => setAddDebtNote(e.target.value)}
                placeholder="سبب الدين، تفاصيل إضافية..."
              />
            </div>

            {/* Initial Payment */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-800">دفعة أولية (اختياري)</span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">المبلغ المدفوع</label>
                  <Input
                    type="number"
                    value={addDebtInitialPayment}
                    onChange={(e) => setAddDebtInitialPayment(e.target.value)}
                    placeholder="0.00"
                    dir="ltr"
                    max={addDebtAmount || undefined}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">طريقة الدفع</label>
                  <div className="flex gap-1">
                    {(["cash", "card", "transfer"] as const).map((m) => {
                      const Icons: Record<string, any> = { cash: DollarSign, card: CreditCard, transfer: ArrowRightLeft };
                      const Icon = Icons[m];
                      return (
                        <Button
                          key={m}
                          variant={addDebtPaymentMethod === m ? "default" : "outline"}
                          size="sm"
                          className={`flex-1 h-8 px-2 text-xs gap-0.5 ${addDebtPaymentMethod === m ? "bg-amber-600 hover:bg-amber-700" : ""}`}
                          onClick={() => setAddDebtPaymentMethod(m)}
                        >
                          <Icon className="w-3 h-3" />
                          {m === "cash" ? "نقد" : m === "card" ? "بطاقة" : "تحويل"}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
              {addDebtInitialPayment && parseFloat(addDebtInitialPayment) > 0 && addDebtAmount && (
                <div className="text-center text-sm">
                  <span className="text-gray-500">المبلغ المتبقي: </span>
                  <span className="font-bold text-red-600">
                    {Math.max(0, (parseFloat(addDebtAmount) || 0) - (parseFloat(addDebtInitialPayment) || 0)).toFixed(2)} {CURRENCY}
                  </span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowAddDebtDialog(false)}>إلغاء</Button>
            <Button
              onClick={() => addDebtMutation.mutate()}
              disabled={
                !addDebtSelectedCustomer ||
                !addDebtAmount ||
                parseFloat(addDebtAmount) <= 0 ||
                (addDebtInitialPayment && parseFloat(addDebtInitialPayment) > parseFloat(addDebtAmount)) ||
                addDebtMutation.isPending
              }
              className="bg-red-600 hover:bg-red-700"
            >
              {addDebtMutation.isPending ? "جاري الإضافة..." : "إضافة الدين"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
