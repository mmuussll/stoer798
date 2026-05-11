import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package } from "lucide-react";
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
}: ProductGridProps) {
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 lg:gap-3 p-2.5 lg:p-3">
        {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
      </div>
    );
  }

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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 lg:gap-3 p-2.5 lg:p-3">
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
              "relative cursor-pointer overflow-hidden rounded-xl border border-slate-200/80 transition-all duration-200",
              "hover:shadow-lg hover:shadow-slate-200/50 hover:border-indigo-300/60 hover:-translate-y-0.5",
              "active:scale-[0.98] active:shadow-md",
              "focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 outline-none",
              isOutOfStock
                ? "opacity-50 cursor-not-allowed hover:shadow-none hover:translate-y-0"
                : "bg-white",
              inCart ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-50" : ""
            )}
            onClick={() => !isOutOfStock && onAddToCart(product)}
          >
            {product.image_url ? (
              <div className="h-24 bg-slate-100 overflow-hidden">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="h-16 bg-gradient-to-br from-slate-50 to-indigo-50/50 flex items-center justify-center">
                <Package className="w-6 h-6 text-slate-300" />
              </div>
            )}

            <CardContent className="p-2.5 space-y-1.5">
              {inCartQty ? (
                <span
                  className="absolute top-2 right-2 min-w-[22px] h-[22px] bg-indigo-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1.5 shadow-md shadow-indigo-500/30"
                  aria-label={`الكمية في السلة: ${inCartQty}`}
                >
                  {inCartQty}
                </span>
              ) : null}

              <h3 className="font-semibold text-[13px] text-slate-800 line-clamp-2 leading-tight pr-5">
                {product.name}
              </h3>

              <p className="text-base font-bold text-indigo-600 tracking-tight">
                {formatNumber(product.price, 3)}{" "}
                <span className="text-[11px] font-normal text-slate-400">{CURRENCY}</span>
              </p>

              <div className="flex items-center gap-1 flex-wrap">
                <Badge
                  variant={stockStatus.variant}
                  className={cn(
                    "text-[10px] px-1.5 py-0 font-medium rounded-md",
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
                    className="text-[10px] px-1.5 py-0 font-medium rounded-md"
                    style={{ borderColor: product.category.color + "40", color: product.category.color }}
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
  );
}
