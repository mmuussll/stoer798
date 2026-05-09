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
import { CURRENCY } from "@/constants";
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
  cart,
  selectedCustomer,
  discountType,
  discountValue,
  taxEnabled,
  taxRate,
  paymentMethod,
  paidAmount,
  splitCash,
  splitCard,
  debtDueDate,
  subtotal,
  totals,
  isPending,
  enableCreditSales,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onShowDiscount,
  onShowCustomer,
  onShowCheckout,
  onPaymentMethodChange,
  onPaidAmountChange,
  onSplitCashChange,
  onDebtDueDateChange,
  onPrint,
}: CartSidebarProps) {
  const change = paymentMethod === "cash" ? paidAmount - totals.total : 0;
  const itemCount = cart.reduce((c, i) => c + i.quantity, 0);

  return (
    <div className="w-full lg:w-[380px] bg-white border-t lg:border-t-0 lg:border-r border-slate-200/70 flex flex-col shadow-lg lg:shadow-xl">
      {/* Header */}
      <div className="pb-3 border-b border-slate-100 shrink-0 px-4 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-sm font-bold text-slate-800">سلة المشتريات</span>
            {cart.length > 0 && (
              <Badge variant="secondary" className="text-[11px] font-medium">{itemCount}</Badge>
            )}
          </div>
          {cart.length > 0 && (
            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 text-xs rounded-lg" onClick={onClearCart}>
              <RotateCcw className="w-3 h-3 ml-1" /> إفراغ
            </Button>
          )}
        </div>

        {/* Customer + Discount + Tax badges */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <button
            onClick={onShowCustomer}
            className={cn(
              "flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium border transition-all duration-150",
              selectedCustomer
                ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 bg-white"
            )}
          >
            <User2 className="w-3 h-3" />
            {selectedCustomer ? selectedCustomer.name : "زبون (اختياري)"}
          </button>
          <button
            onClick={onShowDiscount}
            className={cn(
              "flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium border transition-all duration-150",
              discountType !== "none"
                ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 bg-white"
            )}
          >
            <Percent className="w-3 h-3" />
            {discountType !== "none"
              ? `${discountType === "percentage" ? `${discountValue}%` : `${discountValue.toFixed(2)} ${CURRENCY}`}`
              : "خصم"}
          </button>
          {taxEnabled && taxRate > 0 && (
            <span className="flex items-center gap-1 h-7 px-2 rounded-lg text-[11px] font-medium border border-orange-200 bg-orange-50 text-orange-600">
              <Calculator className="w-3 h-3" /> ضريبة {taxRate}%
            </span>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
              <ShoppingBag className="w-7 h-7 opacity-40" />
            </div>
            <p className="text-sm font-medium text-slate-500">السلة فارغة</p>
            <p className="text-xs mt-1 text-slate-400">اضغط على منتج لإضافته أو امسح باركود</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {cart.map((item) => (
              <div key={item.id} className="px-4 py-2.5 hover:bg-slate-50/80 transition-colors duration-150">
                <div className="flex items-start justify-between gap-1 mb-1.5">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-[13px] text-slate-800 truncate leading-tight">{item.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.price.toFixed(2)} {CURRENCY} / قطعة</p>
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-150 active:scale-95"
                    >
                      <Minus className="w-3 h-3 text-slate-500" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-slate-700 tabular-nums">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-150 active:scale-95"
                    >
                      <Plus className="w-3 h-3 text-slate-500" />
                    </button>
                  </div>
                  <p className="text-sm font-bold text-indigo-600 tabular-nums">
                    {(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Totals & Payment */}
      {cart.length > 0 && (
        <div className="border-t border-slate-200/70 p-4 space-y-3 shrink-0 bg-slate-50/80 backdrop-blur-sm">
          {/* Totals */}
          <div className="space-y-1 text-[13px]">
            <div className="flex justify-between text-slate-500">
              <span>المجموع الفرعي</span>
              <span className="tabular-nums">{subtotal.toFixed(2)} {CURRENCY}</span>
            </div>
            {discountType !== "none" && (
              <div className="flex justify-between text-rose-500 font-medium">
                <span>الخصم ({discountType === "percentage" ? `${discountValue}%` : "ثابت"})</span>
                <span className="tabular-nums">-{totals.discountAmount.toFixed(2)} {CURRENCY}</span>
              </div>
            )}
            {taxEnabled && taxRate > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>الضريبة ({taxRate}%)</span>
                <span className="tabular-nums">{totals.taxAmount.toFixed(2)} {CURRENCY}</span>
              </div>
            )}
            <Separator className="my-1.5" />
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-800">الإجمالي</span>
              <span className="text-lg font-bold text-indigo-600 tabular-nums tracking-tight">
                {totals.total.toFixed(2)} {CURRENCY}
              </span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="grid grid-cols-4 gap-1.5">
            {(
              [
                { method: "cash" as const, label: "كاش", icon: <DollarSign className="w-3.5 h-3.5" />, color: "border-emerald-300 data-[active=true]:bg-emerald-600 data-[active=true]:border-emerald-600 data-[active=true]:text-white" },
                { method: "card" as const, label: "بطاقة", icon: <CreditCard className="w-3.5 h-3.5" />, color: "border-purple-300 data-[active=true]:bg-purple-600 data-[active=true]:border-purple-600 data-[active=true]:text-white" },
                { method: "mixed" as const, label: "مختلط", icon: <Wallet className="w-3.5 h-3.5" />, color: "border-indigo-300 data-[active=true]:bg-indigo-600 data-[active=true]:border-indigo-600 data-[active=true]:text-white" },
                ...(enableCreditSales ? [{ method: "credit" as const, label: "آجل", icon: <Landmark className="w-3.5 h-3.5" />, color: "border-red-300 data-[active=true]:bg-red-600 data-[active=true]:border-red-600 data-[active=true]:text-white" }] : []),
              ] as const
            ).map(({ method, label, icon, color }) => (
              <button
                key={method}
                data-active={paymentMethod === method}
                onClick={() => onPaymentMethodChange(method)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 h-14 rounded-xl border text-[10px] font-medium transition-all duration-150",
                  "hover:shadow-sm active:scale-95",
                  paymentMethod === method ? color + " shadow-sm" : "border-slate-200 text-slate-500 bg-white hover:border-slate-300"
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
              <label className="text-xs font-medium text-slate-600 mb-1 block">المبلغ المدفوع</label>
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    className="text-center font-bold text-lg h-11 rounded-xl border-slate-200 focus:border-indigo-400 tabular-nums"
                    value={paidAmount || ""}
                    onChange={(e) => onPaidAmountChange(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <Button variant="outline" size="sm" className="h-11 px-3 text-xs font-medium rounded-xl border-slate-200 hover:bg-indigo-50 hover:border-indigo-200" onClick={() => onPaidAmountChange(totals.total)}>
                  بالضبط
                </Button>
              </div>
              {paidAmount > 0 && change >= 0 && (
                <div className="mt-2 text-center">
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold">
                    الباقي: {change.toFixed(2)} {CURRENCY}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Mixed Payment Input */}
          {paymentMethod === "mixed" && (
            <div className="space-y-2 animate-scale-in">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-0.5">كاش</label>
                  <Input
                    type="number"
                    className="text-center text-sm h-10 rounded-xl border-slate-200 tabular-nums"
                    value={splitCash || ""}
                    onChange={(e) => onSplitCashChange(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-0.5">بطاقة</label>
                  <Input
                    type="number"
                    className="text-center text-sm h-10 rounded-xl border-slate-200 bg-slate-50 tabular-nums"
                    value={splitCard || ""}
                    readOnly
                    placeholder="0"
                  />
                </div>
              </div>
              {(splitCash + splitCard) - totals.total > 0.001 && (
                <div className="text-center">
                  <span className="text-[11px] text-amber-600 font-medium">
                    المتبقي: {((splitCash + splitCard) - totals.total).toFixed(2)} {CURRENCY}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Credit Payment Info */}
          {paymentMethod === "credit" && (
            <div className="space-y-2 bg-red-50/80 rounded-xl p-3 border border-red-200/70 animate-scale-in">
              <div className="flex items-center gap-1.5 text-red-700 text-[12px] font-medium">
                <Landmark className="w-3.5 h-3.5" />
                <span>بيع بالآجل - سيتم إنشاء دين للزبون</span>
              </div>
              <label className="text-[11px] font-medium text-slate-600 block">تاريخ الاستحقاق</label>
              <Input
                type="date"
                className="text-center text-sm h-10 rounded-xl border-red-200/70"
                value={debtDueDate}
                onChange={(e) => onDebtDueDateChange(e.target.value)}
              />
              {!selectedCustomer && (
                <p className="text-[11px] text-red-500 font-medium">يجب اختيار زبون للبيع بالآجل</p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-200 hover:bg-slate-100 h-11 rounded-xl text-xs font-medium"
              onClick={onPrint}
            >
              <Printer className="w-4 h-4 ml-1.5" /> طباعة
            </Button>
            <Button
              onClick={onShowCheckout}
              disabled={isPending}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 h-11 rounded-xl text-sm font-bold shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-transform"
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