import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DeleteDebtConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  onSubmit: () => void;
  isPending: boolean;
}

export default function DeleteDebtConfirmDialog({
  open,
  onOpenChange,
  customerName,
  onSubmit,
  isPending,
}: DeleteDebtConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md max-sm:mx-2 max-sm:w-[calc(100%-16px)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />تأكيد الإلغاء
          </DialogTitle>
          <DialogDescription>
            هل أنت متأكد من إلغاء دين <strong>{customerName}</strong>؟
            <br />
            <span className="text-red-500 text-sm">هذا الإجراء لا يمكن التراجع عنه وسيتم إلغاء جميع المدفوعات المرتبطة به.</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button variant="destructive" onClick={onSubmit} disabled={isPending}>
            {isPending ? "جاري الإلغاء..." : "تأكيد الإلغاء"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
