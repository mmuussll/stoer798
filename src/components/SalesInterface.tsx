import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Search, Barcode, ShoppingBag, AlertTriangle, Pause, Play, Hash, X, Landmark, Scan,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import * as productsApi from "@/api/products";
import * as categoriesApi from "@/api/categories";
import * as customersApi from "@/api/customers";
import { CURRENCY } from "@/constants";
import { formatCurrency } from "@/lib/format";
import { printSaleInvoice } from "@/lib/printInvoice";
import { usePOSCart } from "@/hooks/pos/usePOSCart";
import { usePOSOrders } from "@/hooks/pos/usePOSOrders";
import { usePOSSession } from "@/hooks/pos/usePOSSession";
import { usePOSCheckout } from "@/hooks/pos/usePOSCheckout";
import type { HeldOrder } from "@/types";

import { SessionGuard } from "@/components/pos/SessionGuard";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { CartSidebar } from "@/components/pos/CartSidebar";
import { CheckoutDialog } from "@/components/pos/CheckoutDialog";
import { DiscountDialog } from "@/components/pos/DiscountDialog";
import { CustomerSelectDialog } from "@/components/pos/CustomerSelectDialog";
import { FastSaleDialog } from "@/components/pos/FastSaleDialog";
import { HoldOrderDialog } from "@/components/pos/HoldOrderDialog";
import { RecallOrderDialog } from "@/components/pos/RecallOrderDialog";
import { CloseSessionDialog } from "@/components/pos/CloseSessionDialog";
import { BarcodeScannerDialog } from "@/components/pos/BarcodeScannerDialog";

