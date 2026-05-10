import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import type { CartItem, HeldOrder } from "@/types";

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

export function usePOSOrders() {
  const { toast } = useToast();
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(loadHeldOrders());
  const [holdLabel, setHoldLabel] = useState("");

  const holdOrder = useCallback((cart: CartItem[], _itemCount: number) => {
    if (cart.length === 0) { toast({ title: "السلة فارغة" }); return false; }
    const newOrder: HeldOrder = {
      id: Date.now().toString(), cart: [...cart],
      createdAt: new Date().toLocaleString("ar-SA"),
      label: holdLabel.trim() || `فاتورة ${heldOrders.length + 1}`,
    };
    const updated = [...heldOrders, newOrder];
    setHeldOrders(updated); saveHeldOrders(updated);
    setHoldLabel("");
    toast({ title: "تم تعليق الفاتورة", description: `الفاتورة "${newOrder.label}" معلقة الآن` });
    return true;
  }, [heldOrders, holdLabel, toast]);

  const recallOrder = useCallback((order: HeldOrder): CartItem[] | null => {
    const updated = heldOrders.filter((o) => o.id !== order.id);
    setHeldOrders(updated); saveHeldOrders(updated);
    toast({ title: "تم استرجاع الفاتورة", description: `تم استرجاع "${order.label}"` });
    return order.cart;
  }, [heldOrders, toast]);

  const deleteHeldOrder = useCallback((order: HeldOrder) => {
    const updated = heldOrders.filter((o) => o.id !== order.id);
    setHeldOrders(updated); saveHeldOrders(updated);
  }, [heldOrders]);

  return { heldOrders, holdLabel, setHoldLabel, holdOrder, recallOrder, deleteHeldOrder };
}
