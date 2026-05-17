import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { Debt } from "@/types";

interface EditDebtDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDebt: Debt | null;
  editAmount: string;
  setEditAmount: (v: string) => void;
  editDueDate: string;
  setEditDueDate: (v: string) => void;
  editStatus: string;
  setEditStatus: (v: string) => void;
  editDebtorPhone: string;
  setEditDebtorPhone: (v: string) => void;
  editGuarantorName: string;
  setEditGuarantorName: (v: string) => void;
  editGuarantorPhone: string;
  setEditGuarantorPhone: (v: string) => void;
  editNote: string;
  setEditNote: (v: string) => void;
  editMutation: { mutate: () => void; isPending: boolean };
}

export default function EditDebtDialog({
  open,
  onOpenChange,
  selectedDebt,
  editAmount,
  setEditAmount,
  editDueDate,
  setEditDueDate,
  editStatus,
  setEditStatus,
  editDebtorPhone,
  setEditDebtorPhone,
  editGuarantorName,
  setEditGuarantorName,
  editGuarantorPhone,
  setEditGuarantorPhone,
  editNote,
  setEditNote,
  editMutation,
}: EditDebtDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-lg max-h-[90vh] overflow-y-auto max-sm:mx-2 max-sm:w-[calc(100%-16px)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-amber-600" />تعديل الدين
          </DialogTitle>
          <DialogDescription>
            {selectedDebt && <span>تعديل بيانات الدين للزبون: <strong>{selectedDebt.customer_name}</strong></span>}
          </DialogDescription>
        </DialogHeader>
        {selectedDebt && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">المبلغ الكلي</label>
              <Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)}
                placeholder="0.00" dir="ltr" className="text-lg font-bold text-center" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">تاريخ الاستحقاق</label>
              <Input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">الحالة</label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="partially_paid">مدفوع جزئياً</SelectItem>
                  <SelectItem value="overdue">متأخر</SelectItem>
                  <SelectItem value="paid">مدفوع</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">رقم هاتف المديون</label>
              <Input type="tel" value={editDebtorPhone} onChange={(e) => setEditDebtorPhone(e.target.value)}
                dir="ltr" placeholder="رقم الهاتف" />
            </div>
            <div className="bg-muted/50 border rounded-lg p-3 space-y-3">
              <span className="text-sm font-semibold text-foreground/80">بيانات الكفيل</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">اسم الكفيل</label>
                  <Input value={editGuarantorName} onChange={(e) => setEditGuarantorName(e.target.value)} placeholder="اسم الكفيل" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">رقم الكفيل</label>
                  <Input type="tel" value={editGuarantorPhone} onChange={(e) => setEditGuarantorPhone(e.target.value)}
                    dir="ltr" placeholder="07xxxxxxxxx" />
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">ملاحظات</label>
              <Input value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="ملاحظات..." />
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-xs text-primary/80">
                المدفوع حتى الآن: <strong>{formatCurrency(selectedDebt.total_amount - selectedDebt.remaining_amount, 2)}</strong>
                {" | "}
                المتبقي: <strong>{formatCurrency(selectedDebt.remaining_amount, 2)}</strong>
              </p>
            </div>
          </div>
        )}
        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={() => editMutation.mutate()} disabled={editMutation.isPending}
            className="bg-amber-600 hover:bg-amber-700">
            {editMutation.isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
