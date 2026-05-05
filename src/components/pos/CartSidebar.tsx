import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingBag, RotateCcw, User2, Percent, Calculator,
  DollarSign, CreditCard, Wallet, Minus, Plus, X,
  Printer, CheckCircle2,
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
  paymentMethod: "cash" | "card" | "mixed";
  paidAmount: number;
  splitCash: number;
  splitCard: number;
  subtotal: number;
  totals: { subtotal: number; discountAmount: number; taxAmount: number; total: number };
  isPending: boolean;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onShowDiscount: () => void;
  onShowCustomer: () => void;
  onShowCheckout: () => void;
  onPaymentMethodChange: (method: "cash" | "card" | "mixed") => void;
  onPaidAmountChange: (amount: number) => void;
  onSplitCashChange: (amount: number) => void;
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
  subtotal,
  totals,
  isPending,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onShowDiscount,
  onShowCustomer,
  onShowCheckout,
  onPaymentMethodChange,
  onPaidAmountChange,
  onSplitCashChange,
  onPrint,
}: CartSidebarProps) {
  const change = paymentMethod === "cash" ? paidAmount - totals.total : 0;
  const itemCount = cart.reduce((c, i) => c + i.quantity, 0);

  return (
    <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-r flex flex-col">
      <CardHeader className="pb-2 border-b shrink-0 px-3 py-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ShoppingBag className="w-4 h-4 text-blue-600" />
            سلة المشتريات
            {cart.length > 0 && <Badge variant="secondary" className="text-[10px]">{itemCount} قطعة</Badge>}
          </CardTitle>
          <div className="flex items-center gap-1">
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 text-xs" onClick={onClearCart}>
                <RotateCcw className="w-3 h-3 ml-1" /> إفراغ
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Button
            variant={selectedCustomer ? "default" : "outline"}
            size="sm"
            className={`h-7 text-xs gap-1 ${selectedCustomer ? "bg-blue-600" : ""}`}
            onClick={onShowCustomer}
          >
            <User2 className="w-3 h-3" />
            {selectedCustomer ? selectedCustomer.name : "زبون (اختياري)"}
          </Button>
          <Button
            variant={discountType !== "none" ? "default" : "outline"}
            size="sm"
            className={`h-7 text-xs gap-1 ${discountType !== "none" ? "bg-amber-500 hover:bg-amber-600" : ""}`}
            onClick={onShowDiscount}
          >
            <Percent className="w-3 h-3" />
            {discountType !== "none" ? `خصم ${discountType === "percentage" ? `${discountValue}%` : `${discountValue.toFixed(2)} ${CURRENCY}`}` : "خصم"}
          </Button>
          {taxEnabled && taxRate > 0 && (
            <Badge variant="outline" className="text-[10px] border-orange-300 text-orange-600">
              <Calculator className="w-2.5 h-2.5 ml-0.5" /> ضريبة {taxRate}%
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-0">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-36 text-gray-400 p-4">
            <ShoppingBag className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm font-medium">السلة فارغة</p>
            <p className="text-xs mt-1">اضغط على منتج لإضافته أو امسح باركود</p>
          </div>
        ) : (
          <div className="divide-y">
            {cart.map((item) => (
              <div key={item.id} className="px-3 py-2 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-1 mb-1">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-xs text-gray-800 truncate">{item.name}</h4>
                    <p className="text-[10px] text-gray-500">{item.price.toFixed(2)} {CURRENCY} / قطعة</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0" onClick={() => onRemoveItem(item.id)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5">
                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}><Minus className="w-2.5 h-2.5" /></Button>
                    <span className="w-7 text-center text-xs font-semibold">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}><Plus className="w-2.5 h-2.5" /></Button>
                  </div>
                  <p className="text-sm font-bold text-blue-600">{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {cart.length > 0 && (
        <div className="border-t p-3 space-y-2 shrink-0 bg-gray-50">
          <div className="space-y-0.5 text-xs">
            <div className="flex justify-between text-gray-600"><span>المجموع الفرعي:</span><span>{subtotal.toFixed(2)} {CURRENCY}</span></div>
            {discountType !== "none" && (
              <div className="flex justify-between text-red-500">
                <span>الخصم ({discountType === "percentage" ? `${discountValue}%` : "ثابت"}):</span>
                <span>-{totals.discountAmount.toFixed(2)} {CURRENCY}</span>
              </div>
            )}
            {taxEnabled && taxRate > 0 && (
              <div className="flex justify-between text-orange-500">
                <span>الضريبة ({taxRate}%):</span>
                <span>{totals.taxAmount.toFixed(2)} {CURRENCY}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold">الإجمالي:</span>
              <span className="text-lg font-bold text-blue-600">{totals.total.toFixed(2)} {CURRENCY}</span>
            </div>
          </div>

          <div className="flex gap-1.5">
            {(["cash", "card", "mixed"] as const).map((method) => {
              const icons: Record<string, React.ReactNode> = { cash: <DollarSign className="w-3 h-3" />, card: <CreditCard className="w-3 h-3" />, mixed: <Wallet className="w-3 h-3" /> };
              const labels: Record<string, string> = { cash: "كاش", card: "بطاقة", mixed: "مختلط" };
              const colors: Record<string, string> = { cash: "bg-emerald-600", card: "bg-purple-600", mixed: "bg-indigo-600" };
              return (
                <Button
                  key={method}
                  variant={paymentMethod === method ? "default" : "outline"}
                  size="sm"
                  className={`flex-1 h-8 text-xs gap-1 ${paymentMethod === method ? colors[method] : ""}`}
                  onClick={() => onPaymentMethodChange(method)}
                >
                  {icons[method]} {labels[method]}
                </Button>
              );
            })}
          </div>

          {paymentMethod === "cash" && (
            <div>
              <label className="text-xs text-gray-600 mb-1 block">المبلغ المدفوع</label>
              <div className="flex gap-1">
                <Input type="number" className="flex-1 text-center font-bold text-lg" value={paidAmount || ""}
                  onChange={(e) => onPaidAmountChange(parseFloat(e.target.value) || 0)} placeholder="0" />
                <Button variant="outline" size="sm" className="text-xs" onClick={() => onPaidAmountChange(totals.total)}>بالضبط</Button>
              </div>
              {paidAmount > 0 && change >= 0 && (
                <div className="mt-1 text-center">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-sm px-3 py-1">
                    الباقي: {change.toFixed(2)} {CURRENCY}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {paymentMethod === "mixed" && (
            <div className="space-y-1">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-gray-500 block mb-0.5">كاش</label>
                  <Input type="number" className="text-center text-sm" value={splitCash || ""}
                    onChange={(e) => onSplitCashChange(parseFloat(e.target.value) || 0)} placeholder="0" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-gray-500 block mb-0.5">بطاقة</label>
                  <Input type="number" className="text-center text-sm" value={splitCard || ""} readOnly placeholder="0" />
                </div>
              </div>
              {(splitCash + splitCard) - totals.total > 0 && (
                <div className="text-center">
                  <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">المتبقي: {((splitCash + splitCard) - totals.total).toFixed(2)} {CURRENCY}</Badge>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-1.5">
            <Button variant="outline" size="sm" className="border-gray-300 hover:bg-gray-100" onClick={onPrint}>
              <Printer className="w-3.5 h-3.5 ml-1" /> طباعة
            </Button>
            <Button onClick={onShowCheckout} disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 ml-1" />
              {isPending ? "جاري..." : "إتمام البيع (F2)"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
