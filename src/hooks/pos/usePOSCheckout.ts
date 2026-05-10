import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { CURRENCY } from "@/constants";
import { printSaleInvoice } from "@/lib/printInvoice";
import * as salesApi from "@/api/sales";
import * as debtsApi from "@/api/debts";
import * as sessionsApi from "@/api/sessions";
import type { Product, CartItem, Customer, StoreSettings } from "@/types";

interface CheckoutParams {
  cart: CartItem[];
  selectedCustomer: Customer | null;
  discountType: string;
  discountValue: number;
  taxEnabled: boolean;
  taxRate: number;
  secondTaxEnabled: boolean;
  secondTaxRate: number;
  paymentMethod: "cash" | "card" | "mixed" | "credit";
  paidAmount: number;
  splitCash: number;
  splitCard: number;
  debtDueDate: string;
  totals: { subtotal: number; discountAmount: number; taxAmount: number; secondTaxAmount: number; total: number };
  settings?: StoreSettings;
  activeSession?: { id: string; total_sales: number; total_cash: number; total_card: number; total_returns: number; invoice_count: number } | null;
  onReset: () => void;
}

export function usePOSCheckout() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const checkoutMutation = useMutation({
    mutationFn: async (params: CheckoutParams) => {
      const {
        cart, selectedCustomer, discountType, discountValue,
        taxEnabled, taxRate, secondTaxEnabled, secondTaxRate,
        paymentMethod, paidAmount, splitCash, splitCard,
        debtDueDate, totals: t, settings,
      } = params;

      const now = new Date();
      const prefix = settings?.invoice_number_prefix || "INV-";
      let invoiceNumber = `${prefix}${now.toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      try {
        invoiceNumber = await salesApi.getNextInvoiceNumber(prefix);
      } catch {
        // Fallback to random
      }

      const isCredit = paymentMethod === "credit";

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
        debt_amount: isCredit ? t.total : 0,
        customer_id: selectedCustomer?.id || null,
        cashier: user?.email || "البائع الرئيسي",
        user_id: user?.id, note: "",
      }, cart.map((item) => ({
        product_id: item.id, name: item.name, price: item.price,
        quantity: item.quantity, barcode: item.barcode,
      })));

      if (isCredit && selectedCustomer) {
        try {
          await debtsApi.createDebt({
            customer_id: selectedCustomer.id,
            invoice_id: result.id,
            total_amount: t.total,
            remaining_amount: t.total,
            status: "active",
            due_date: debtDueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            debtor_phone: selectedCustomer.phone || undefined,
            debt_items: cart.map((item) => ({
              name: item.name, price: item.price, quantity: item.quantity, barcode: item.barcode,
            })),
            notes: `فاتورة: ${invoiceNumber}`,
          });
        } catch (debtErr) {
          console.error("Failed to create debt:", debtErr);
        }
      }

      return { invoice: result, totals: t, paymentMethod, splitCash, splitCard, isCredit };
    },

    onSuccess: async ({ invoice, totals: t, paymentMethod, splitCash: sc, splitCard: smc, isCredit }, params) => {
      const { cart, selectedCustomer, activeSession, onReset } = params;

      queryClient.setQueryData<Product[]>(["products"], (old) => {
        if (!old) return old;
        return old.map((p) => {
          const cartItem = cart.find((ci) => ci.id === p.id);
          if (cartItem) return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
          return p;
        });
      });

      if (selectedCustomer && !isCredit) {
        queryClient.invalidateQueries({ queryKey: ["customers"], refetchType: "active" });
      }
      if (isCredit) {
        queryClient.invalidateQueries({ queryKey: ["debts"] });
        queryClient.invalidateQueries({ queryKey: ["debt-summary"] });
      }
      queryClient.invalidateQueries({ queryKey: ["sales-invoices"], refetchType: "none" });

      toast({ title: isCredit ? "تم البيع بالآجل" : "تمت عملية البيع بنجاح", description: `المبلغ: ${invoice.total.toFixed(2)} ${CURRENCY}` });

      if (params.settings?.receipt_auto_print !== false) {
        setTimeout(() => { if (invoice) printSaleInvoice(invoice); }, 300);
      }

      if (activeSession) {
        const cashAmount = isCredit ? 0 : paymentMethod === "cash" ? t.total : paymentMethod === "mixed" ? sc : 0;
        const cardAmount = isCredit ? 0 : paymentMethod === "card" ? t.total : paymentMethod === "mixed" ? smc : 0;
        try {
          await sessionsApi.updateSessionStats(activeSession.id, {
            total_sales: activeSession.total_sales + t.total,
            total_cash: activeSession.total_cash + cashAmount,
            total_card: activeSession.total_card + cardAmount,
            total_returns: activeSession.total_returns,
            invoice_count: activeSession.invoice_count + 1,
          });
        } catch { /* non-critical */ }
      }

      onReset();
    },

    onError: (error: Error) => toast({ title: "خطأ", description: error.message, variant: "destructive" }),
  });

  return { checkoutMutation };
}
