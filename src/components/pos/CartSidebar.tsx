import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  ShoppingBag, RotateCcw, User2, Percent, Calculator,
  DollarSign, CreditCard, Wallet, Minus, Plus, X,
  Printer, CheckCircle2, Landmark,
} from "lucide-react";
import { formatNumber, formatCurrency } from "@/lib/format";
import type { CartItem, Customer } from "@/types";

interface CartSidebarProps {
  cart: CartItem[];
  selectedCustomer: Customer | null;
  discountType: "none" | "percentage" | "fixed";
  discountValue: number;
  taxEnabled: boolean;
  taxRate: number;
  paymentMethod: "cash" | "card" | "mixed" | "credit";
  paidAmount: number;
  splitCash: number;
  splitCard: number;
  debtDueDate: string;
  subtotal: number;
  totals: { subtotal: number; discountAmount: number; taxAmount: number; total: number };
  isPending: boolean;
  enableCreditSales: boolean;
  className?: string;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onShowDiscount: () => void;
  onShowCustomer: () => void;
  onShowCheckout: () => void;
  onPaymentMethodChange: (method: "cash" | "card" | "mixed" | "credit") => void;
  onPaidAmountChange: (amount: number) => void;
  onSplitCashChange: (amount: number) => void;
  onDebtDueDateChange: (date: string) => void;
  onPrint: () => void;
}

