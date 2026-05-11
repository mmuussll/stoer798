import type { Product, Category } from "@/types";

export function exportProductsCSV(products: Product[], categories: Category[]) {
  const getCatName = (id?: string) => categories.find((c) => c.id === id)?.name ?? "";
  const headers = ["الاسم", "السعر", "سعر الجملة", "المخزون", "الباركود", "الوصف", "الوحدة", "الفئة", "تاريخ الإضافة"];
  const rows = products.map((p) => [
    p.name, p.price.toString(), p.wholesale_price?.toString() ?? "", p.stock.toString(),
    p.barcode ?? "", p.description ?? "", p.unit ?? "", getCatName(p.category_id), p.created_at ?? "",
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `المنتجات-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
