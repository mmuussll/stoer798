import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Hash } from "lucide-react";
import { CURRENCY } from "@/constants";

interface FastSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  onNameChange: (v: string) => void;
  price: string;
  onPriceChange: (v: string) => void;
  onAdd: () => void;
}

export function FastSaleDialog({
  open, onOpenChange, name, onNameChange, price, onPriceChange, onAdd,
}: FastSaleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Hash className="w-5 h-5 text-blue-600" />بيع سريع</DialogTitle>
          <DialogDescription>إضافة منتج غير مسجل في المخزون بسرعة</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">اسم المنتج</label>
            <Input value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="اسم المنتج السريع" autoFocus />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">السعر ({CURRENCY})</label>
            <Input type="number" value={price} onChange={(e) => onPriceChange(e.target.value)} placeholder="0" className="text-center text-lg font-bold" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={onAdd} className="bg-blue-600">إضافة للسلة</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
