import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Percent } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { CURRENCY } from "@/constants";

interface DiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discountType: "none" | "percentage" | "fixed";
  discountValue: number;
  discountAmount: number;
  onDiscountTypeChange: (type: "none" | "percentage" | "fixed") => void;
  onDiscountValueChange: (value: number) => void;
}

const PRESET_DISCOUNTS = [
  { label: "5%", value: 5 },
  { label: "10%", value: 10 },
  { label: "15%", value: 15 },
  { label: "20%", value: 20 },
  { label: "25%", value: 25 },
];

export function DiscountDialog({
  open, onOpenChange, discountType, discountValue, discountAmount,
  onDiscountTypeChange, onDiscountValueChange,
}: DiscountDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Percent className="w-5 h-5 text-amber-500" />تطبيق خصم</DialogTitle>
          <DialogDescription>اختر نوع الخصم وقيمته على الفاتورة</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button variant={discountType === "none" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => { onDiscountTypeChange("none"); onDiscountValueChange(0); }}>
              بدون خصم
            </Button>
            <Button variant={discountType === "percentage" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => onDiscountTypeChange("percentage")}>
              نسبة %
            </Button>
            <Button variant={discountType === "fixed" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => onDiscountTypeChange("fixed")}>
              مبلغ ثابت
            </Button>
          </div>
          {discountType === "percentage" && (
            <div className="space-y-2">
              <div className="flex gap-1 flex-wrap">
                {PRESET_DISCOUNTS.map((p) => (
                  <Button key={p.label} variant={discountValue === p.value ? "default" : "outline"}
                    size="sm" className={discountValue === p.value ? "bg-amber-500" : "text-xs"}
                    onClick={() => onDiscountValueChange(p.value)}>{p.label}</Button>
                ))}
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">نسبة مخصصة</label>
                <Input type="number" value={discountValue || ""} onChange={(e) => onDiscountValueChange(parseFloat(e.target.value) || 0)} className="text-center" placeholder="0" />
              </div>
            </div>
          )}
          {discountType === "fixed" && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">مبلغ الخصم ({CURRENCY})</label>
              <Input type="number" value={discountValue || ""} onChange={(e) => onDiscountValueChange(parseFloat(e.target.value) || 0)} className="text-center text-lg font-bold" placeholder="0" />
            </div>
          )}
          {discountType !== "none" && discountValue > 0 && (
            <div className="bg-amber-50 rounded-lg p-2 text-center">
              <span className="text-sm text-amber-700">
                الخصم: <strong>{discountType === "percentage" ? `${discountValue}%` : formatCurrency(discountValue, 2)}</strong> =
                <strong className="mx-1">{formatCurrency(discountAmount, 2)}</strong>
              </span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full">تم</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
