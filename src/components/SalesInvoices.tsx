import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import {
  Receipt, Search, Calendar, User, Printer, Eye, FileText, X, Package,
  DollarSign, Hash, Users, CreditCard, Percent, Wallet, ChevronDown,
} from "lucide-react";
import * as salesApi from "@/api/sales";
import { CURRENCY } from "@/constants";
import { printSaleInvoice } from "@/lib/printInvoice";
import type { SaleInvoice } from "@/types";

const ITEMS_PER_PAGE = 10;

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
  const [selectedInvoice, setSelectedInvoice] = useState<SaleInvoice | null>(null);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: salesInvoices = [], isLoading } = useQuery({
    queryKey: ["sales-invoices"],
    queryFn: salesApi.fetchSalesInvoices,
  });

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
  const totalTax = filteredInvoices.reduce((sum, inv) => sum + (inv.tax_total || 0), 0);

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">فواتير المبيعات</h1>
          <p className="text-sm text-gray-500 mt-1">عرض وإدارة فواتير المبيعات</p>
        </div>
      </div>

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
                <p className="text-2xl font-bold text-emerald-900 mt-1">{totalRevenue.toFixed(2)}</p>
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
                <p className="text-2xl font-bold text-orange-900 mt-1">{totalDiscount.toFixed(2)}</p>
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
                  {filteredInvoices.length > 0
                    ? (totalRevenue / filteredInvoices.length).toFixed(2)
                    : "0.00"}
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
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => openInvoice(invoice)}
                      >
                        <TableCell className="font-medium">
                          <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs font-mono">
                            {invoice.invoice_number}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {invoice.date}
                            <span className="text-gray-400 text-xs">{invoice.time}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {invoice.customer ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Users className="w-3 h-3 text-blue-500" />
                              <span className="truncate max-w-[100px]">{invoice.customer.name}</span>
                            </div>
                          ) : (
                            <span className="text-gray-300 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {invoice.items.length} صنف
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-sm truncate max-w-[80px]">{invoice.cashier}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs flex items-center gap-1 w-fit">
                            {getPaymentIcon(invoice.payment_method)}
                            {getPaymentLabel(invoice.payment_method)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-blue-600">
                          {invoice.total.toFixed(2)} {CURRENCY}
                        </TableCell>
                        <TableCell className="text-center">
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
                          <TableCell>{item.price.toFixed(2)} {CURRENCY}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{item.quantity}</Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {(item.price * item.quantity).toFixed(2)} {CURRENCY}
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
                      ? `${selectedInvoice.subtotal.toFixed(2)} ${CURRENCY}`
                      : `${selectedInvoice.total.toFixed(2)} ${CURRENCY}`}
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
                      -{selectedInvoice.discount_total.toFixed(2)} {CURRENCY}
                    </span>
                  </div>
                )}

                {selectedInvoice.tax_total > 0 && (
                  <div className="flex justify-between text-sm text-orange-600">
                    <span>الضريبة ({selectedInvoice.tax_rate}%):</span>
                    <span className="font-medium">
                      {selectedInvoice.tax_total.toFixed(2)} {CURRENCY}
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
                      {selectedInvoice.paid_amount.toFixed(2)} {CURRENCY}
                    </span>
                  </div>
                )}

                {selectedInvoice.change_amount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>الباقي:</span>
                    <span className="font-medium">
                      {selectedInvoice.change_amount.toFixed(2)} {CURRENCY}
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
                    {selectedInvoice.total.toFixed(2)} {CURRENCY}
                  </span>
                </div>
              </div>

              <DialogFooter className="gap-2">
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
    </div>
  );
}
