import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RefreshCw, Loader2, Crown, Zap, Star } from "lucide-react";
import { PLANS, DISCOUNT_TIERS, getDiscountPrice, type PlanType } from "@/constants";

interface ExtendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: string | null;
  extendDays: number;
  setExtendDays: (v: number) => void;
  selectedPlan: PlanType;
  setSelectedPlan: (v: PlanType) => void;
  selectedDiscountTier: number;
  setSelectedDiscountTier: (v: number) => void;
  extendMutation: { mutate: (args: { userId: string; days: number; plan: PlanType }) => void; isPending: boolean };
}

export default function ExtendDialog({
  open,
  onOpenChange,
  selectedUser,
  extendDays,
  setExtendDays,
  selectedPlan,
  setSelectedPlan,
  selectedDiscountTier,
  setSelectedDiscountTier,
  extendMutation,
}: ExtendDialogProps) {
  const handleExtend = () => {
    if (!selectedUser) return;
    extendMutation.mutate({ userId: selectedUser, days: extendDays, plan: selectedPlan });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><RefreshCw className="w-5 h-5 text-purple-600" />تمديد الاشتراك</DialogTitle>
          <DialogDescription>اختر الباقة والمدة الإضافية مع الخصم</DialogDescription>
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
                        ? p === "pro" ? "border-purple-400 bg-purple-50" : p === "basic" ? "border-blue-400 bg-blue-50" : "border-gray-400 bg-gray-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex justify-center mb-1">
                      {p === "pro" ? <Crown className="w-4 h-4 text-amber-500" /> : p === "basic" ? <Zap className="w-4 h-4 text-blue-500" /> : <Star className="w-4 h-4 text-gray-500" />}
                    </div>
                    <p className={`text-xs font-bold ${isSelected ? (p === "pro" ? "text-purple-700" : p === "basic" ? "text-blue-700" : "text-gray-700") : "text-gray-600"}`}>{plan.nameAr}</p>
                    <p className="text-[10px] text-gray-500">{plan.key === "free" ? "مجاني" : `${plan.monthlyPrice.toLocaleString()} د.ع`}</p>
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
                        setExtendDays(totalDays);
                      }}
                      className={`p-2 rounded-lg border text-center transition-all text-xs ${
                        isSelected ? "border-purple-400 bg-purple-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <p className="font-bold text-gray-700">{tier.label}</p>
                      <p className={`font-bold ${tier.discountPercent > 0 ? "text-green-600" : "text-gray-500"}`}>
                        {monthlyWithDiscount.toLocaleString()}
                      </p>
                      {tier.discountPercent > 0 && (
                        <p className="text-[9px] text-green-500">خصم {tier.discountPercent}%</p>
                      )}
                      <p className="text-[9px] text-gray-400">{totalDays} يوم</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="extendDays">عدد مخصص من الأيام</Label>
            <Input id="extendDays" type="number" min={1} value={extendDays} onChange={(e) => { setExtendDays(Number(e.target.value)); setSelectedDiscountTier(-1); }} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleExtend} disabled={extendMutation.isPending || extendDays < 1} className="bg-purple-600 hover:bg-purple-700">
            {extendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <RefreshCw className="w-4 h-4 ml-2" />}
            تمديد {selectedPlan === "free" ? "مجاني" : `${extendDays} يوم`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
