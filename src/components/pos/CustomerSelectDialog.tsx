import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User2, X } from "lucide-react";
import type { Customer } from "@/types";

interface CustomerSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  searchedCustomers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (c: Customer | null) => void;
}

export function CustomerSelectDialog({
  open, onOpenChange, searchTerm, onSearchChange,
  searchedCustomers, selectedCustomer, onSelectCustomer,
}: CustomerSelectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><User2 className="w-5 h-5 text-blue-600" />اختيار الزبون</DialogTitle>
          <DialogDescription>ابحث عن زبون أو اختر من القائمة</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input value={searchTerm} onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ابحث بالاسم أو رقم الهاتف..." className="text-center" autoFocus />
          {selectedCustomer && (
            <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-2">
              <User2 className="w-4 h-4 text-blue-600" />
              <div className="flex-1">
                <div className="font-medium text-sm">{selectedCustomer.name}</div>
                {selectedCustomer.phone && <div className="text-xs text-gray-500">{selectedCustomer.phone}</div>}
              </div>
              <div className="text-xs">
                <Badge variant="secondary">{selectedCustomer.total_visits} زيارة</Badge>
                <Badge variant="outline" className="ml-1 bg-amber-50">{selectedCustomer.points} نقطة</Badge>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" onClick={() => onSelectCustomer(null)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
          <ScrollArea className="max-h-60">
            {searchTerm.length >= 2 ? (
              searchedCustomers.length === 0 ? (
                <div className="text-center text-gray-400 py-6 text-sm">لا يوجد زبائن مطابقين</div>
              ) : (
                <div className="space-y-1">
                  {searchedCustomers.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => { onSelectCustomer(c); onOpenChange(false); }}>
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                        <User2 className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{c.name}</div>
                        {c.phone && <div className="text-xs text-gray-500">{c.phone}</div>}
                      </div>
                      <Badge variant="outline" className="text-xs">{c.points} نقطة</Badge>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center text-gray-400 py-6 text-sm">اكتب حرفين على الأقل للبحث</div>
            )}
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { onSelectCustomer(null); onOpenChange(false); }}>بدون زبون</Button>
          <Button onClick={() => onOpenChange(false)}>تم</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
