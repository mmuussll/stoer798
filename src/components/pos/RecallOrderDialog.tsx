import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, X } from "lucide-react";
import { CURRENCY } from "@/constants";
import type { HeldOrder } from "@/types";

interface RecallOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  heldOrders: HeldOrder[];
  onRecall: (order: HeldOrder) => void;
  onDelete: (order: HeldOrder) => void;
}

export function RecallOrderDialog({
  open, onOpenChange, heldOrders, onRecall, onDelete,
}: RecallOrderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Play className="w-5 h-5 text-green-500" />استرجاع فاتورة معلقة</DialogTitle>
          <DialogDescription>اختر فاتورة معلقة لاسترجاعها</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-72">
          {heldOrders.length === 0 ? (
            <div className="text-center text-gray-400 py-6">لا توجد فواتير معلقة</div>
          ) : (
            <div className="space-y-2">
              {heldOrders.map((order) => {
                const orderTotal = order.cart.reduce((t, i) => t + i.price * i.quantity, 0);
                const orderCount = order.cart.reduce((c, i) => c + i.quantity, 0);
                return (
                  <div key={order.id} className="border rounded-lg p-3 hover:bg-blue-50 cursor-pointer transition-colors" onClick={() => onRecall(order)}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-sm">{order.label}</h4>
                        <p className="text-xs text-gray-500">{order.createdAt}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" onClick={(e) => { e.stopPropagation(); onDelete(order); }}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex gap-3 text-xs text-gray-600">
                      <span>{order.cart.length} صنف</span>
                      <span>{orderCount} قطعة</span>
                      <span className="font-bold text-blue-600">{orderTotal.toFixed(2)} {CURRENCY}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
