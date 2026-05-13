import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import {
  Receipt, Search, Calendar, User, Printer, Eye, FileText, X, Package,
  DollarSign, Hash, Users, CreditCard, Percent, Wallet,
  RotateCcw, Minus, Plus, CheckCheck,
} from "lucide-react";
import * as salesApi from "@/api/sales";
import * as returnsApi from "@/api/returns";
import { CURRENCY } from "@/constants";
import { printSaleInvoice } from "@/lib/printInvoice";
import { formatNumber, formatCurrency, formatNumberDisplay, formatCurrencyDisplay } from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { SaleInvoice } from "@/types";

const ITEMS_PER_PAGE = 10;

const RETURN_REASONS = [
  "منتج تالف",
  "منتج غير مطابق للوصف",
  "خطأ في الطلب",
  "منتج منتهي الصلاحية",
  "إرجاع من الزبون",
  "سبب آخر",
];

function getPaymentIcon(method: string) {
  switch (method) {
    case "cash": return <DollarSign className="w-3 h-3" />;
    case "card": return <CreditCard className="w-3 h-3" />;
    case "mixed": return <Wallet className="w-3 h-3" />;
    default: return <DollarSign className="w-3 h-3" />;
  }
}

function getPaymentLabel(method: string) {
  switch (method) {
    case "cash": return "نقداً";
    case "card": return "بطاقة";
    case "mixed": return "مختلط";
    default: return method || "نقداً";
  }
}

