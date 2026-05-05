import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package } from "lucide-react";
import { CURRENCY } from "@/constants";
import type { Product, Category, CartItem } from "@/types";

interface ProductGridProps {
  products: Product[];
  categories: Category[];
  loading: boolean;
  categoriesLoading: boolean;
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
      result = result.filter((p) => p.name.toLowerCase().includes(term) || (p.barcode && p.barcode.includes(term)));
    }
    return result;
  }, [products, selectedCategory, searchTerm]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 lg:gap-3 p-2 lg:p-3">
        {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Package className="w-12 h-12 mb-3" />
        <p className="text-lg font-medium">لا توجد منتجات</p>
        <p className="text-sm">{searchTerm || selectedCategory !== "all" ? "جرب تغيير معايير البحث" : "أضف منتجات جديدة من قسم المنتجات"}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 lg:gap-3 p-2 lg:p-3">
      {filtered.map((product) => {
        const stockStatus = getStockStatus(product.stock, lowStockAlert);
        const inCart = cart.find((item) => item.id === product.id);
        const isOutOfStock = product.stock === 0;
        return (
          <Card
            key={product.id}
            role="button"
            tabIndex={isOutOfStock ? -1 : 0}
            onKeyDown={(e) => { if (!isOutOfStock && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onAddToCart(product); } }}
            className={`cursor-pointer transition-all duration-150 hover:shadow-md ${
              isOutOfStock ? "opacity-60 cursor-not-allowed" : "hover:border-blue-300"
            } ${inCart ? "ring-2 ring-blue-500 ring-offset-1" : ""} overflow-hidden`}
            onClick={() => !isOutOfStock && onAddToCart(product)}
          >
            {product.image_url && (
              <div className="h-20 bg-gray-100 overflow-hidden">
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
              </div>
            )}
            <CardContent className="p-2 space-y-1.5">
              <div className="flex justify-between items-start gap-1">
                <h3 className="font-semibold text-xs text-gray-800 line-clamp-2 flex-1">{product.name}</h3>
                {inCart && <Badge variant="default" className="shrink-0 bg-blue-600 text-xs px-1.5">{inCart.quantity}</Badge>}
              </div>
              <p className="text-base font-bold text-blue-600">
                {product.price.toFixed(2)} <span className="text-xs font-normal text-gray-500">{CURRENCY}</span>
              </p>
              <div className="flex items-center gap-1 flex-wrap">
                <Badge variant={stockStatus.variant} className="text-xs">{stockStatus.label}</Badge>
                {product.category && (
                  <Badge variant="outline" className="text-xs" style={{ borderColor: product.category.color, color: product.category.color }}>{product.category.name}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
