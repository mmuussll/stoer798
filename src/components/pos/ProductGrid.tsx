import { useMemo, useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Package, Minus, Plus } from "lucide-react";
import { CURRENCY } from "@/constants";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product, CartItem } from "@/types";

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  searchTerm: string;
  selectedCategory: string;
  cart: CartItem[];
  lowStockAlert: number;
  onAddToCart: (product: Product) => void;
  popularProducts?: { id: string; name: string; price: number; count: number }[];
}

function getStockStatus(stock: number, lowStockAlert: number) {
  if (stock === 0) return { label: "نفذ", variant: "destructive" as const };
  if (stock <= lowStockAlert) return { label: "منخفض", variant: "outline" as const };
  return { label: `متوفر: ${stock}`, variant: "secondary" as const };
}

export function ProductGrid({
  products,
  loading,
  searchTerm,
  selectedCategory,
  cart,
  lowStockAlert,
  onAddToCart,
  popularProducts,
}: ProductGridProps) {
  const [longPressProduct, setLongPressProduct] = useState<Product | null>(null);
  const [quickQty, setQuickQty] = useState(1);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePointerDown = useCallback((product: Product) => {
    longPressTimer.current = setTimeout(() => {
      setLongPressProduct(product);
      setQuickQty(1);
    }, 500);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleQuickAdd = () => {
    if (longPressProduct) {
      for (let i = 0; i < quickQty; i++) {
        onAddToCart(longPressProduct);
      }
      setLongPressProduct(null);
    }
  };

  const filtered = useMemo(() => {
    let result = products;
    if (selectedCategory !== "all") result = result.filter((p) => p.category_id === selectedCategory);
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(term) || (p.barcode && p.barcode.includes(term))
      );
    }
    return result;
  }, [products, selectedCategory, searchTerm]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 lg:gap-3 p-2 lg:p-3">
        {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
      </div>
    );
  }

  const showPopular = popularProducts
    && popularProducts.length > 0
    && !searchTerm.trim()
    && selectedCategory === "all";

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
          <Package className="w-8 h-8 opacity-40" />
        </div>
        <p className="text-base font-semibold text-slate-500">لا توجد منتجات</p>
        <p className="text-sm mt-1 text-slate-400">
          {searchTerm || selectedCategory !== "all" ? "جرب تغيير معايير البحث" : "أضف منتجات جديدة من قسم المنتجات"}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Popular Products Quick-Access Row */}
      {showPopular && (
        <div className="px-2 lg:px-3 pt-2 lg:pt-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">الأكثر مبيعاً</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {popularProducts!.map((p) => {
              const product = products.find((prod) => prod.id === p.id);
              if (!product || product.stock === 0) return null;
              const inCart = cart.find((item) => item.id === p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => onAddToCart(product)}
                  className="flex items-center gap-2 shrink-0 bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-sm rounded-xl px-3 py-2 transition-all duration-150 active:scale-95"
                >
                  <span className="text-[12px] font-semibold text-slate-700 truncate max-w-[100px]">{p.name}</span>
                  <span className="text-[12px] font-bold text-indigo-600">{(p.price).toLocaleString("en")}</span>
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">+</span>
                  {inCart && (
                    <span className="text-[10px] text-indigo-500 font-bold">{inCart.quantity}x</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 lg:gap-3 p-2 lg:p-3">
      {filtered.map((product) => {
        const stockStatus = getStockStatus(product.stock, lowStockAlert);
        const inCart = cart.find((item) => item.id === product.id);
        const isOutOfStock = product.stock === 0;
        const inCartQty = inCart?.quantity;

        return (
          <Card
            key={product.id}
            role="button"
            tabIndex={isOutOfStock ? -1 : 0}
            aria-label={`${product.name} - ${formatNumber(product.price, 3)} ${CURRENCY}${isOutOfStock ? " - غير متوفر" : ""}`}
            aria-disabled={isOutOfStock}
            onKeyDown={(e) => {
              if (!isOutOfStock && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onAddToCart(product);
              }
            }}
            className={cn(
              "relative cursor-pointer overflow-hidden rounded-xl border border-slate-200/80 transition-all duration-150",
              "hover:shadow-md hover:border-indigo-300/60 active:scale-[0.97]",
              "focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 outline-none",
              isOutOfStock
                ? "opacity-45 cursor-not-allowed"
                : "bg-white hover:-translate-y-0.5",
              inCart ? "ring-2 ring-indigo-500 ring-offset-1 ring-offset-slate-50 shadow-sm" : ""
            )}
            onClick={() => !isOutOfStock && onAddToCart(product)}
            onPointerDown={() => !isOutOfStock && handlePointerDown(product)}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onContextMenu={(e) => e.preventDefault()}
          >
            {product.image_url ? (
              <div className="h-20 lg:h-24 bg-slate-100 overflow-hidden">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="h-14 lg:h-16 bg-gradient-to-br from-slate-50 to-indigo-50/50 flex items-center justify-center">
                <Package className="w-5 lg:w-6 h-5 lg:h-6 text-slate-300" />
              </div>
            )}

            <CardContent className="p-2 lg:p-2.5 space-y-1 lg:space-y-1.5">
              {inCartQty ? (
                <span
                  className="absolute top-1.5 right-1.5 min-w-[20px] h-[20px] lg:min-w-[22px] lg:h-[22px] bg-indigo-600 text-white text-[10px] lg:text-[11px] font-bold rounded-full flex items-center justify-center px-1 shadow-md shadow-indigo-500/30 animate-scale-in"
                  aria-label={`الكمية في السلة: ${inCartQty}`}
                >
                  {inCartQty}
                </span>
              ) : null}

              <div className="font-semibold text-[12px] lg:text-[13px] text-slate-800 line-clamp-2 leading-tight pr-5">
                {product.name}
              </div>

              <p className="text-sm lg:text-base font-bold text-indigo-600 tracking-tight">
                {formatNumber(product.price, 3)}{" "}
                <span className="text-[10px] lg:text-[11px] font-normal text-slate-500">{CURRENCY}</span>
              </p>

              <div className="flex items-center gap-1 flex-wrap">
                <Badge
                  variant={stockStatus.variant}
                  className={cn(
                    "text-[9px] lg:text-[10px] px-1 lg:px-1.5 py-0 font-medium rounded-md",
                    product.stock === 0 && "bg-red-100 text-red-700 border-red-200",
                    product.stock > 0 && product.stock <= lowStockAlert && "bg-amber-50 text-amber-700 border-amber-200",
                    product.stock > lowStockAlert && "bg-emerald-50 text-emerald-700 border-emerald-200"
                  )}
                >
                  {stockStatus.label}
                </Badge>
                {product.category && (
                  <Badge
                    variant="outline"
                    className="text-[9px] lg:text-[10px] px-1 lg:px-1.5 py-0 font-medium rounded-md text-slate-700"
                    style={{
                      borderColor: product.category.color + "40",
                    }}
                  >
                    {product.category.name}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
    {/* Long-press quick quantity dialog */}
    <Dialog open={!!longPressProduct} onOpenChange={(open) => { if (!open) setLongPressProduct(null); }}>
      <DialogContent dir="rtl" className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-base">{longPressProduct?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-slate-500">السعر: <span className="font-bold text-indigo-600">{longPressProduct ? formatNumber(longPressProduct.price, 3) : ""} {CURRENCY}</span></p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => setQuickQty(Math.max(1, quickQty - 1))}>
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-2xl font-bold text-slate-800 w-12 text-center tabular-nums">{quickQty}</span>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => setQuickQty(quickQty + 1)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {longPressProduct && quickQty > 1 && (
            <p className="text-xs text-slate-500 text-center">الإجمالي: {formatNumber(longPressProduct.price * quickQty, 3)} {CURRENCY}</p>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setLongPressProduct(null)}>إلغاء</Button>
          <Button onClick={handleQuickAdd} className="bg-indigo-600 hover:bg-indigo-700">إضافة {quickQty} قطعة</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}
