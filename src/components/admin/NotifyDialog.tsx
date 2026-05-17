import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Loader2 } from "lucide-react";
import type { UserWithSubscription } from "@/types";

interface NotifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: UserWithSubscription[];
  notifyTitle: string;
  setNotifyTitle: (v: string) => void;
  notifyMessage: string;
  setNotifyMessage: (v: string) => void;
  notifyType: string;
  setNotifyType: (v: string) => void;
  notifyTarget: string;
  setNotifyTarget: (v: string) => void;
  expiryHours: number;
  setExpiryHours: (v: number) => void;
  notifyMutation: { mutate: () => void; isPending: boolean };
}

export default function NotifyDialog({
  open,
  onOpenChange,
  users,
  notifyTitle,
  setNotifyTitle,
  notifyMessage,
  setNotifyMessage,
  notifyType,
  setNotifyType,
  notifyTarget,
  setNotifyTarget,
  expiryHours,
  setExpiryHours,
  notifyMutation,
}: NotifyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Send className="w-5 h-5 text-primary" />إرسال إشعار</DialogTitle>
          <DialogDescription>أرسل إشعاراً للمستخدمين</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="nt">المستلم</Label>
            <Select value={notifyTarget} onValueChange={setNotifyTarget}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المستخدمين</SelectItem>
                {users.map((u) => (<SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ntype">نوع الإشعار</Label>
            <Select value={notifyType} onValueChange={setNotifyType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="system">النظام</SelectItem>
                <SelectItem value="debt">ديون</SelectItem>
                <SelectItem value="alert">تنبيه</SelectItem>
                <SelectItem value="info">معلومة</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ntitle">العنوان</Label>
            <Input id="ntitle" value={notifyTitle} onChange={(e) => setNotifyTitle(e.target.value)} placeholder="عنوان الإشعار" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nmsg">الرسالة</Label>
            <Input id="nmsg" value={notifyMessage} onChange={(e) => setNotifyMessage(e.target.value)} placeholder="نص الإشعار" />
          </div>
          <div className="space-y-2">
            <Label>حذف تلقائي بعد</Label>
            <div className="grid grid-cols-6 gap-2">
              {[
                { label: "لا", hours: 0 },
                { label: "ساعة", hours: 1 },
                { label: "6 ساعات", hours: 6 },
                { label: "يوم", hours: 24 },
                { label: "أسبوع", hours: 168 },
                { label: "شهر", hours: 720 },
              ].map((p) => (
                <Button
                  key={p.hours}
                  variant={expiryHours === p.hours ? "default" : "outline"}
                  size="sm"
                  className={expiryHours === p.hours ? "bg-amber-600 hover:bg-amber-700 text-[11px]" : "text-[11px]"}
                  onClick={() => setExpiryHours(p.hours)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={() => notifyMutation.mutate()} disabled={notifyMutation.isPending || !notifyTitle.trim() || !notifyMessage.trim()} className="bg-primary hover:bg-primary/90">
            {notifyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Send className="w-4 h-4 ml-2" />}إرسال
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
