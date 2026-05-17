import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Landmark } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { CashSession } from "@/types";

interface CloseSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: CashSession | null;
  closingBalance: string;
  onClosingBalanceChange: (v: string) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function CloseSessionDialog({
  open, onOpenChange, session, closingBalance,
  onClosingBalanceChange, onConfirm, isPending,
}: CloseSessionDialogProps) {
  if (!session) return null;

  const expectedCash = session.opening_balance + session.total_cash - session.total_returns;
  const diff = parseFloat(closingBalance) - expectedCash;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Landmark className="w-5 h-5 text-red-500" />إقفال الجلسة</DialogTitle>
          <DialogDescription>أدخل المبلغ النقدي الفعلي الموجود في الصندوق</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between"><span>المبلغ الافتتاحي:</span><span>{formatCurrency(session.opening_balance, 2)}</span></div>
            <div className="flex justify-between"><span>إجمالي المبيعات:</span><span>{formatCurrency(session.total_sales, 2)}</span></div>
            <div className="flex justify-between"><span>نقدي:</span><span>{formatCurrency(session.total_cash, 2)}</span></div>
            <div className="flex justify-between"><span>بطاقة:</span><span>{formatCurrency(session.total_card, 2)}</span></div>
            <div className="flex justify-between"><span>مرتجعات:</span><span className="text-red-500">-{formatCurrency(session.total_returns, 2)}</span></div>
            <div className="flex justify-between"><span>عدد الفواتير:</span><span>{session.invoice_count}</span></div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span>النقدي المتوقع:</span>
              <span>{formatCurrency(expectedCash, 2)}</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">النقدي الفعلي في الصندوق</label>
            <Input type="number" value={closingBalance} onChange={(e) => onClosingBalanceChange(e.target.value)} className="text-center text-lg font-bold" autoFocus />
          </div>
          {closingBalance && (
            <div className="text-center">
              <Badge variant="outline" className={diff >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}>
                الفرق: {diff >= 0 ? "+" : "-"}{formatCurrency(Math.abs(diff), 2)}
              </Badge>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={onConfirm} disabled={isPending} className="bg-red-600 hover:bg-red-700">
            {isPending ? "جاري..." : "إقفال الجلسة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
