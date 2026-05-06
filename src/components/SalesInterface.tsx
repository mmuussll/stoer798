import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Search, Barcode, Plus, ShoppingBag, AlertTriangle, Pause, Play, Hash, X, Landmark,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as productsApi from "@/api/products";
import * as categoriesApi from "@/api/categories";
import * as salesApi from "@/api/sales";
import * as customersApi from "@/api/customers";
import * as sessionsApi from "@/api/sessions";
import * as settingsApi from "@/api/settings";
import * as debtsApi from "@/api/debts";
import { CURRENCY } from "@/constants";
import { printSaleInvoice, setPrintSettings } from "@/lib/printInvoice";
import { useAuth } from "@/contexts/AuthContext";
import type { Product, CartItem, Category, Customer, HeldOrder, CashSession, StoreSettings } from "@/types";

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

const HELD_ORDERS_KEY = "pos-held-orders";

function loadHeldOrders(): HeldOrder[] {
  try {
    const data = localStorage.getItem(HELD_ORDERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveHeldOrders(orders: HeldOrder[]) {
  localStorage.setItem(HELD_ORDERS_KEY, JSON.stringify(orders));
}

export default function SalesInterface() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Core state
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Discount & Tax
  const [discountType, setDiscountType] = useState<"none" | "percentage" | "fixed">("none");
  const [discountValue, setDiscountValue] = useState(0);
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState(0);
  const [secondTaxEnabled, setSecondTaxEnabled] = useState(false);
  const [secondTaxRate, setSecondTaxRate] = useState(0);

  // Dialog states
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [showClearCartDialog, setShowClearCartDialog] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showHoldDialog, setShowHoldDialog] = useState(false);
  const [showRecallDialog, setShowRecallDialog] = useState(false);

  // Customer
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "mixed" | "credit">("cash");
  const [paidAmount, setPaidAmount] = useState(0);
  const [splitCash, setSplitCash] = useState(0);
  const [splitCard, setSplitCard] = useState(0);
  const [debtDueDate, setDebtDueDate] = useState("");

  // Held orders
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(loadHeldOrders());
  const [holdLabel, setHoldLabel] = useState("");

  // Session
  const [activeSession, setActiveSession] = useState<CashSession | null>(null);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [openingBalance, setOpeningBalance] = useState("0");
  const [closingBalance, setClosingBalance] = useState("0");
  const [showCloseSessionDialog, setShowCloseSessionDialog] = useState(false);

  // Settings
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  // Fast sale
  const [showFastSaleDialog, setShowFastSaleDialog] = useState(false);
  const [fastSaleName, setFastSaleName] = useState("");
  const [fastSalePrice, setFastSalePrice] = useState("");

  // Mobile cart toggle
  const [showCartMobile, setShowCartMobile] = useState(false);

  // Data queries
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products"], queryFn: productsApi.fetchProducts,
  });
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"], queryFn: categoriesApi.fetchCategories,
  });

  useEffect(() => {
    settingsApi.fetchSettings().then((s) => {
      setSettings(s);
      setTaxEnabled(s.tax_enabled);
      setTaxRate(s.tax_rate);
      setSecondTaxEnabled(s.second_tax_enabled);
      setSecondTaxRate(s.second_tax_rate);
      setPaymentMethod(s.default_payment_method as "cash" | "card" | "mixed" | "credit");
      setPrintSettings(s);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (user?.id) {
      sessionsApi.getActiveSession(user.id).then(setActiveSession).catch(() => {});
    }
  }, [user?.id]);

  // === Calculations ===
  const calculateSubtotal = () => cart.reduce((t, i) => t + i.price * i.quantity, 0);
  const calculateItemsCount = () => cart.reduce((c, i) => c + i.quantity, 0);

  const calculateTotals = () => {
    const subtotal = calculateSubtotal();
    let discountAmount = 0;
    if (discountType === "percentage") discountAmount = subtotal * (discountValue / 100);
    else if (discountType === "fixed") discountAmount = Math.min(discountValue, subtotal);
    const afterDiscount = subtotal - discountAmount;
    let taxAmount = 0;
    if (taxEnabled && taxRate > 0) taxAmount = afterDiscount * (taxRate / 100);
    let secondTaxAmount = 0;
    if (secondTaxEnabled && secondTaxRate > 0) secondTaxAmount = afterDiscount * (secondTaxRate / 100);
    const total = afterDiscount + taxAmount + secondTaxAmount;
    return { subtotal, discountAmount, taxAmount, secondTaxAmount, total };
  };

  const totals = calculateTotals();

  // Auto split card
  useEffect(() => {
    if (paymentMethod === "mixed") setSplitCard(Math.max(0, totals.total - splitCash));
  }, [splitCash, totals.total, paymentMethod]);

  // Auto set paidAmount for credit (full amount as debt)
  useEffect(() => {
    if (paymentMethod === "credit") setPaidAmount(0);
  }, [paymentMethod]);

  // === Cart operations ===
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast({ title: "المنتج غير متوفر", description: `نفذ مخزون ${product.name}`, variant: "destructive" });
      return;
    }
    const existing = cart.find((item) => item.id === product.id);
    const currentQty = existing ? existing.quantity : 0;
    if (currentQty >= product.stock) {
      toast({ title: "الكمية غير متوفرة", description: `المتوفر: ${product.stock} قطعة`, variant: "destructive" });
      return;
    }
    if (existing) {
      setCart(cart.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { id: product.id, name: product.name, price: product.price, quantity: 1, barcode: product.barcode }]);
    }
  };

  const updateQuantity = (id: string, newQty: number) => {
    const product = products.find((p) => p.id === id);
    if (product && newQty > product.stock) {
      toast({ title: "الكمية غير متوفرة", description: `المتوفر: ${product.stock} قطعة`, variant: "destructive" });
      return;
    }
    if (newQty <= 0) setCart(cart.filter((item) => item.id !== id));
    else setCart(cart.map((item) => item.id === id ? { ...item, quantity: newQty } : item));
  };

  const removeFromCart = (id: string) => setCart(cart.filter((item) => item.id !== id));

  const clearCart = () => { setCart([]); setShowClearCartDialog(false); };

  // === Barcode ===
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;
    const product = products.find((p) => p.barcode === barcode.trim());
    if (product) { addToCart(product); setBarcode(""); }
    else toast({ title: "المنتج غير موجود", description: "لم يتم العثور على منتج بهذا الباركود", variant: "destructive" });
  };

  // === Fast sale ===
  const addFastSale = () => {
    if (!fastSaleName.trim() || !fastSalePrice || parseFloat(fastSalePrice) <= 0) {
      toast({ title: "بيانات غير صحيحة", description: "يرجى إدخال اسم وسعر صحيح", variant: "destructive" });
      return;
    }
    setCart([...cart, { id: `fast-${Date.now()}`, name: fastSaleName.trim(), price: parseFloat(fastSalePrice), quantity: 1 }]);
    setFastSaleName(""); setFastSalePrice(""); setShowFastSaleDialog(false);
  };

  // === Hold / Recall ===
  const holdOrder = () => {
    if (cart.length === 0) { toast({ title: "السلة فارغة" }); return; }
    const newOrder: HeldOrder = {
      id: Date.now().toString(), cart: [...cart],
      createdAt: new Date().toLocaleString("ar-SA"),
      label: holdLabel.trim() || `فاتورة ${heldOrders.length + 1}`,
    };
    const updated = [...heldOrders, newOrder];
    setHeldOrders(updated); saveHeldOrders(updated);
    setCart([]); setHoldLabel(""); setShowHoldDialog(false);
    toast({ title: "تم تعليق الفاتورة", description: `الفاتورة "${newOrder.label}" معلقة الآن` });
  };

  const recallOrder = (order: HeldOrder) => {
    setCart(order.cart);
    const updated = heldOrders.filter((o) => o.id !== order.id);
    setHeldOrders(updated); saveHeldOrders(updated);
    setShowRecallDialog(false);
    toast({ title: "تم استرجاع الفاتورة", description: `تم استرجاع "${order.label}"` });
  };

  const deleteHeldOrder = (order: HeldOrder) => {
    const updated = heldOrders.filter((o) => o.id !== order.id);
    setHeldOrders(updated); saveHeldOrders(updated);
  };

  // === Keyboard shortcuts ===
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

  // === Mutations ===
  const resetState = () => {
    setCart([]); setShowCheckoutDialog(false); setSelectedCustomer(null);
    setDiscountType("none"); setDiscountValue(0);
    setPaymentMethod("cash"); setPaidAmount(0); setSplitCash(0); setSplitCard(0); setBarcode("");
    setDebtDueDate("");
  };

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const t = calculateTotals();
      const now = new Date();
      const prefix = settings?.invoice_number_prefix || "INV-";
      const invoiceNumber = `${prefix}${now.toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      const isCredit = paymentMethod === "credit";
      const debtAmount = isCredit ? t.total : 0;

      const result = await salesApi.createSaleInvoice({
        invoice_number: invoiceNumber,
        date: now.toISOString().slice(0, 10),
        time: now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
        subtotal: t.subtotal, discount_total: t.discountAmount,
        discount_type: discountType === "none" ? "" : discountType,
        discount_value: discountType !== "none" ? discountValue : 0,
        tax_rate: taxEnabled ? taxRate : 0, tax_total: t.taxAmount, total: t.total,
        second_tax_rate: secondTaxEnabled ? secondTaxRate : 0,
        second_tax_total: t.secondTaxAmount,
        payment_method: paymentMethod,
        paid_amount: isCredit ? 0 : paymentMethod === "cash" ? paidAmount : paymentMethod === "card" ? t.total : splitCash + splitCard,
        change_amount: isCredit ? 0 : paymentMethod === "cash" ? paidAmount - t.total : 0,
        debt_amount: debtAmount,
        customer_id: selectedCustomer?.id || null,
        cashier: user?.email || "البائع الرئيسي",
        user_id: user?.id, note: "",
      }, cart.map((item) => ({
        product_id: item.id, name: item.name, price: item.price,
        quantity: item.quantity, barcode: item.barcode,
      })));

      // If credit sale, create debt record
      if (isCredit && selectedCustomer) {
        try {
          const debtItems = cart.map((item) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            barcode: item.barcode,
          }));

          await debtsApi.createDebt({
            customer_id: selectedCustomer.id,
            invoice_id: result.id,
            total_amount: t.total,
            remaining_amount: t.total,
            status: "active",
            due_date: debtDueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            debtor_phone: selectedCustomer.phone || undefined,
            debt_items: debtItems,
            notes: `فاتورة: ${invoiceNumber}`,
          });
        } catch (debtErr) {
          console.error("Failed to create debt:", debtErr);
        }
      }

      (result as any)._totals = t;
      (result as any)._pm = paymentMethod;
      (result as any)._sc = splitCash;
      (result as any)._smc = splitCard;
      (result as any)._isCredit = isCredit;
      return result;
    },
    onSuccess: async (invoice) => {
      const t = (invoice as any)._totals;
      const pm = (invoice as any)._pm;
      const sc = (invoice as any)._sc || 0;
      const smc = (invoice as any)._smc || 0;
      const isCredit = (invoice as any)._isCredit;

      queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["debt-summary"] });
      toast({ title: isCredit ? "تم البيع بالآجل" : "تمت عملية البيع بنجاح", description: `المبلغ: ${invoice.total.toFixed(2)} ${CURRENCY}` });

      if (settings?.receipt_auto_print !== false) {
        setTimeout(() => { if (invoice) printSaleInvoice(invoice); }, 300);
      }

      if (activeSession && t) {
        const cashAmount = isCredit ? 0 : pm === "cash" ? t.total : pm === "mixed" ? sc : 0;
        const cardAmount = isCredit ? 0 : pm === "card" ? t.total : pm === "mixed" ? smc : 0;
        try {
          await sessionsApi.updateSessionStats(activeSession.id, {
            total_sales: activeSession.total_sales + t.total,
            total_cash: activeSession.total_cash + cashAmount,
            total_card: activeSession.total_card + cardAmount,
            total_returns: activeSession.total_returns,
            invoice_count: activeSession.invoice_count + 1,
          });
          setActiveSession((prev) => prev ? {
            ...prev, total_sales: prev.total_sales + t.total,
            total_cash: prev.total_cash + cashAmount,
            total_card: prev.total_card + cardAmount,
            invoice_count: prev.invoice_count + 1,
          } : null);
        } catch { /* non-critical */ }
      }

      resetState();
    },
    onError: (error: Error) => toast({ title: "خطأ", description: error.message, variant: "destructive" }),
  });

  const openSessionMutation = useMutation({
    mutationFn: () => sessionsApi.openSession({
      user_id: user!.id, cashier_name: user?.email || "البائع",
      opening_balance: parseFloat(openingBalance) || 0,
    }),
    onSuccess: (session) => {
      setActiveSession(session); setShowSessionDialog(false);
      toast({ title: "تم فتح الجلسة" });
    },
    onError: (error: Error) => toast({ title: "خطأ", description: error.message, variant: "destructive" }),
  });

  const closeSessionMutation = useMutation({
    mutationFn: () => sessionsApi.closeSession(activeSession!.id, parseFloat(closingBalance) || 0),
    onSuccess: () => {
      setActiveSession(null); setShowCloseSessionDialog(false);
      queryClient.invalidateQueries({ queryKey: ["cash-sessions"] });
      toast({ title: "تم إقفال الجلسة" });
    },
    onError: (error: Error) => toast({ title: "خطأ", description: error.message, variant: "destructive" }),
  });

  const { data: searchedCustomers = [] } = useQuery({
    queryKey: ["customer-search", customerSearch],
    queryFn: () => customersApi.searchCustomers(customerSearch),
    enabled: customerSearch.length >= 2,
  });

  const handlePrintPreview = () => {
    const { subtotal, discountAmount, taxAmount } = calculateTotals();
    const previewInvoice: any = {
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

  // === Session guard ===
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

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col lg:flex-row gap-0 pb-14 lg:pb-0" dir="rtl">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Top bar */}
        <div className="p-2 lg:p-3 border-b bg-white space-y-2">
          <div className="flex gap-2 items-center">
            <form onSubmit={handleBarcodeSubmit} className="flex gap-2 flex-1">
              <div className="relative flex-1">
                <Barcode className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input value={barcode} onChange={(e) => setBarcode(e.target.value)}
                  placeholder="امسح الباركود أو اكتبه (F1)..." className="pr-10 text-center font-mono" autoFocus dir="ltr" />
              </div>
              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 px-3">إضافة</Button>
            </form>
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
        <div className="p-2 lg:p-3 space-y-2 border-b bg-gray-50/50">
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
            products={products} categories={categories}
            loading={productsLoading} categoriesLoading={categoriesLoading}
            searchTerm={searchTerm} selectedCategory={selectedCategory}
            cart={cart} lowStockAlert={settings?.low_stock_alert || 5}
            onAddToCart={addToCart}
          />
        </div>

        {/* Mobile cart button - floating */}
        <div className="lg:hidden fixed bottom-[6.5rem] left-2 right-2 z-40">
          <Button onClick={() => setShowCartMobile(!showCartMobile)} className="w-full bg-blue-600 shadow-xl rounded-xl h-12 text-base">
            <ShoppingBag className="w-5 h-5 ml-2" />
            {cart.length > 0 ? `السلة (${calculateItemsCount()} قطعة - ${totals.total.toFixed(2)} ${CURRENCY})` : "عرض السلة"}
          </Button>
        </div>
      </div>

      {/* Cart - Desktop sidebar or Mobile bottom sheet */}
      <div className="hidden lg:flex lg:max-h-none">
        <CartSidebar
          cart={cart} selectedCustomer={selectedCustomer}
          discountType={discountType} discountValue={discountValue}
          taxEnabled={taxEnabled} taxRate={taxRate}
          paymentMethod={paymentMethod} paidAmount={paidAmount}
          splitCash={splitCash} splitCard={splitCard}
          debtDueDate={debtDueDate}
          subtotal={calculateSubtotal()} totals={totals}
          isPending={checkoutMutation.isPending}
          enableCreditSales={settings?.enable_credit_sales !== false}
          onUpdateQuantity={updateQuantity} onRemoveItem={removeFromCart}
          onClearCart={() => setShowClearCartDialog(true)}
          onShowDiscount={() => setShowDiscountDialog(true)}
          onShowCustomer={() => setShowCustomerDialog(true)}
          onShowCheckout={() => {
            if (cart.length === 0) { toast({ title: "السلة فارغة" }); return; }
            if (paymentMethod === "cash" && paidAmount <= 0) setPaidAmount(totals.total);
            if (paymentMethod === "credit" && !selectedCustomer) {
              toast({ title: "الرجاء اختيار زبون", description: "يجب اختيار زبون للبيع بالآجل", variant: "destructive" });
              return;
            }
            setShowCheckoutDialog(true);
          }}
          onPaymentMethodChange={setPaymentMethod}
          onPaidAmountChange={setPaidAmount}
          onSplitCashChange={setSplitCash}
          onDebtDueDateChange={setDebtDueDate}
          onPrint={handlePrintPreview}
        />
      </div>

      {/* Mobile Cart Bottom Sheet */}
      {showCartMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCartMobile(false)} />
          <div className="relative bg-white rounded-t-2xl max-h-[85vh] flex flex-col animate-slide-up shadow-2xl" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
            <div className="flex items-center justify-between p-3 border-b shrink-0">
              <h3 className="text-sm font-bold">سلة المشتريات</h3>
              <button onClick={() => setShowCartMobile(false)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <CartSidebar
                cart={cart} selectedCustomer={selectedCustomer}
                discountType={discountType} discountValue={discountValue}
                taxEnabled={taxEnabled} taxRate={taxRate}
                paymentMethod={paymentMethod} paidAmount={paidAmount}
                splitCash={splitCash} splitCard={splitCard}
                debtDueDate={debtDueDate}
                subtotal={calculateSubtotal()} totals={totals}
                isPending={checkoutMutation.isPending}
                enableCreditSales={settings?.enable_credit_sales !== false}
                onUpdateQuantity={updateQuantity} onRemoveItem={removeFromCart}
                onClearCart={() => { setShowClearCartDialog(true); }}
                onShowDiscount={() => { setShowDiscountDialog(true); }}
                onShowCustomer={() => { setShowCustomerDialog(true); }}
                onShowCheckout={() => {
                  if (cart.length === 0) { toast({ title: "السلة فارغة" }); return; }
                  if (paymentMethod === "cash" && paidAmount <= 0) setPaidAmount(totals.total);
                  if (paymentMethod === "credit" && !selectedCustomer) {
                    toast({ title: "الرجاء اختيار زبون", description: "يجب اختيار زبون للبيع بالآجل", variant: "destructive" });
                    return;
                  }
                  setShowCheckoutDialog(true);
                }}
                onPaymentMethodChange={setPaymentMethod}
                onPaidAmountChange={setPaidAmount}
                onSplitCashChange={setSplitCash}
                onDebtDueDateChange={setDebtDueDate}
                onPrint={handlePrintPreview}
              />
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
        onConfirm={() => checkoutMutation.mutate()}
      />

      <Dialog open={showClearCartDialog} onOpenChange={setShowClearCartDialog}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="w-5 h-5" />إفراغ السلة</DialogTitle>
            <DialogDescription>هل أنت متأكد من إفراغ سلة المشتريات؟ سيتم حذف جميع المنتجات المختارة.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowClearCartDialog(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={clearCart}>إفراغ السلة</Button>
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
        orderCount={heldOrders.length} onHold={holdOrder}
      />

      <RecallOrderDialog
        open={showRecallDialog} onOpenChange={setShowRecallDialog}
        heldOrders={heldOrders} onRecall={recallOrder} onDelete={deleteHeldOrder}
      />

      {/* Session management - Mobile floating */}
      {activeSession && (
        <div className="lg:hidden fixed bottom-16 left-4 right-4 z-40">
          <Button variant="outline" size="sm" className="w-full border-red-300 text-red-600 hover:bg-red-50"
            onClick={() => {
              setClosingBalance(activeSession.total_cash.toFixed(0));
              setShowCloseSessionDialog(true);
            }}>
            إقفال الجلسة
          </Button>
        </div>
      )}

      <CloseSessionDialog
        open={showCloseSessionDialog} onOpenChange={setShowCloseSessionDialog}
        session={activeSession} closingBalance={closingBalance}
        onClosingBalanceChange={setClosingBalance}
        onConfirm={() => closeSessionMutation.mutate()}
        isPending={closeSessionMutation.isPending}
      />
    </div>
  );
}
