import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import * as settingsApi from "@/api/settings";
import { setPrintSettings } from "@/lib/printInvoice";
import type { Product, CartItem, Customer } from "@/types";

export function usePOSCart() {
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [discountType, setDiscountType] = useState<"none" | "percentage" | "fixed">("none");
  const [discountValue, setDiscountValue] = useState(0);
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState(0);
  const [secondTaxEnabled, setSecondTaxEnabled] = useState(false);
  const [secondTaxRate, setSecondTaxRate] = useState(0);

  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "mixed" | "credit">("cash");
  const [paidAmount, setPaidAmount] = useState(0);
  const [splitCash, setSplitCash] = useState(0);
  const [splitCard, setSplitCard] = useState(0);
  const [debtDueDate, setDebtDueDate] = useState("");

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: settingsApi.fetchSettings,
    staleTime: 10 * 60_000,
  });

  useEffect(() => {
    if (settings) {
      setTaxEnabled(settings.tax_enabled);
      setTaxRate(settings.tax_rate);
      setSecondTaxEnabled(settings.second_tax_enabled);
      setSecondTaxRate(settings.second_tax_rate);
      setPaymentMethod(settings.default_payment_method as "cash" | "card" | "mixed" | "credit");
      setPrintSettings(settings);
    }
  }, [settings]);

  const calculateSubtotal = useCallback(() => cart.reduce((t, i) => t + i.price * i.quantity, 0), [cart]);
  const calculateItemsCount = useCallback(() => cart.reduce((c, i) => c + i.quantity, 0), [cart]);

  const calculateTotals = useCallback(() => {
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
  }, [calculateSubtotal, discountType, discountValue, taxEnabled, taxRate, secondTaxEnabled, secondTaxRate]);

  useEffect(() => {
    const t = calculateTotals();
    if (paymentMethod === "mixed") setSplitCard(Math.max(0, t.total - splitCash));
  }, [splitCash, paymentMethod, calculateTotals]);

  useEffect(() => {
    if (paymentMethod === "credit") setPaidAmount(0);
  }, [paymentMethod]);

  const addToCart = useCallback((product: Product) => {
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
  }, [cart, toast]);

  const updateQuantity = useCallback((id: string, newQty: number, products: Product[]) => {
    const product = products.find((p) => p.id === id);
    if (product && newQty > product.stock) {
      toast({ title: "الكمية غير متوفرة", description: `المتوفر: ${product.stock} قطعة`, variant: "destructive" });
      return;
    }
    if (newQty <= 0) setCart(cart.filter((item) => item.id !== id));
    else setCart(cart.map((item) => item.id === id ? { ...item, quantity: newQty } : item));
  }, [cart, toast]);

  const removeFromCart = useCallback((id: string) => setCart(cart.filter((item) => item.id !== id)), [cart]);
  const clearCart = useCallback(() => setCart([]), []);

  const totals = calculateTotals();

  return {
    cart, setCart,
    selectedCustomer, setSelectedCustomer,
    discountType, setDiscountType, discountValue, setDiscountValue,
    taxEnabled, taxRate, secondTaxEnabled, secondTaxRate,
    paymentMethod, setPaymentMethod,
    paidAmount, setPaidAmount,
    splitCash, setSplitCash, splitCard,
    debtDueDate, setDebtDueDate,
    settings,
    addToCart, updateQuantity, removeFromCart, clearCart,
    calculateSubtotal, calculateItemsCount, calculateTotals,
    totals,
  };
}