export default function SalesInterface() {
  const { user } = useAuth();
  const { toast } = useToast();

  const cartHook = usePOSCart();
  const ordersHook = usePOSOrders();
  const sessionHook = usePOSSession();
  const checkoutHook = usePOSCheckout();

  const [barcode, setBarcode] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [showClearCartDialog, setShowClearCartDialog] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showHoldDialog, setShowHoldDialog] = useState(false);
  const [showRecallDialog, setShowRecallDialog] = useState(false);

  const [customerSearch, setCustomerSearch] = useState("");

  const [showFastSaleDialog, setShowFastSaleDialog] = useState(false);
  const [fastSaleName, setFastSaleName] = useState("");
  const [fastSalePrice, setFastSalePrice] = useState("");

  const [showScannerDialog, setShowScannerDialog] = useState(false);

  const [showCartMobile, setShowCartMobile] = useState(false);

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products"], queryFn: productsApi.fetchProducts,
    staleTime: 5 * 60_000,
  });
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"], queryFn: categoriesApi.fetchCategories,
    staleTime: 10 * 60_000,
  });

  const { data: searchedCustomers = [] } = useQuery({
    queryKey: ["customer-search", customerSearch],
    queryFn: () => customersApi.searchCustomers(customerSearch),
    enabled: customerSearch.length >= 2,
  });

  const {
    cart, selectedCustomer, setSelectedCustomer,
    discountType, setDiscountType, discountValue, setDiscountValue,
    taxEnabled, taxRate, secondTaxEnabled, secondTaxRate,
    paymentMethod, setPaymentMethod,
    paidAmount, setPaidAmount,
    splitCash, setSplitCash, splitCard,
    debtDueDate, setDebtDueDate,
    settings,
    addToCart, updateQuantity, removeFromCart, clearCart,
    calculateSubtotal, calculateItemsCount,
    totals,
  } = cartHook;

  const {
    heldOrders, holdLabel, setHoldLabel,
    holdOrder, recallOrder, deleteHeldOrder,
  } = ordersHook;

  const {
    activeSession, showSessionDialog, setShowSessionDialog: _setShowSessionDialog,
    openingBalance, setOpeningBalance,
    closingBalance, setClosingBalance,
    showCloseSessionDialog, setShowCloseSessionDialog,
    openSessionMutation, closeSessionMutation,
  } = sessionHook;

  const { checkoutMutation } = checkoutHook;

  // Barcode
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;
    const product = products.find((p) => p.barcode === barcode.trim());
    if (product) { addToCart(product); setBarcode(""); }
    else toast({ title: "المنتج غير موجود", description: "لم يتم العثور على منتج بهذا الباركود", variant: "destructive" });
  };

  const handleCameraScan = (code: string) => {
    const product = products.find((p) => p.barcode === code);
    if (product) {
      addToCart(product);
      toast({ title: "تم مسح الباركود", description: `تمت إضافة: ${product.name}` });
      try { new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gIB/f3+Af39/gIB/f39/gIB/f39/gIB/f3+AgH9/f39/gH9/f4B/f3+AgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=").play().catch(() => {}); } catch { /* ignore */ }
    } else {
      toast({ title: "المنتج غير موجود", description: `لم يتم العثور على منتج بالباركود: ${code}`, variant: "destructive" });
    }
  };

  // Fast sale
  const addFastSale = () => {
    if (!fastSaleName.trim() || !fastSalePrice || parseFloat(fastSalePrice) <= 0) {
      toast({ title: "بيانات غير صحيحة", description: "يرجى إدخال اسم وسعر صحيح", variant: "destructive" });
      return;
    }
    cartHook.cart.push({ id: `fast-${Date.now()}`, name: fastSaleName.trim(), price: parseFloat(fastSalePrice), quantity: 1 });
    setFastSaleName(""); setFastSalePrice(""); setShowFastSaleDialog(false);
  };

  // Hold / Recall
  const doHoldOrder = () => {
    if (holdOrder(cart, calculateItemsCount())) {
      clearCart(); setShowHoldDialog(false);
    }
  };

  const doRecallOrder = (order: HeldOrder) => {
    const recalledCart = recallOrder(order);
    if (recalledCart) {
      cartHook.setCart(recalledCart);
      setShowRecallDialog(false);
    }
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.key === "F2" && cart.length > 0) setShowCheckoutDialog(true);
    if (e.ctrlKey && e.key === "h") { e.preventDefault(); setShowHoldDialog(true); }
    if (e.ctrlKey && e.key === "r") { e.preventDefault(); setShowRecallDialog(true); }
    if (e.ctrlKey && e.key === "d") { e.preventDefault(); setShowDiscountDialog(true); }
    if (e.ctrlKey && e.key === "c") { e.preventDefault(); if (cart.length > 0) setShowClearCartDialog(true); }
    if (e.key === "F4") { e.preventDefault(); setShowFastSaleDialog(true); }
    if (e.key === "F1") { e.preventDefault(); document.querySelector<HTMLInputElement>('input[placeholder*="باركود"]')?.focus(); }
  }, [cart.length]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleReset = () => {
    clearCart(); setShowCheckoutDialog(false); setSelectedCustomer(null);
    setDiscountType("none"); setDiscountValue(0);
    setPaymentMethod("cash"); setPaidAmount(0); setSplitCash(0); setSplitCard(0); setBarcode("");
    setDebtDueDate("");
  };

  const handleCheckout = () => {
    if (cart.length === 0) { toast({ title: "السلة فارغة" }); return; }
    if (paymentMethod === "cash" && paidAmount <= 0) setPaidAmount(totals.total);
    if (paymentMethod === "credit" && !selectedCustomer) {
      toast({ title: "الرجاء اختيار زبون", description: "يجب اختيار زبون للبيع بالآجل", variant: "destructive" });
      return;
    }
    setShowCheckoutDialog(true);
  };

  const handlePrintPreview = () => {
    const { subtotal, discountAmount, taxAmount } = totals;
    const previewInvoice = {
      id: "preview", invoice_number: "معاينة",
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
      subtotal, discount_total: discountAmount, discount_type: discountType, discount_value: discountValue,
      tax_rate: taxEnabled ? taxRate : 0, tax_total: taxAmount, total: totals.total,
      payment_method: paymentMethod, paid_amount: paidAmount,
      change_amount: paymentMethod === "cash" ? paidAmount - totals.total : 0,
      cashier: user?.email || "البائع",
      items: cart.map((i) => ({ ...i, quantity: i.quantity, invoice_id: "preview" })),
    };
    printSaleInvoice(previewInvoice);
  };

  // Session guard
  if (!activeSession && !showSessionDialog && user) {
    return (
      <SessionGuard
        openingBalance={openingBalance}
        setOpeningBalance={setOpeningBalance}
        onOpenSession={() => openSessionMutation.mutate()}
        isLoading={openSessionMutation.isPending}
      />
    );
  }

  const cartSidebarProps = {
    cart,
    selectedCustomer,
    discountType, discountValue,
    taxEnabled, taxRate,
    paymentMethod, paidAmount,
    splitCash, splitCard,
    debtDueDate,
    subtotal: calculateSubtotal(),
    totals,
    isPending: checkoutMutation.isPending,
    enableCreditSales: settings?.enable_credit_sales !== false,
    onUpdateQuantity: (id: string, qty: number) => updateQuantity(id, qty, products),
    onRemoveItem: removeFromCart,
    onClearCart: () => setShowClearCartDialog(true),
    onShowDiscount: () => setShowDiscountDialog(true),
    onShowCustomer: () => setShowCustomerDialog(true),
    onShowCheckout: handleCheckout,
    onPaymentMethodChange: setPaymentMethod,
    onPaidAmountChange: setPaidAmount,
    onSplitCashChange: setSplitCash,
    onDebtDueDateChange: setDebtDueDate,
    onPrint: handlePrintPreview,
  };

  const checkoutParams = {
    cart, selectedCustomer,
    discountType, discountValue,
    taxEnabled, taxRate,
    secondTaxEnabled, secondTaxRate,
    paymentMethod, paidAmount,
    splitCash, splitCard,
    debtDueDate,
    totals,
    settings,
    activeSession: activeSession ? {
      id: activeSession.id, total_sales: activeSession.total_sales,
      total_cash: activeSession.total_cash, total_card: activeSession.total_card,
      total_returns: activeSession.total_returns, invoice_count: activeSession.invoice_count,
    } : null,
    onReset: handleReset,
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-0" dir="rtl">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Top bar */}
        <div className="p-2 lg:p-3 border-b border-slate-200/70 bg-white/90 backdrop-blur-sm space-y-2">
          <div className="flex gap-2 items-center">
            <form onSubmit={handleBarcodeSubmit} className="flex gap-2 flex-1">
              <div className="relative flex-1">
                <Barcode className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input value={barcode} onChange={(e) => setBarcode(e.target.value)}
                  placeholder="امسح الباركود أو اكتبه (F1)..." className="pr-10 text-center font-mono" autoFocus dir="ltr" />
              </div>
              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 px-3">إضافة</Button>
            </form>
            <Button
              variant="outline" size="sm"
              onClick={() => setShowScannerDialog(true)}
              className="gap-1 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              title="مسح الباركود بالكاميرا"
            >
              <Scan className="w-4 h-4" /> مسح
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowFastSaleDialog(true)} title="بيع سريع (F4)" className="gap-1">
              <Hash className="w-3.5 h-3.5" /> سريع
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowHoldDialog(true)} title="تعليق (Ctrl+H)" className="gap-1">
              <Pause className="w-3.5 h-3.5" /> تعليق
            </Button>
            {heldOrders.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setShowRecallDialog(true)} title="استرجاع (Ctrl+R)" className="gap-1 relative">
                <Play className="w-3.5 h-3.5" /> استرجاع
                <Badge variant="destructive" className="absolute -top-1 -end-1 h-4 w-4 p-0 flex items-center justify-center text-xs">{heldOrders.length}</Badge>
              </Button>
            )}
            {activeSession && (
              <Button variant="outline" size="sm"
                className="hidden lg:inline-flex gap-1 border-red-300 text-red-600 hover:bg-red-50 ml-auto"
                onClick={() => {
                  setClosingBalance(activeSession.total_cash.toFixed(0));
                  setShowCloseSessionDialog(true);
                }}>
                <Landmark className="w-3.5 h-3.5" /> إقفال الجلسة
              </Button>
            )}
          </div>
        </div>

        {/* Search + Category filter */}
        <div className="p-2 lg:p-3 space-y-2 border-b border-slate-200/70 bg-slate-50/70 backdrop-blur-sm">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث عن المنتجات أو الباركود..." className="pr-10" />
          </div>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-1.5 pb-1">
              <Button variant={selectedCategory === "all" ? "default" : "outline"} size="sm"
                onClick={() => setSelectedCategory("all")}
                className={selectedCategory === "all" ? "bg-blue-600 hover:bg-blue-700" : ""}>الكل</Button>
              {categoriesLoading
                ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-16" />)
                : categories.map((cat) => (
                  <Button key={cat.id} variant={selectedCategory === cat.id ? "default" : "outline"} size="sm"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={selectedCategory === cat.id ? "text-white hover:opacity-90" : ""}
                    style={selectedCategory === cat.id ? { backgroundColor: cat.color } : undefined}>{cat.name}</Button>
                ))}
            </div>
          </ScrollArea>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto">
          <ProductGrid
            products={products}
            loading={productsLoading}
            searchTerm={searchTerm}
            selectedCategory={selectedCategory}
            cart={cart}
            lowStockAlert={settings?.low_stock_alert || 5}
            onAddToCart={addToCart}
          />
        </div>

        {/* Mobile: floating cart button */}
        <div className="lg:hidden fixed bottom-[72px] inset-x-0 z-40 flex flex-col gap-2 px-3" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          {activeSession && (
            <Button variant="outline" size="sm" className="w-full border-red-200/70 text-red-600 hover:bg-red-50/80 bg-white/90 backdrop-blur-sm shadow-sm rounded-xl h-10 text-xs font-medium"
              onClick={() => {
                setClosingBalance(activeSession.total_cash.toFixed(0));
                setShowCloseSessionDialog(true);
              }}>
              <Landmark className="w-3.5 h-3.5 ml-1.5" />
              إقفال الجلسة
            </Button>
          )}
          <Button onClick={() => setShowCartMobile(!showCartMobile)} className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg shadow-indigo-500/25 rounded-xl h-12 text-sm font-semibold tracking-wide active:scale-[0.98] transition-transform">
            <ShoppingBag className="w-5 h-5 ml-2" />
            {cart.length > 0 ? `السلة (${calculateItemsCount()} قطعة - ${formatCurrency(totals.total, 2)})` : "عرض السلة"}
          </Button>
        </div>
      </div>

      {/* Cart - Desktop sidebar */}
      <div className="hidden lg:flex lg:max-h-none">
        <CartSidebar {...cartSidebarProps} />
      </div>

      {/* Mobile Cart Bottom Sheet */}
      {showCartMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => setShowCartMobile(false)} />
          <div className="relative bg-white rounded-t-2xl max-h-[85vh] flex flex-col animate-slide-up shadow-2xl shadow-black/20" style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)" }}>
            <div className="flex items-center justify-between p-3.5 border-b border-slate-100 shrink-0">
              <h3 className="text-sm font-bold text-slate-800">سلة المشتريات</h3>
              <button onClick={() => setShowCartMobile(false)} className="p-1.5 rounded-full hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <CartSidebar {...cartSidebarProps} />
            </div>
          </div>
        </div>
      )}

      {/* === DIALOGS === */}
      <CheckoutDialog
        open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}
        cart={cart} selectedCustomer={selectedCustomer}
        discountType={discountType} discountAmount={totals.discountAmount}
        taxEnabled={taxEnabled} taxRate={taxRate} taxAmount={totals.taxAmount}
        total={totals.total} paymentMethod={paymentMethod}
        paidAmount={paidAmount}
        change={paymentMethod === "cash" ? paidAmount - totals.total : 0}
        isPending={checkoutMutation.isPending}
        isCredit={paymentMethod === "credit"}
        debtDueDate={debtDueDate}
        onConfirm={() => checkoutMutation.mutate(checkoutParams)}
      />

      <Dialog open={showClearCartDialog} onOpenChange={setShowClearCartDialog}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="w-5 h-5" />إفراغ السلة</DialogTitle>
            <DialogDescription>هل أنت متأكد من إفراغ سلة المشتريات؟ سيتم حذف جميع المنتجات المختارة.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowClearCartDialog(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={() => { clearCart(); setShowClearCartDialog(false); }}>إفراغ السلة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DiscountDialog
        open={showDiscountDialog} onOpenChange={setShowDiscountDialog}
        discountType={discountType} discountValue={discountValue}
        discountAmount={totals.discountAmount}
        onDiscountTypeChange={setDiscountType}
        onDiscountValueChange={setDiscountValue}
      />

      <CustomerSelectDialog
        open={showCustomerDialog} onOpenChange={setShowCustomerDialog}
        searchTerm={customerSearch} onSearchChange={setCustomerSearch}
        searchedCustomers={searchedCustomers}
        selectedCustomer={selectedCustomer}
        onSelectCustomer={setSelectedCustomer}
      />

      <FastSaleDialog
        open={showFastSaleDialog} onOpenChange={setShowFastSaleDialog}
        name={fastSaleName} onNameChange={setFastSaleName}
        price={fastSalePrice} onPriceChange={setFastSalePrice}
        onAdd={addFastSale}
      />

      <HoldOrderDialog
        open={showHoldDialog} onOpenChange={setShowHoldDialog}
        holdLabel={holdLabel} onHoldLabelChange={setHoldLabel}
        cart={cart} itemCount={calculateItemsCount()} total={totals.total}
        orderCount={heldOrders.length} onHold={doHoldOrder}
      />

      <RecallOrderDialog
        open={showRecallDialog} onOpenChange={setShowRecallDialog}
        heldOrders={heldOrders} onRecall={doRecallOrder} onDelete={deleteHeldOrder}
      />

      <CloseSessionDialog
        open={showCloseSessionDialog} onOpenChange={setShowCloseSessionDialog}
        session={activeSession} closingBalance={closingBalance}
        onClosingBalanceChange={setClosingBalance}
        onConfirm={() => closeSessionMutation.mutate()}
        isPending={closeSessionMutation.isPending}
      />

      <BarcodeScannerDialog
        open={showScannerDialog}
        onOpenChange={setShowScannerDialog}
        onScan={handleCameraScan}
      />
    </div>
  );
}
