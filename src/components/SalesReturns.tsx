import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
} from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RotateCcw, Search, Eye, Trash2, Receipt, ArrowRightLeft,
  FileText, Clock, Package, ChevronLeft, X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as returnsApi from "@/api/returns";
import * as salesApi from "@/api/sales";
import { CURRENCY } from "@/constants";
import type { SalesReturn, SaleInvoice } from "@/types";

export default function SalesReturns() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<SalesReturn | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingReturn, setDeletingReturn] = useState<SalesReturn | null>(null);

  // Create return state
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [foundInvoice, setFoundInvoice] = useState<SaleInvoice | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [returnReason, setReturnReason] = useState("");
  const [searchingInvoice, setSearchingInvoice] = useState(false);

  const [page, setPage] = useState(1);
  const perPage = 10;

  const { data: returns = [], isLoading } = useQuery({
    queryKey: ["sales-returns"],
    queryFn: () => returnsApi.fetchSalesReturns(),
    staleTime: 2 * 60_000,
  });

  const createReturnMutation = useMutation({
    mutationFn: async () => {
      if (!foundInvoice) throw new Error("لم يتم العثور على الفاتورة");

      const items = Object.entries(selectedItems)
        .filter(([, qty]) => qty > 0)
        .map(([productId, qty]) => {
          const invoiceItem = foundInvoice.items.find((i) => i.product_id === productId || i.id === productId);
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

      return returnsApi.createSalesReturn(
        {
          return_number: returnNumber,
          original_invoice_id: foundInvoice.id,
          date: now.toISOString().slice(0, 10),
          time: now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
          total,
          reason: returnReason,
          cashier: "البائع الرئيسي",
        },
        items
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-returns"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "تمت عملية الإرجاع بنجاح", description: "تم إرجاع المنتجات واستعادة المخزون" });
      resetCreateForm();
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => returnsApi.deleteSalesReturn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-returns"] });
      toast({ title: "تم حذف المرتجع" });
      setDeletingReturn(null);
      setShowDeleteDialog(false);
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const searchInvoice = async () => {
    if (!invoiceSearch.trim()) return;
    setSearchingInvoice(true);
    try {
      const invoices = await salesApi.fetchSalesInvoices();
      const found = invoices.find((inv) => inv.invoice_number.toLowerCase().includes(invoiceSearch.trim().toLowerCase()));
      if (found) {
        setFoundInvoice(found);
        setSelectedItems({});
        toast({ title: "تم العثور على الفاتورة", description: `رقم: ${found.invoice_number}` });
      } else {
        toast({ title: "لم يتم العثور", description: "لا توجد فاتورة بهذا الرقم", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally {
      setSearchingInvoice(false);
    }
  };

  const resetCreateForm = () => {
    setFoundInvoice(null);
    setInvoiceSearch("");
    setSelectedItems({});
    setReturnReason("");
    setShowCreateDialog(false);
  };

  const toggleItemQuantity = (itemId: string, currentQty: number, maxQty: number) => {
    const newQty = currentQty + 1 > maxQty ? 0 : currentQty + 1;
    if (newQty === 0) {
      const { [itemId]: _, ...rest } = selectedItems;
      setSelectedItems(rest);
    } else {
      setSelectedItems({ ...selectedItems, [itemId]: newQty });
    }
  };

  const filtered = returns.filter((r) => {
    if (!searchTerm.trim()) return true;
    const t = searchTerm.toLowerCase();
    return r.return_number.toLowerCase().includes(t) || (r.reason && r.reason.toLowerCase().includes(t));
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const totalReturned = returns.reduce((s, r) => s + r.total, 0);
  const totalItems = returns.reduce((s, r) => s + r.items.reduce((si, ri) => si + ri.quantity, 0), 0);

  return (
    <div className="space-y-4 p-4" dir="rtl">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-4 flex items-center gap-3">
            <RotateCcw className="w-8 h-8 opacity-80" />
            <div><div className="text-2xl font-bold">{returns.length}</div><div className="text-xs opacity-80">عدد المرتجعات</div></div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4 flex items-center gap-3">
            <ArrowRightLeft className="w-8 h-8 opacity-80" />
            <div><div className="text-2xl font-bold">{totalReturned.toFixed(2)}</div><div className="text-xs opacity-80">قيمة المرتجعات ({CURRENCY})</div></div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardContent className="p-4 flex items-center gap-3">
            <Package className="w-8 h-8 opacity-80" />
            <div><div className="text-2xl font-bold">{totalItems}</div><div className="text-xs opacity-80">القطع المرتجعة</div></div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Create */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} placeholder="ابحث برقم المرتجع..." className="pr-10" />
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-red-600 hover:bg-red-700 gap-2"><RotateCcw className="w-4 h-4" />مرتجع جديد</Button>
      </div>

      {/* Returns Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <RotateCcw className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">لا توجد مرتجعات</p>
              <p className="text-sm">{searchTerm ? "جرب تغيير معايير البحث" : "لم يتم تسجيل أي مرتجع بعد"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم المرتجع</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-center">القطع</TableHead>
                  <TableHead className="text-center">المبلغ</TableHead>
                  <TableHead className="text-right">السبب</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((r) => (
                  <TableRow key={r.id} className="hover:bg-gray-50">
                    <TableCell><Badge variant="outline" className="font-mono text-xs">{r.return_number}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm"><Clock className="w-3 h-3 text-gray-400" />{r.date}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{r.items.reduce((s, i) => s + i.quantity, 0)}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-semibold text-red-600">{r.total.toFixed(2)} {CURRENCY}</TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-[200px] truncate">{r.reason || "-"}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => { setSelectedReturn(r); setShowDetailDialog(true); }}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => { setDeletingReturn(r); setShowDeleteDialog(true); }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>السابق</PaginationLink>
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => (
              <PaginationItem key={i}>
                <PaginationLink onClick={() => setPage(i + 1)} isActive={page === i + 1}>{i + 1}</PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationLink onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>التالي</PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Create Return Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => { if (!open) resetCreateForm(); }}>
        <DialogContent dir="rtl" className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><RotateCcw className="w-5 h-5 text-red-500" />مرتجع جديد</DialogTitle>
            <DialogDescription>ابحث عن الفاتورة الأصلية وحدد المنتجات المراد إرجاعها</DialogDescription>
          </DialogHeader>

          {!foundInvoice ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  placeholder="أدخل رقم الفاتورة..."
                  className="flex-1 text-center font-mono"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && searchInvoice()}
                />
                <Button onClick={searchInvoice} disabled={searchingInvoice || !invoiceSearch.trim()}>
                  {searchingInvoice ? "بحث..." : "بحث"}
                </Button>
              </div>
              <p className="text-xs text-gray-500 text-center">أدخل رقم الفاتورة للبحث عنها (مثال: INV-20250101-XXXX)</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3">
                <div>
                  <div className="font-semibold text-sm">{foundInvoice.invoice_number}</div>
                  <div className="text-xs text-gray-500">{foundInvoice.date} - {foundInvoice.time}</div>
                </div>
                <div className="text-sm font-bold text-blue-600">{foundInvoice.total.toFixed(2)} {CURRENCY}</div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={resetCreateForm}><X className="w-3 h-3" /></Button>
              </div>

              <div className="text-sm font-medium">حدد المنتجات وكميات الإرجاع:</div>
              <ScrollArea className="max-h-48">
                <div className="space-y-2">
                  {foundInvoice.items.map((item) => {
                    const returnQty = selectedItems[item.product_id || item.id] || 0;
                    return (
                      <div key={item.product_id || item.id} className="flex items-center justify-between p-2 rounded-lg border hover:bg-gray-50">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{item.name}</div>
                          <div className="text-xs text-gray-500">x{item.quantity} تم شراؤها - السعر: {item.price.toFixed(2)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">المرتجع:</span>
                          <Button
                            variant={returnQty > 0 ? "default" : "outline"}
                            size="sm"
                            className={`h-7 text-xs ${returnQty > 0 ? "bg-red-600" : ""}`}
                            onClick={() => toggleItemQuantity(item.product_id || item.id, returnQty, item.quantity)}
                          >
                            {returnQty > 0 ? `${returnQty} قطعة` : "إضافة"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <div>
                <label className="text-sm font-medium mb-1 block">سبب الإرجاع</label>
                <Input value={returnReason} onChange={(e) => setReturnReason(e.target.value)} placeholder="مثال: منتج تالف، غير مطابق..." />
              </div>

              {Object.values(selectedItems).some((q) => q > 0) && (
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <span className="text-sm text-red-700">
                    إجمالي المرتجع: <strong>
                      {foundInvoice.items
                        .filter((i) => (selectedItems[i.product_id || i.id] || 0) > 0)
                        .reduce((s, i) => s + i.price * (selectedItems[i.product_id || i.id] || 0), 0)
                        .toFixed(2)} {CURRENCY}
                    </strong>
                  </span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={resetCreateForm}>إلغاء</Button>
            {foundInvoice && (
              <Button onClick={() => createReturnMutation.mutate()} disabled={createReturnMutation.isPending || Object.values(selectedItems).every((q) => q === 0)} className="bg-red-600 hover:bg-red-700">
                {createReturnMutation.isPending ? "جاري..." : "تأكيد الإرجاع"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" />تفاصيل المرتجع</DialogTitle>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-3 rounded-lg">
                <div><span className="text-gray-500">الرقم:</span> <span className="font-mono font-medium">{selectedReturn.return_number}</span></div>
                <div><span className="text-gray-500">التاريخ:</span> <span className="font-medium">{selectedReturn.date} {selectedReturn.time}</span></div>
                <div><span className="text-gray-500">البائع:</span> <span className="font-medium">{selectedReturn.cashier}</span></div>
                <div><span className="text-gray-500">السبب:</span> <span className="font-medium">{selectedReturn.reason || "-"}</span></div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المنتج</TableHead>
                    <TableHead className="text-center">السعر</TableHead>
                    <TableHead className="text-center">الكمية</TableHead>
                    <TableHead className="text-center">الإجمالي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedReturn.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm font-medium">{item.name}</TableCell>
                      <TableCell className="text-center text-sm">{item.price.toFixed(2)}</TableCell>
                      <TableCell className="text-center"><Badge variant="secondary">{item.quantity}</Badge></TableCell>
                      <TableCell className="text-center font-semibold">{(item.price * item.quantity).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>الإجمالي:</span>
                <span className="text-red-600">{selectedReturn.total.toFixed(2)} {CURRENCY}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600">حذف المرتجع</DialogTitle>
            <DialogDescription>هل أنت متأكد من حذف المرتجع "{deletingReturn?.return_number}"؟</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={() => deletingReturn && deleteMutation.mutate(deletingReturn.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "جاري..." : "تأكيد الحذف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
