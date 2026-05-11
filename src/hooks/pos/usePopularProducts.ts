import { useState, useCallback } from "react";

const POPULAR_KEY = "pos-popular-products";

interface PopularEntry {
  id: string;
  name: string;
  price: number;
  count: number;
}

function loadPopular(): Record<string, PopularEntry> {
  try {
    const raw = localStorage.getItem(POPULAR_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePopular(data: Record<string, PopularEntry>) {
  localStorage.setItem(POPULAR_KEY, JSON.stringify(data));
}

export function usePopularProducts() {
  const [popular, setPopular] = useState<Record<string, PopularEntry>>(loadPopular);

  const recordSale = useCallback((items: { id: string; name: string; price: number }[]) => {
    setPopular((prev) => {
      const updated = { ...prev };
      for (const item of items) {
        if (updated[item.id]) {
          updated[item.id].count += 1;
          updated[item.id].name = item.name;
          updated[item.id].price = item.price;
        } else {
          updated[item.id] = { id: item.id, name: item.name, price: item.price, count: 1 };
        }
      }
      savePopular(updated);
      return updated;
    });
  }, []);

  const getTopProducts = useCallback(
    (count = 5) =>
      Object.values(popular)
        .sort((a, b) => b.count - a.count)
        .slice(0, count),
    [popular]
  );

  return { popular, recordSale, getTopProducts };
}
