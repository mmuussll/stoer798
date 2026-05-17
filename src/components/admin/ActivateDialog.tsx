import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, Loader2, Crown, Zap, Star } from "lucide-react";
import { PLANS, DISCOUNT_TIERS, getDiscountPrice, type PlanType } from "@/constants";

interface ActivateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: string | null;
  activationDays: number;
  setActivationDays: (v: number) => void;
  activationNote: string;
  setActivationNote: (v: string) => void;
  selectedPlan: PlanType;
  setSelectedPlan: (v: PlanType) => void;
  selectedDiscountTier: number;
  setSelectedDiscountTier: (v: number) => void;
  activateMutation: { mutate: (args: { userId: string; days: number; plan: PlanType }) => void; isPending: boolean };
}

export default function ActivateDialog({
  open,
  onOpenChange,
  selectedUser,
  activationDays,
  setActivationDays,
  activationNote,
  setActivationNote,
  selectedPlan,
  setSelectedPlan,
  selectedDiscountTier,
  setSelectedDiscountTier,
  activateMutation,
}: ActivateDialogProps) {
  const handleActivate = () => {
    if (!selectedUser) return;
    activateMutation.mutate({ userId: selectedUser, days: activationDays, plan: selectedPlan });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" />تفعيل الاشتراك</DialogTitle>
          <DialogDescription>اختر الباقة والمدة المناسبة</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>الباقة</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["free", "basic", "pro"] as PlanType[]).map((p) => {
                const plan = PLANS[p];
                const isSelected = selectedPlan === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => { setSelectedPlan(p); }}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      isSelected
                        ? p === "pro" ? "border-purple-400 bg-purple-50" : p === "basic" ? "border-blue-400 bg-blue-50" : "border-border bg-muted/40"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex justify-center mb-1">
                      {p === "pro" ? <Crown className="w-4 h-4 text-amber-500" /> : p === "basic" ? <Zap className="w-4 h-4 text-blue-500" /> : <Star className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <p className={`text-xs font-bold ${isSelected ? (p === "pro" ? "text-purple-700" : p === "basic" ? "text-blue-700" : "text-foreground/80") : "text-muted-foreground"}`}>{plan.nameAr}</p>
                    <p className="text-[10px] text-muted-foreground">{plan.key === "free" ? "مجاني" : `${plan.monthlyPrice.toLocaleString()} د.ع`}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedPlan !== "free" && (
            <div className="space-y-2">
              <Label>المدة والخصم</Label>
              <div className="grid grid-cols-4 gap-2">
                {DISCOUNT_TIERS.map((tier, idx) => {
                  const planPrice = PLANS[selectedPlan].monthlyPrice;
                  const monthlyWithDiscount = getDiscountPrice(planPrice, tier.discountPercent);
                  const totalDays = tier.months * 30;
                  const isSelected = selectedDiscountTier === idx;
                  return (
                    <button
                      key={tier.months}
                      type="button"
                      onClick={() => {
                        setSelectedDiscountTier(idx);
                        setActivationDays(totalDays);
                      }}
                      className={`p-2 rounded-lg border text-center transition-all text-xs ${
                        isSelected ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <p className="font-bold text-foreground/80">{tier.label}</p>
                      <p className={`font-bold ${tier.discountPercent > 0 ? "text-green-600" : "text-muted-foreground"}`}>
                        {monthlyWithDiscount.toLocaleString()}
                      </p>
                      {tier.discountPercent > 0 && (
                        <p className="text-[9px] text-green-500">خصم {tier.discountPercent}%</p>
                      )}
                      <p className="text-[9px] text-muted-foreground/60">{totalDays} يوم</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="days">عدد مخصص من الأيام</Label>
            <Input id="days" type="number" min={1} value={activationDays} onChange={(e) => { setActivationDays(Number(e.target.value)); setSelectedDiscountTier(-1); }} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">ملاحظة (اختياري)</Label>
            <Input id="note" value={activationNote} onChange={(e) => setActivationNote(e.target.value)} placeholder="مثال: تم الدفع نقداً" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleActivate} disabled={activateMutation.isPending || activationDays < 1} className="bg-green-600 hover:bg-green-700">
            {activateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <CheckCircle className="w-4 h-4 ml-2" />}
            تفعيل {PLANS[selectedPlan].nameAr} - {activationDays} يوم
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
