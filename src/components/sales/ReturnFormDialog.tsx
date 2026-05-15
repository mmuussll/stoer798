import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw, X, CheckCheck, Minus, Plus } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { SaleInvoice } from "@/types";

const RETURN_REASONS = [
  "منتج تالف",
  "منتج غير مطابق للوصف",
  "خطأ في الطلب",
  "منتج منتهي الصلاحية",
  "إرجاع من الزبون",
  "سبب آخر",
];

interface ReturnFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnInvoice: SaleInvoice | null;
  selectedItems: Record<string, number>;
  returnReason: string;
  returnReasonCustom: string;
  hasSelectedItems: boolean;
  returnTotal: number;
  createReturnMutation: { mutate: () => void; isPending: boolean };
  resetReturnForm: () => void;
  updateItemQuantity: (itemId: string, delta: number, maxQty: number) => void;
  selectAllItems: () => void;
  deselectAllItems: () => void;
  setReturnReason: (v: string) => void;
  setReturnReasonCustom: (v: string) => void;
}

export default function ReturnFormDialog({
  open,
  onOpenChange,
  returnInvoice,
  selectedItems,
  returnReason,
  returnReasonCustom,
  hasSelectedItems,
  returnTotal,
  createReturnMutation,
  resetReturnForm,
  updateItemQuantity,
  selectAllItems,
  deselectAllItems,
  setReturnReason,
  setReturnReasonCustom,
}: ReturnFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
  );
}