export default function SalesInvoices() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [selectedInvoice, setSelectedInvoice] = useState<SaleInvoice | null>(null);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"invoices" | "returns">("invoices");

  // Return dialog state
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnInvoice, setReturnInvoice] = useState<SaleInvoice | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [returnReason, setReturnReason] = useState("");
  const [returnReasonCustom, setReturnReasonCustom] = useState("");

  const { data: salesInvoices = [], isLoading } = useQuery({
    queryKey: ["sales-invoices"],
    queryFn: () => salesApi.fetchSalesInvoices(),
    staleTime: 2 * 60_000,
  });

  const { data: returns = [], isLoading: returnsLoading } = useQuery({
    queryKey: ["sales-returns"],
    queryFn: () => returnsApi.fetchSalesReturns(),
    staleTime: 2 * 60_000,
  });

  const createReturnMutation = useMutation({
    mutationFn: async () => {
      if (!returnInvoice) throw new Error("لم يتم تحديد الفاتورة");

      const items = Object.entries(selectedItems)
        .filter(([, qty]) => qty > 0)
        .map(([productId, qty]) => {
          const invoiceItem = returnInvoice.items.find((i) => i.product_id === productId || i.id === productId);
          return {
            product_id: invoiceItem?.product_id || null,
            name: invoiceItem?.name || "منتج",
            price: invoiceItem?.price || 0,
            quantity: qty,
            barcode: invoiceItem?.barcode || "",
          };
        });

      if (items.length === 0) throw new Error("لم يتم تحديد أي منتجات للإرجاع");

      const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
      const now = new Date();
      const returnNumber = `RET-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const reason = returnReason === "سبب آخر" ? returnReasonCustom : returnReason;

      return returnsApi.createSalesReturn(
        {
          return_number: returnNumber,
          original_invoice_id: returnInvoice.id,
          date: now.toISOString().slice(0, 10),
          time: now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
          total,
          reason,
          cashier: user?.email || "البائع",
        },
        items
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-returns"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "تمت عملية الإرجاع بنجاح", description: "تم إرجاع المنتجات واستعادة المخزون" });
      resetReturnForm();
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const resetReturnForm = () => {
    setReturnInvoice(null);
    setSelectedItems({});
    setReturnReason("");
    setReturnReasonCustom("");
    setShowReturnDialog(false);
  };

  const openReturnDialog = (invoice: SaleInvoice) => {
    setReturnInvoice(invoice);
    setSelectedItems({});
    setReturnReason("");
    setReturnReasonCustom("");
    setShowReturnDialog(true);
  };

  const updateItemQuantity = (itemId: string, delta: number, maxQty: number) => {
    setSelectedItems((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, Math.min(maxQty, current + delta));
      if (next === 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: next };
    });
  };

  const selectAllItems = () => {
    if (!returnInvoice) return;
    const all: Record<string, number> = {};
    for (const item of returnInvoice.items) {
      const id = item.product_id || item.id;
      all[id] = item.quantity;
    }
    setSelectedItems(all);
  };

  const deselectAllItems = () => {
    setSelectedItems({});
  };

  const hasSelectedItems = Object.values(selectedItems).some((q) => q > 0);
  const returnTotal = returnInvoice
    ? returnInvoice.items
        .filter((i) => (selectedItems[i.product_id || i.id] || 0) > 0)
        .reduce((s, i) => s + i.price * (selectedItems[i.product_id || i.id] || 0), 0)
    : 0;

  const filteredInvoices = useMemo(() => {
    if (!searchTerm.trim()) return salesInvoices;
    const term = searchTerm.toLowerCase();
    return salesInvoices.filter((inv) =>
      inv.invoice_number.toLowerCase().includes(term) ||
      inv.cashier.toLowerCase().includes(term) ||
      inv.date.includes(term) ||
      (inv.customer && inv.customer.name.toLowerCase().includes(term))
    );
  }, [salesInvoices, searchTerm]);

  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalItems = filteredInvoices.reduce((sum, inv) => sum + inv.items.reduce((s, item) => s + item.quantity, 0), 0);
  const totalDiscount = filteredInvoices.reduce((sum, inv) => sum + (inv.discount_total || 0), 0);

  const openInvoice = (invoice: SaleInvoice) => {
    setSelectedInvoice(invoice);
    setIsInvoiceDialogOpen(true);
  };

  const handlePrintInvoice = () => {
    if (selectedInvoice) printSaleInvoice(selectedInvoice);
  };

  if (isLoading)
    return (
      <div className="space-y-6" dir="rtl">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );

  return (
    <div className="space-y-6 p-4" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">سجل الفواتير</h1>
        <p className="text-sm text-gray-500 mt-1">فواتير المبيعات والمرتجعات</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "invoices" | "returns")}>
        <TabsList>
          <TabsTrigger value="invoices">الفواتير</TabsTrigger>
          <TabsTrigger value="returns">المرتجعات</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-6 mt-4">

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">إجمالي الفواتير</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{filteredInvoices.length}</p>
              </div>
              <Receipt className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-medium">إجمالي المبيعات</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">{formatNumberDisplay(totalRevenue, 2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-violet-50 border-violet-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-violet-600 font-medium">القطع المباعة</p>
                <p className="text-2xl font-bold text-violet-900 mt-1">{totalItems}</p>
              </div>
              <Package className="w-8 h-8 text-violet-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">الخصومات</p>
                <p className="text-2xl font-bold text-orange-900 mt-1">{formatNumberDisplay(totalDiscount, 2)}</p>
              </div>
              <Percent className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">متوسط الفاتورة</p>
                <p className="text-2xl font-bold text-amber-900 mt-1">
                  {filteredInvoices.length > 0 ? formatNumberDisplay(totalRevenue / filteredInvoices.length, 2) : "0"}
                </p>
              </div>
              <Hash className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="ابحث برقم الفاتورة، البائع، الزبون..."
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-5 h-5 text-blue-600" />قائمة الفواتير
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Receipt className="w-12 h-12 mb-4" />
              <p className="text-lg font-medium">
                {searchTerm ? "لا توجد نتائج للبحث" : "لا توجد فواتير حتى الآن"}
              </p>
              <p className="text-sm mt-1">
                {searchTerm ? "جرب كلمات بحث مختلفة" : "ستظهر الفواتير هنا بعد إتمام عمليات البيع"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم الفاتورة</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">الزبون</TableHead>
                      <TableHead className="text-right">المنتجات</TableHead>
                      <TableHead className="text-right">البائع</TableHead>
                      <TableHead className="text-right">الدفع</TableHead>
                      <TableHead className="text-right">الإجمالي</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedInvoices.map((invoice) => (
                      <TableRow
                        key={invoice.id}
                        className="hover:bg-gray-50"
                      >
                        <TableCell className="font-medium cursor-pointer" onClick={() => openInvoice(invoice)}>
                          <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs font-mono">
                            {invoice.invoice_number}
                          </Badge>
                        </TableCell>
                        <TableCell className="cursor-pointer" onClick={() => openInvoice(invoice)}>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {invoice.date}
                            <span className="text-gray-400 text-xs">{invoice.time}</span>
                          </div>
                        </TableCell>
                        <TableCell className="cursor-pointer" onClick={() => openInvoice(invoice)}>
                          {invoice.customer ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Users className="w-3 h-3 text-blue-500" />
                              <span className="truncate max-w-[100px]">{invoice.customer.name}</span>
                            </div>
                          ) : (
                            <span className="text-gray-300 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="cursor-pointer" onClick={() => openInvoice(invoice)}>
                          <Badge variant="secondary" className="text-xs">
                            {invoice.items.length} صنف
                          </Badge>
                        </TableCell>
                        <TableCell className="cursor-pointer" onClick={() => openInvoice(invoice)}>
                          <div className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-sm truncate max-w-[80px]">{invoice.cashier}</span>
                          </div>
                        </TableCell>
                        <TableCell className="cursor-pointer" onClick={() => openInvoice(invoice)}>
                          <Badge variant="outline" className="text-xs flex items-center gap-1 w-fit">
                            {getPaymentIcon(invoice.payment_method)}
                            {getPaymentLabel(invoice.payment_method)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-blue-600 cursor-pointer" onClick={() => openInvoice(invoice)}>
                          {formatCurrency(invoice.total, 2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openInvoice(invoice);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                openReturnDialog(invoice);
                              }}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
                          className={
                            currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          className={
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
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

      {/* Invoice Detail Dialog */}
      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-600" />تفاصيل الفاتورة
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 mb-1">رقم الفاتورة</p>
                  <p className="font-semibold text-sm font-mono">{selectedInvoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">التاريخ</p>
                  <p className="font-semibold text-sm">{selectedInvoice.date} - {selectedInvoice.time}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">البائع</p>
                  <p className="font-semibold text-sm">{selectedInvoice.cashier}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">الزبون</p>
                  <p className="font-semibold text-sm">
                    {selectedInvoice.customer ? (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-blue-500" />
                        {selectedInvoice.customer.name}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-500" />
                  تفاصيل المنتجات ({selectedInvoice.items.length})
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-right">#</TableHead>
                        <TableHead className="text-right">المنتج</TableHead>
                        <TableHead className="text-right">السعر</TableHead>
                        <TableHead className="text-right">الكمية</TableHead>
                        <TableHead className="text-right">الإجمالي</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.items.map((item, index) => (
                        <TableRow key={item.id || index}>
                          <TableCell className="text-gray-500 text-sm">{index + 1}</TableCell>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{formatCurrency(item.price, 2)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{item.quantity}</Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(item.price * item.quantity, 2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">المجموع الفرعي:</span>
                  <span className="font-medium">
                    {selectedInvoice.subtotal > 0
                      ? formatCurrency(selectedInvoice.subtotal, 2)
                      : formatCurrency(selectedInvoice.total, 2)}
                  </span>
                </div>

                {selectedInvoice.discount_total > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>
                      الخصم
                      {selectedInvoice.discount_type === "percentage"
                        ? ` (${selectedInvoice.discount_value}%)`
                        : ""}:
                    </span>
                    <span className="font-medium">
                      -{formatCurrency(selectedInvoice.discount_total, 2)}
                    </span>
                  </div>
                )}

                {selectedInvoice.tax_total > 0 && (
                  <div className="flex justify-between text-sm text-orange-600">
                    <span>الضريبة ({selectedInvoice.tax_rate}%):</span>
                    <span className="font-medium">
                      {formatCurrency(selectedInvoice.tax_total, 2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm text-gray-600">
                  <span>طريقة الدفع:</span>
                  <span className="font-medium flex items-center gap-1">
                    {getPaymentIcon(selectedInvoice.payment_method)}
                    {getPaymentLabel(selectedInvoice.payment_method)}
                  </span>
                </div>

                {selectedInvoice.paid_amount > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>المبلغ المدفوع:</span>
                    <span className="font-medium">
                      {formatCurrency(selectedInvoice.paid_amount, 2)}
                    </span>
                  </div>
                )}

                {selectedInvoice.change_amount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>الباقي:</span>
                    <span className="font-medium">
                      {formatCurrency(selectedInvoice.change_amount, 2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">عدد القطع:</span>
                  <span className="font-medium">
                    {selectedInvoice.items.reduce((s, item) => s + item.quantity, 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">عدد الأصناف:</span>
                  <span className="font-medium">{selectedInvoice.items.length}</span>
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">المبلغ الإجمالي:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(selectedInvoice.total, 2)}
                  </span>
                </div>
              </div>

              <DialogFooter className="gap-2 flex-wrap">
                <Button
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                  onClick={() => {
                    setIsInvoiceDialogOpen(false);
                    setTimeout(() => openReturnDialog(selectedInvoice), 100);
                  }}
                >
                  <RotateCcw className="w-4 h-4 ml-2" />
                  مرتجع
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={handlePrintInvoice}
                >
                  <Printer className="w-4 h-4 ml-2" />
                  طباعة الفاتورة
                </Button>
                <Button variant="outline" onClick={() => setIsInvoiceDialogOpen(false)}>
                  <X className="w-4 h-4 ml-2" />
                  إغلاق
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={showReturnDialog} onOpenChange={(open) => { if (!open) resetReturnForm(); }}>
        <DialogContent dir="rtl" className="max-w-xl max-sm:mx-2 max-sm:w-[calc(100%-16px)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-red-500" />مرتجع من الفاتورة
            </DialogTitle>
            <DialogDescription>حدد المنتجات المراد إرجاعها من الفاتورة</DialogDescription>
          </DialogHeader>

          {returnInvoice && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3">
                <div>
                  <div className="font-semibold text-sm">{returnInvoice.invoice_number}</div>
                  <div className="text-xs text-gray-500">{returnInvoice.date} - {returnInvoice.time}</div>
                </div>
                <div className="text-sm font-bold text-blue-600">{formatCurrency(returnInvoice.total, 2)}</div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-blue-100" onClick={resetReturnForm}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">حدد المنتجات وكميات الإرجاع:</span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={selectAllItems}>
                    <CheckCheck className="w-3 h-3 ml-1" />الكل
                  </Button>
                  {hasSelectedItems && (
                    <Button variant="ghost" size="sm" className="h-7 text-[11px] text-red-500" onClick={deselectAllItems}>
                      إلغاء الكل
                    </Button>
                  )}
                </div>
              </div>

              <ScrollArea className="max-h-48">
                <div className="space-y-2">
                  {returnInvoice.items.map((item) => {
                    const itemId = item.product_id || item.id;
                    const returnQty = selectedItems[itemId] || 0;
                    return (
                      <div key={itemId} className="flex items-center justify-between p-2 rounded-lg border hover:bg-gray-50 gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{item.name}</div>
                          <div className="text-xs text-gray-500">
                            x{item.quantity} قطعة - السعر: {formatNumber(item.price, 2)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            disabled={returnQty <= 0}
                            onClick={() => updateItemQuantity(itemId, -1, item.quantity)}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </Button>
                          <span className={`w-7 text-center text-sm font-bold tabular-nums ${returnQty > 0 ? "text-red-600" : "text-gray-400"}`}>
                            {returnQty}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            disabled={returnQty >= item.quantity}
                            onClick={() => updateItemQuantity(itemId, 1, item.quantity)}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <div>
                <label className="text-sm font-medium mb-1 block">سبب الإرجاع</label>
                <Select value={returnReason} onValueChange={setReturnReason}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر سبب الإرجاع..." />
                  </SelectTrigger>
                  <SelectContent>
                    {RETURN_REASONS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {returnReason === "سبب آخر" && (
                  <Input
                    value={returnReasonCustom}
                    onChange={(e) => setReturnReasonCustom(e.target.value)}
                    placeholder="اكتب سبب الإرجاع..."
                    className="mt-2"
                  />
                )}
              </div>

              {hasSelectedItems && (
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <span className="text-sm text-red-700">
                    إجمالي المرتجع: <strong>{formatCurrency(returnTotal, 2)}</strong>
                  </span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={resetReturnForm}>إلغاء</Button>
            {returnInvoice && (
              <Button
                onClick={() => createReturnMutation.mutate()}
                disabled={createReturnMutation.isPending || !hasSelectedItems}
                className="bg-red-600 hover:bg-red-700"
              >
                {createReturnMutation.isPending ? "جاري..." : "تأكيد الإرجاع"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </TabsContent>
        <TabsContent value="returns" className="space-y-6 mt-4">
          {returnsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-24 rounded-lg" />))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div><p className="text-sm text-red-600 font-medium">إجمالي المرتجعات</p><p className="text-2xl font-bold text-red-900 mt-1">{returns.length}</p></div>
                      <RotateCcw className="w-8 h-8 text-red-400" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div><p className="text-sm text-amber-600 font-medium">قيمة المرتجعات</p><p className="text-2xl font-bold text-amber-900 mt-1">{formatNumberDisplay(returns.reduce((s, r) => s + r.total, 0), 2)}</p></div>
                      <DollarSign className="w-8 h-8 text-amber-400" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div><p className="text-sm text-blue-600 font-medium">متوسط المرتجع</p><p className="text-2xl font-bold text-blue-900 mt-1">{returns.length > 0 ? formatNumberDisplay(returns.reduce((s, r) => s + r.total, 0) / returns.length, 2) : "0"}</p></div>
                      <Hash className="w-8 h-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>رقم المرتجع</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>المبلغ</TableHead>
                        <TableHead>السبب</TableHead>
                        <TableHead>الكاشير</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {returns.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">لا توجد مرتجعات</TableCell></TableRow>
                      ) : returns.map((ret) => (
                        <TableRow key={ret.id}>
                          <TableCell className="font-medium">{ret.return_number}</TableCell>
                          <TableCell>{ret.date} - {ret.time}</TableCell>
                          <TableCell className="font-bold text-red-600">{formatCurrency(ret.total, 2)}</TableCell>
                          <TableCell>{ret.reason || "—"}</TableCell>
                          <TableCell>{ret.cashier || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
