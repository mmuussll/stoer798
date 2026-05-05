import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Receipt, User2 } from "lucide-react";
import { CURRENCY } from "@/constants";
import type { CartItem, Customer } from "@/types";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  selectedCustomer: Customer | null;
  discountType: string;
  discountAmount: number;
  taxEnabled: boolean;
  taxRate: number;
  taxAmount: number;
  total: number;
  paymentMethod: string;
  paidAmount: number;
  change: number;
  isPending: boolean;
  onConfirm: () => void;
}

export function CheckoutDialog({
  open, onOpenChange, cart, selectedCustomer,
  discountType, discountAmount, taxEnabled, taxRate, taxAmount,
  total, paymentMethod, paidAmount, change, isPending, onConfirm,
}: CheckoutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Receipt className="w-5 h-5 text-blue-600" />تأكيد عملية البيع</DialogTitle>
          <DialogDescription>الرجاء مراجعة تفاصيل الفاتورة قبل الإتمام</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {selectedCustomer && (
            <div className="flex items-center gap-2 text-sm bg-blue-50 rounded-lg p-2">
              <User2 className="w-4 h-4 text-blue-600" />
              <span className="font-medium">{selectedCustomer.name}</span>
              {selectedCustomer.phone && <span className="text-gray-500 text-xs">{selectedCustomer.phone}</span>}
              <span className="text-xs text-blue-600 mr-auto">{selectedCustomer.points} نقطة</span>
            </div>
          )}
          <div className="rounded-lg border bg-gray-50 p-3 space-y-2 max-h-48 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <div><span className="font-medium">{item.name}</span><span className="text-gray-500 mr-2">x{item.quantity}</span></div>
                <span className="font-semibold">{(item.price * item.quantity).toFixed(2)} {CURRENCY}</span>
              </div>
            ))}
          </div>
          {discountType !== "none" && (
            <div className="flex justify-between text-sm text-red-600 bg-red-50 rounded-lg p-2">
              <span>الخصم:</span>
              <span>-{discountAmount.toFixed(2)} {CURRENCY}</span>
            </div>
          )}
          {taxEnabled && taxRate > 0 && (
            <div className="flex justify-between text-sm text-orange-600 bg-orange-50 rounded-lg p-2">
              <span>الضريبة:</span>
              <span>{taxAmount.toFixed(2)} {CURRENCY}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-gray-600">
            <span>طريقة الدفع:</span>
            <span className="font-medium">{paymentMethod === "cash" ? "نقداً" : paymentMethod === "card" ? "بطاقة" : "مختلط (كاش + بطاقة)"}</span>
          </div>
          {paymentMethod === "cash" && paidAmount > 0 && change >= 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">المبلغ المدفوع / الباقي:</span>
              <span className="font-semibold">{paidAmount.toFixed(2)} / <span className="text-green-600">{change.toFixed(2)}</span> {CURRENCY}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-base font-bold">الإجمالي النهائي:</span>
            <span className="text-2xl font-bold text-blue-600">{total.toFixed(2)} {CURRENCY}</span>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={onConfirm} disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700">
            {isPending ? "جاري الإتمام..." : "تأكيد البيع"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
