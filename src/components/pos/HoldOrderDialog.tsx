import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pause } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { CartItem } from "@/types";

interface HoldOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holdLabel: string;
  onHoldLabelChange: (v: string) => void;
  cart: CartItem[];
  itemCount: number;
  total: number;
  orderCount: number;
  onHold: () => void;
}

export function HoldOrderDialog({
  open, onOpenChange, holdLabel, onHoldLabelChange,
  cart, itemCount, total, orderCount, onHold,
}: HoldOrderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Pause className="w-5 h-5 text-amber-500" />تعليق الفاتورة</DialogTitle>
          <DialogDescription>سيتم حفظ الفاتورة الحالية للعودة إليها لاحقاً</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">تسمية الفاتورة (اختياري)</label>
            <Input value={holdLabel} onChange={(e) => onHoldLabelChange(e.target.value)} placeholder={`فاتورة ${orderCount + 1}`} className="text-center" />
          </div>
          <div className="bg-muted/50 rounded-lg p-2 text-sm">
            <div className="flex justify-between"><span>عدد الأصناف:</span><span>{cart.length}</span></div>
            <div className="flex justify-between"><span>عدد القطع:</span><span>{itemCount}</span></div>
            <div className="flex justify-between font-bold"><span>الإجمالي:</span><span>{formatCurrency(total, 2)}</span></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={onHold} disabled={cart.length === 0} className="bg-amber-500 hover:bg-amber-600">تعليق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
