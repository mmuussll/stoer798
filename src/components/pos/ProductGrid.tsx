import { useMemo, useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Package, Minus, Plus, Flame } from "lucide-react";
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
  products, loading, searchTerm, selectedCategory,
  cart, lowStockAlert, onAddToCart, popularProducts,
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
      for (let i = 0; i < quickQty; i++) onAddToCart(longPressProduct);
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 lg:gap-3.5 p-2.5 lg:p-3.5">
        {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
      </div>
    );
  }

  const showPopular = popularProducts && popularProducts.length > 0 && !searchTerm.trim() && selectedCategory === "all";

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <div className="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mb-5">
          <Package className="w-10 h-10 opacity-25" />
        </div>
        <p className="text-base font-bold text-muted-foreground">لا توجد منتجات</p>
        <p className="text-sm mt-1.5 text-muted-foreground/60">
          {searchTerm || selectedCategory !== "all" ? "جرب تغيير معايير البحث" : "أضف منتجات جديدة من قسم المنتجات"}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Popular Products Quick-Access Row */}
      {showPopular && (
        <div className="px-2.5 lg:px-3.5 pt-3 pb-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-[12px] font-bold text-foreground tracking-tight">الأكثر مبيعاً</span>
            </div>
            <span className="h-px flex-1 bg-border/60" />
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
            {popularProducts!.map((p) => {
              const product = products.find((prod) => prod.id === p.id);
              if (!product || product.stock === 0) return null;
              const inCart = cart.find((item) => item.id === p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => onAddToCart(product)}
                  className="flex items-center gap-2.5 shrink-0 bg-white border border-border/60 hover:border-primary/40 hover:shadow-md rounded-2xl px-3.5 py-2.5 transition-all duration-200 active:scale-95 tap-active"
                >
                  <span className="text-[13px] font-bold text-foreground truncate max-w-[110px]">{p.name}</span>
                  <span className="text-[13px] font-extrabold text-primary">{(p.price).toLocaleString("en")}</span>
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-extrabold">+</span>
                  {inCart && (
                    <span className="text-[10px] text-primary font-bold">{inCart.quantity}x</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 lg:gap-3.5 p-2.5 pb-32 lg:pb-3.5">
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
                "group relative cursor-pointer overflow-hidden rounded-2xl border border-indigo-50/50 transition-all duration-300",
                "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none",
                isOutOfStock
                  ? "opacity-40 cursor-not-allowed bg-slate-100/50"
                  : "bg-white hover:-translate-y-1 hover:shadow-xl hover:border-primary/30 active:scale-[0.96]",
                inCart ? "ring-2 ring-primary ring-offset-2 ring-offset-slate-50 shadow-[0_12px_24px_rgba(99,102,241,0.2)] border-primary/40" : "shadow-sm shadow-slate-100"
              )}
              onClick={() => !isOutOfStock && onAddToCart(product)}
              onPointerDown={() => !isOutOfStock && handlePointerDown(product)}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onContextMenu={(e) => e.preventDefault()}
            >
              {product.image_url ? (
                <div className="h-22 lg:h-28 bg-slate-50 overflow-hidden relative">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              ) : (
                <div className="h-16 lg:h-20 bg-gradient-to-br from-indigo-50/40 via-purple-50/20 to-pink-50/10 flex items-center justify-center transition-all duration-300 group-hover:from-indigo-100/30 group-hover:to-purple-100/20">
                  <Package className="w-6 lg:w-7 h-6 lg:h-7 text-primary/30 transition-transform duration-500 group-hover:scale-110 group-hover:text-primary/50" />
                </div>
              )}

              <CardContent className="p-2.5 lg:p-3.5 space-y-1.5 lg:space-y-2">
                {inCartQty ? (
                  <span
                    className="absolute top-2 right-2 min-w-[22px] h-[22px] lg:min-w-[24px] lg:h-[24px] bg-gradient-brand text-white text-[10px] lg:text-[11px] font-black rounded-full flex items-center justify-center px-1 shadow-md shadow-primary/40 animate-scale-in"
                  >
                    {inCartQty}
                  </span>
                ) : null}

                <div className="font-bold text-[13px] lg:text-[14px] text-slate-800 line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-200">
                  {product.name}
                </div>

                <p className="text-base lg:text-lg font-extrabold text-primary tracking-tight tabular-nums">
                  {formatNumber(product.price, 3)}{" "}
                  <span className="text-[10px] lg:text-[11px] font-medium text-slate-400">{CURRENCY}</span>
                </p>

                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <Badge
                    variant={stockStatus.variant}
                    className={cn(
                      "text-[9px] lg:text-[10px] px-1.5 lg:px-2 py-0.5 font-bold rounded-lg border",
                      product.stock === 0 && "bg-rose-50 text-rose-600 border-rose-100",
                      product.stock > 0 && product.stock <= lowStockAlert && "bg-amber-50 text-amber-600 border-amber-100",
                      product.stock > lowStockAlert && "bg-emerald-50 text-emerald-600 border-emerald-100"
                    )}
                  >
                    {stockStatus.label}
                  </Badge>
                  {product.category && (
                    <Badge
                      variant="outline"
                      className="text-[9px] lg:text-[10px] px-1.5 lg:px-2 py-0.5 font-bold rounded-lg border"
                      style={{ borderColor: product.category.color + "25", color: product.category.color, backgroundColor: product.category.color + "08" }}
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

      {/* Quick quantity dialog */}
      <Dialog open={!!longPressProduct} onOpenChange={(open) => { if (!open) setLongPressProduct(null); }}>
        <DialogContent dir="rtl" className="max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{longPressProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground font-medium">
              السعر: <span className="font-extrabold text-primary">{longPressProduct ? formatNumber(longPressProduct.price, 3) : ""} {CURRENCY}</span>
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-border/60 hover:bg-muted" onClick={() => setQuickQty(Math.max(1, quickQty - 1))}>
                <Minus className="w-5 h-5" />
              </Button>
              <span className="text-3xl font-extrabold text-foreground w-14 text-center tabular-nums">{quickQty}</span>
              <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-border/60 hover:bg-muted" onClick={() => setQuickQty(quickQty + 1)}>
                <Plus className="w-5 h-5" />
              </Button>
            </div>
            {longPressProduct && quickQty > 1 && (
              <p className="text-xs text-muted-foreground text-center font-medium">
                الإجمالي: <span className="font-bold text-primary">{formatNumber(longPressProduct.price * quickQty, 3)} {CURRENCY}</span>
              </p>
            )}
          </div>
          <DialogFooter className="gap-2.5">
            <Button variant="outline" onClick={() => setLongPressProduct(null)} className="rounded-xl">إلغاء</Button>
            <Button onClick={handleQuickAdd} className="bg-primary hover:bg-primary/90 rounded-xl font-bold shadow-lg shadow-primary/20">إضافة {quickQty} قطعة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
