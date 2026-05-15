import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Banknote } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { PAYMENT_ICONS, PAYMENT_LABELS } from "@/lib/debt-utils";
import type { Debt } from "@/types";

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debt: Debt | null;
  paymentAmount: string;
  onPaymentAmountChange: (v: string) => void;
  paymentMethod: "cash" | "card" | "transfer";
  onPaymentMethodChange: (m: "cash" | "card" | "transfer") => void;
  paymentNote: string;
  onPaymentNoteChange: (v: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export default function RecordPaymentDialog({
  open,
  onOpenChange,
  debt,
  paymentAmount,
  onPaymentAmountChange,
  paymentMethod,
  onPaymentMethodChange,
  paymentNote,
  onPaymentNoteChange,
  onSubmit,
  isPending,
}: RecordPaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md max-sm:mx-2 max-sm:w-[calc(100%-16px)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-emerald-600" />تسجيل دفعة دين
          </DialogTitle>
          <DialogDescription>
            {debt && <span>تسجيل دفعة من الزبون: <strong>{debt.customer_name}</strong></span>}
          </DialogDescription>
        </DialogHeader>
        {debt && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-3">
              <div>
                <p className="text-xs text-gray-500">المبلغ الكلي للدين</p>
                <p className="font-bold text-lg">{formatCurrency(debt.total_amount, 2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">المبلغ المتبقي</p>
                <p className="font-bold text-lg text-red-600">{formatCurrency(debt.remaining_amount, 2)}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">المبلغ المدفوع <span className="text-red-500">*</span></label>
              <Input type="number" value={paymentAmount} onChange={(e) => onPaymentAmountChange(e.target.value)}
                placeholder="0.00" dir="ltr" min={0} max={debt.remaining_amount} autoFocus />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">طريقة الدفع</label>
              <div className="flex gap-2">
                {(["cash", "card", "transfer"] as const).map((m) => {
                  const Icon = PAYMENT_ICONS[m];
                  return (
                    <Button key={m} variant={paymentMethod === m ? "default" : "outline"} size="sm" className="flex-1 gap-1"
                      onClick={() => onPaymentMethodChange(m)}>
                      <Icon className="w-3.5 h-3.5" />{PAYMENT_LABELS[m]}
                    </Button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">ملاحظات</label>
              <Input value={paymentNote} onChange={(e) => onPaymentNoteChange(e.target.value)} placeholder="ملاحظات إضافية..." />
            </div>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={onSubmit}
            disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || parseFloat(paymentAmount) > (debt?.remaining_amount || 0) || isPending}>
            {isPending ? "جاري التسجيل..." : "تسجيل الدفعة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