export function CartSidebar({
  cart, selectedCustomer, discountType, discountValue,
  taxEnabled, taxRate, paymentMethod, paidAmount,
  splitCash, splitCard, debtDueDate, subtotal,
  totals, isPending, enableCreditSales, className,
  onUpdateQuantity, onRemoveItem, onClearCart,
  onShowDiscount, onShowCustomer, onShowCheckout,
  onPaymentMethodChange, onPaidAmountChange,
  onSplitCashChange, onDebtDueDateChange, onPrint,
}: CartSidebarProps) {
  const change = paymentMethod === "cash" ? paidAmount - totals.total : 0;
  const itemCount = cart.reduce((c, i) => c + i.quantity, 0);

  return (
    <div className={cn("w-full lg:w-[380px] bg-slate-50/85 backdrop-blur-md border-t lg:border-t-0 lg:border-r border-indigo-100/30 flex flex-col h-full max-h-full min-h-0 shadow-xl lg:shadow-2xl lg:shadow-indigo-900/5 rounded-t-2xl lg:rounded-none", className)}>
      {/* Header */}
      <div className="pb-3.5 border-b border-border/60 shrink-0 px-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex w-9 h-9 rounded-xl bg-primary/10 items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-primary" />
            </div>
            <span className="hidden lg:inline text-sm font-bold text-foreground">سلة المشتريات</span>
            {cart.length > 0 && (
              <Badge variant="secondary" className="text-[11px] font-semibold rounded-full bg-primary/10 text-primary border-primary/20">{itemCount} قطع</Badge>
            )}
          </div>
          {cart.length > 0 && (
            <Button variant="ghost" size="sm" className="text-destructive/80 hover:text-destructive hover:bg-destructive/5 h-8 text-xs rounded-xl font-medium" onClick={onClearCart}>
              <RotateCcw className="w-3.5 h-3.5 ml-1" /> إفراغ
            </Button>
          )}
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-2 mt-3.5 flex-wrap">
          <button
            onClick={onShowCustomer}
            className={cn(
              "flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold border transition-all duration-200 tap-active",
              selectedCustomer
                ? "bg-primary/5 border-primary/30 text-primary hover:bg-primary/10"
                : "border-border/60 text-muted-foreground hover:border-primary/25 hover:text-foreground bg-white"
            )}
          >
            <User2 className="w-3.5 h-3.5" />
            {selectedCustomer ? selectedCustomer.name : "زبون (اختياري)"}
          </button>
          <button
            onClick={onShowDiscount}
            className={cn(
              "flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold border transition-all duration-200 tap-active",
              discountType !== "none"
                ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                : "border-border/60 text-muted-foreground hover:border-amber-300 hover:text-foreground bg-white"
            )}
          >
            <Percent className="w-3.5 h-3.5" />
            {discountType !== "none"
              ? `خصم ${discountType === "percentage" ? `${discountValue}%` : formatCurrency(discountValue)}`
              : "خصم"}
          </button>
          {taxEnabled && taxRate > 0 && (
            <span className="flex items-center gap-1.5 h-7 px-2.5 rounded-xl text-[11px] font-semibold border border-orange-200 bg-orange-50 text-orange-600">
              <Calculator className="w-3 h-3" /> ضريبة {taxRate}%
            </span>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8 opacity-30" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">السلة فارغة</p>
            <p className="text-xs mt-1.5 text-muted-foreground/60">اضغط على منتج لإضافته أو امسح باركود</p>
          </div>
        ) : (
          <div className="space-y-2 py-2">
            {cart.map((item) => (
              <div key={item.id} className="mx-4 p-3 bg-white border border-indigo-50/30 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 group/cart-item relative overflow-hidden">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[13px] text-slate-800 truncate leading-tight group-hover/cart-item:text-primary transition-colors duration-150">{item.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatCurrency(item.price, 2)} / قطعة</p>
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-100 hover:border-primary/30 hover:bg-primary/5 transition-all duration-150 active:scale-90"
                    >
                      <Minus className="w-3 h-3 text-slate-500" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-slate-800 tabular-nums">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-100 hover:border-primary/30 hover:bg-primary/5 transition-all duration-150 active:scale-90"
                    >
                      <Plus className="w-3 h-3 text-slate-500" />
                    </button>
                  </div>
                  <p className="text-[13px] font-black text-primary tabular-nums tracking-tight">
                    {formatNumber(item.price * item.quantity, 2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Totals & Payment */}
      {cart.length > 0 && (
        <div className="border-t border-border/60 p-4 space-y-3.5 shrink-0 bg-muted/30 backdrop-blur-sm">
          {/* Totals */}
          <div className="space-y-1.5 text-[13px]">
            <div className="flex justify-between text-muted-foreground">
              <span>المجموع الفرعي</span>
              <span className="tabular-nums font-medium">{formatCurrency(subtotal, 2)}</span>
            </div>
            {discountType !== "none" && (
              <div className="flex justify-between text-destructive font-semibold">
                <span>الخصم ({discountType === "percentage" ? `${discountValue}%` : "ثابت"})</span>
                <span className="tabular-nums">-{formatCurrency(totals.discountAmount, 2)}</span>
              </div>
            )}
            {taxEnabled && taxRate > 0 && (
              <div className="flex justify-between text-amber-600 font-medium">
                <span>الضريبة ({taxRate}%)</span>
                <span className="tabular-nums">{formatCurrency(totals.taxAmount, 2)}</span>
              </div>
            )}
            <Separator className="my-2 bg-indigo-100/50" />
            <div className="flex justify-between items-center bg-indigo-50/40 p-2.5 rounded-xl border border-indigo-100/30">
              <span className="text-xs font-bold text-slate-600">الإجمالي النهائي</span>
              <span className="text-xl font-black text-primary tabular-nums tracking-tight drop-shadow-[0_2px_4px_rgba(99,102,241,0.08)]">
                {formatCurrency(totals.total, 2)}
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="grid grid-cols-4 gap-1.5">
            {(
              [
                { method: "cash" as const, label: "كاش", icon: <DollarSign className="w-3.5 h-3.5" />, activeClass: "data-[active=true]:bg-emerald-600 data-[active=true]:border-emerald-600 data-[active=true]:text-white data-[active=true]:shadow-emerald-500/20" },
                { method: "card" as const, label: "بطاقة", icon: <CreditCard className="w-3.5 h-3.5" />, activeClass: "data-[active=true]:bg-purple-600 data-[active=true]:border-purple-600 data-[active=true]:text-white data-[active=true]:shadow-purple-500/20" },
                { method: "mixed" as const, label: "مختلط", icon: <Wallet className="w-3.5 h-3.5" />, activeClass: "data-[active=true]:bg-primary data-[active=true]:border-primary data-[active=true]:text-white data-[active=true]:shadow-primary/20" },
                ...(enableCreditSales ? [{ method: "credit" as const, label: "آجل", icon: <Landmark className="w-3.5 h-3.5" />, activeClass: "data-[active=true]:bg-red-600 data-[active=true]:border-red-600 data-[active=true]:text-white data-[active=true]:shadow-red-500/20" }] : []),
              ] as const
            ).map(({ method, label, icon, activeClass }) => (
              <button
                key={method}
                data-active={paymentMethod === method}
                onClick={() => onPaymentMethodChange(method)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 h-14 rounded-xl border text-[10px] font-bold transition-all duration-200",
                  "hover:shadow-md active:scale-95",
                  paymentMethod === method
                    ? activeClass + " shadow-md"
                    : "border-border/60 text-muted-foreground bg-white hover:border-primary/30 hover:bg-muted/50"
                )}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          {/* Cash Payment Input */}
          {paymentMethod === "cash" && (
            <div className="animate-scale-in">
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">المبلغ المدفوع</label>
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    className="text-center font-extrabold text-lg h-12 rounded-xl border-border/60 focus:border-primary tabular-nums"
                    value={paidAmount || ""}
                    onChange={(e) => onPaidAmountChange(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <Button variant="outline" size="sm" className="h-12 px-3.5 text-xs font-bold rounded-xl border-border/60 hover:bg-primary/5 hover:border-primary/30" onClick={() => onPaidAmountChange(totals.total)}>
                  بالضبط
                </Button>
              </div>
              {paidAmount > 0 && change >= 0 && (
                <div className="mt-2.5 text-center">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-extrabold">
                    الباقي: {formatCurrency(change, 2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Mixed Payment */}
          {paymentMethod === "mixed" && (
            <div className="space-y-2.5 animate-scale-in">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">كاش</label>
                  <Input
                    type="number"
                    className="text-center text-sm h-11 rounded-xl border-border/60 tabular-nums"
                    value={splitCash || ""}
                    onChange={(e) => onSplitCashChange(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">بطاقة</label>
                  <Input
                    type="number"
                    className="text-center text-sm h-11 rounded-xl border-border/60 bg-muted/30 tabular-nums"
                    value={splitCard || ""}
                    readOnly
                    placeholder="0"
                  />
                </div>
              </div>
              {(splitCash + splitCard) - totals.total > 0.001 && (
                <div className="text-center">
                  <span className="text-[11px] text-amber-600 font-semibold">
                    المتبقي: {formatCurrency((splitCash + splitCard) - totals.total, 2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Credit Payment */}
          {paymentMethod === "credit" && (
            <div className="space-y-2.5 bg-destructive/5 rounded-2xl p-3.5 border border-destructive/20 animate-scale-in">
              <div className="flex items-center gap-2 text-destructive text-[12px] font-semibold">
                <Landmark className="w-4 h-4" />
                <span>بيع بالآجل - سيتم إنشاء دين للزبون</span>
              </div>
              <label className="text-[11px] font-semibold text-muted-foreground block">تاريخ الاستحقاق</label>
              <Input
                type="date"
                className="text-center text-sm h-11 rounded-xl border-destructive/20"
                value={debtDueDate}
                onChange={(e) => onDebtDueDateChange(e.target.value)}
              />
              {!selectedCustomer && (
                <p className="text-[11px] text-destructive font-semibold">يجب اختيار زبون للبيع بالآجل</p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <Button
              variant="outline"
              size="sm"
              className="border-border/60 hover:bg-muted h-12 rounded-xl text-sm font-bold"
              onClick={onPrint}
            >
              <Printer className="w-4 h-4 ml-1.5" /> طباعة
            </Button>
            <Button
              onClick={onShowCheckout}
              disabled={isPending}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 h-12 rounded-xl text-sm font-extrabold shadow-lg shadow-emerald-500/25 active:scale-[0.97] transition-transform"
            >
              <CheckCircle2 className="w-4 h-4 ml-1.5" />
              {isPending ? "جاري..." : "إتمام البيع"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
