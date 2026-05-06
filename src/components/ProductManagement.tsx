import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Plus, Search, Edit, Trash2, Barcode, AlertTriangle, LayoutGrid, List, Filter, ArrowUpDown, Image, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CategoryManagement from "./CategoryManagement";
import * as productsApi from "@/api/products";
import * as categoriesApi from "@/api/categories";
import { CURRENCY } from "@/constants";
import type { Product, Category } from "@/types";

type ViewMode = "grid" | "list";
type SortField = "name" | "price" | "stock";
type SortOrder = "asc" | "desc";

export default function ProductManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [formData, setFormData] = useState({ name: "", price: "", stock: "", barcode: "", category_id: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data: allProducts = [], isLoading: productsLoading } = useQuery({ queryKey: ["products"], queryFn: productsApi.fetchProducts, staleTime: 2 * 60_000 });
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.fetchCategories, staleTime: 5 * 60_000 });

  const createMutation = useMutation({
    mutationFn: productsApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "تم إضافة المنتج", description: `تم إضافة ${formData.name} بنجاح` });
      resetForm();
    },
    onError: (error: Error) => toast({ title: "خطأ", description: error.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Product> }) => productsApi.updateProduct(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "تم تحديث المنتج", description: "تم تحديث المنتج بنجاح" });
      resetForm();
    },
    onError: (error: Error) => toast({ title: "خطأ", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: productsApi.deleteProduct,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["products"] }); toast({ title: "تم حذف المنتج", description: "تم حذف المنتج بنجاح" }); },
    onError: (error: Error) => toast({ title: "خطأ", description: error.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setFormData({ name: "", price: "", stock: "", barcode: "", category_id: "" });
    setImageFile(null);
    setImagePreview(null);
  };

  const generateBarcode = () => setFormData((prev) => ({ ...prev, barcode: Math.floor(Math.random() * 1000000000).toString() }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast({ title: "خطأ في البيانات", description: "يرجى ملء اسم المنتج والسعر", variant: "destructive" });
      return;
    }
    try {
      let imageUrl = editingProduct?.image_url || undefined;
      if (imageFile) {
        if (editingProduct?.image_url) {
          await productsApi.deleteProductImage(editingProduct.image_url);
        }
        imageUrl = await productsApi.uploadProductImage(imageFile);
      }
      const productData = { name: formData.name, price: parseFloat(formData.price), stock: parseInt(formData.stock) || 0, barcode: formData.barcode || undefined, image_url: imageUrl, category_id: formData.category_id || undefined };
      if (editingProduct) updateMutation.mutate({ id: editingProduct.id, updates: productData });
      else createMutation.mutate(productData);
    } catch (err: any) {
      toast({ title: "خطأ في رفع الصورة", description: err.message, variant: "destructive" });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({ name: product.name, price: product.price.toString(), stock: product.stock.toString(), barcode: product.barcode || "", category_id: product.category_id || "" });
    setImageFile(null);
    setImagePreview(product.image_url || null);
    setIsDialogOpen(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleDelete = (id: string) => { if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) deleteMutation.mutate(id); };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortOrder("asc"); }
  };

  const filteredProducts = useMemo(() => {
    let result = [...allProducts];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((product) => product.name.toLowerCase().includes(term) || (product.barcode && product.barcode.includes(term)));
    }
    if (categoryFilter !== "all") result = result.filter((p) => p.category_id === categoryFilter);
    if (stockFilter === "low") result = result.filter((p) => p.stock > 0 && p.stock <= 5);
    else if (stockFilter === "out") result = result.filter((p) => p.stock === 0);
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) { case "name": comparison = a.name.localeCompare(b.name); break; case "price": comparison = a.price - b.price; break; case "stock": comparison = a.stock - b.stock; break; }
      return sortOrder === "asc" ? comparison : -comparison;
    });
    return result;
  }, [allProducts, searchTerm, categoryFilter, stockFilter, sortField, sortOrder]);

  const lowStockCount = allProducts.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const outOfStockCount = allProducts.filter((p) => p.stock === 0).length;
  const getCategoryById = (id?: string) => categories.find((c) => c.id === id);

  const getStockBadge = (stock: number) => {
    if (stock === 0) return <Badge variant="destructive">نفذ المخزون</Badge>;
    if (stock <= 5) return <Badge variant="outline" className="border-amber-500 text-amber-700"><AlertTriangle className="w-3 h-3 ml-1" />منخفض ({stock})</Badge>;
    return <Badge variant="secondary">متوفر: {stock}</Badge>;
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة المنتجات</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة منتجات المتجر والمخزون</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => { setEditingProduct(null); setFormData({ name: "", price: "", stock: "", barcode: "", category_id: "" }); setImageFile(null); setImagePreview(null); }}>
              <Plus className="w-4 h-4 ml-2" />إضافة منتج جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}</DialogTitle>
              <DialogDescription>{editingProduct ? "قم بتحديث بيانات المنتج" : "أدخل بيانات المنتج الجديد"}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="name">اسم المنتج *</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="أدخل اسم المنتج" required /></div>
                <div className="space-y-2"><Label htmlFor="price">السعر *</Label><Input id="price" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" required /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="stock">الكمية المتوفرة</Label><Input id="stock" type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} placeholder="0" /></div>
                <div className="space-y-2"><Label htmlFor="category_id">الفئة</Label>
                  <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                    <SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((cat: Category) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />{cat.name}</div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">الباركود</Label>
                <div className="flex gap-2">
                  <Input id="barcode" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} placeholder="الباركود" className="flex-1" dir="ltr" />
                  <Button type="button" variant="outline" onClick={generateBarcode}><Barcode className="w-4 h-4" /></Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>صورة المنتج</Label>
                {imagePreview ? (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                    <img src={imagePreview} alt="معاينة" className="w-full h-full object-cover" />
                    <Button type="button" variant="destructive" size="icon" className="absolute top-1 end-1 h-6 w-6 rounded-full" onClick={removeImage}><X className="w-3 h-3" /></Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                    <Image className="w-8 h-8 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500">اختر صورة</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                  </label>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={createMutation.isPending || updateMutation.isPending}>{editingProduct ? "تحديث" : "إضافة"}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>إلغاء</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-blue-50 border-blue-200"><CardContent className="p-4"><p className="text-sm text-blue-600 font-medium">إجمالي المنتجات</p><p className="text-2xl font-bold text-blue-900 mt-1">{allProducts.length}</p></CardContent></Card>
        <Card className="bg-amber-50 border-amber-200"><CardContent className="p-4"><p className="text-sm text-amber-600 font-medium">مخزون منخفض</p><p className="text-2xl font-bold text-amber-900 mt-1">{lowStockCount}</p></CardContent></Card>
        <Card className="bg-red-50 border-red-200"><CardContent className="p-4"><p className="text-sm text-red-600 font-medium">نفذ المخزون</p><p className="text-2xl font-bold text-red-900 mt-1">{outOfStockCount}</p></CardContent></Card>
        <Card className="bg-gray-50 border-gray-200"><CardContent className="p-4"><p className="text-sm text-gray-600 font-medium">عدد الفئات</p><p className="text-2xl font-bold text-gray-900 mt-1">{categories.length}</p></CardContent></Card>
      </div>

      <CategoryManagement />

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="ابحث بالاسم أو الباركود..." className="pr-10" />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-36"><Filter className="w-4 h-4 ml-2" /><SelectValue placeholder="الفئة" /></SelectTrigger>
                <SelectContent><SelectItem value="all">جميع الفئات</SelectItem>{categories.map((cat: Category) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={stockFilter} onValueChange={(v: any) => setStockFilter(v)}>
                <SelectTrigger className="w-36"><AlertTriangle className="w-4 h-4 ml-2" /><SelectValue placeholder="المخزون" /></SelectTrigger>
                <SelectContent><SelectItem value="all">جميع المنتجات</SelectItem><SelectItem value="low">مخزون منخفض</SelectItem><SelectItem value="out">نفذ المخزون</SelectItem></SelectContent>
              </Select>
              <div className="flex border rounded-md overflow-hidden">
                <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" className="rounded-none px-3" onClick={() => setViewMode("grid")}><LayoutGrid className="w-4 h-4" /></Button>
                <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" className="rounded-none px-3" onClick={() => setViewMode("list")}><List className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {productsLoading ? (viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}</div>
      ) : <Skeleton className="h-96 rounded-lg" />) : filteredProducts.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16 text-gray-400"><Package className="w-12 h-12 mb-4" /><p className="text-lg font-medium">لا توجد منتجات</p><p className="text-sm mt-1">{searchTerm || categoryFilter !== "all" || stockFilter !== "all" ? "جرب تغيير معايير البحث" : "أضف منتجات جديدة"}</p></CardContent></Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const category = getCategoryById(product.category_id);
            return (
              <Card key={product.id} className="hover:shadow-md transition-all duration-200 group overflow-hidden">
                {product.image_url && (
                  <div className="h-40 bg-gray-100 overflow-hidden">
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <CardHeader className={product.image_url ? "pb-1 pt-3" : "pb-3"}>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base text-gray-800 line-clamp-1 flex-1">{product.name}</CardTitle>
                    {category && <Badge variant="secondary" className="text-xs text-white border-0 shrink-0 mr-2" style={{ backgroundColor: category.color }}>{category.name}</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="flex justify-between items-center"><span className="text-sm text-gray-500">السعر</span><span className="text-lg font-bold text-blue-600">{product.price.toFixed(2)} {CURRENCY}</span></div>
                  <div className="flex justify-between items-center"><span className="text-sm text-gray-500">المخزون</span>{getStockBadge(product.stock)}</div>
                  {product.barcode && <div className="flex justify-between items-center"><span className="text-sm text-gray-500">الباركود</span><span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{product.barcode}</span></div>}
                  <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(product)} className="flex-1"><Edit className="w-3.5 h-3.5 ml-1" />تعديل</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(product.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right cursor-pointer" onClick={() => toggleSort("name")}><div className="flex items-center gap-1">المنتج<ArrowUpDown className="w-3 h-3" /></div></TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => toggleSort("price")}><div className="flex items-center gap-1">السعر<ArrowUpDown className="w-3 h-3" /></div></TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => toggleSort("stock")}><div className="flex items-center gap-1">المخزون<ArrowUpDown className="w-3 h-3" /></div></TableHead>
                <TableHead className="text-right">الفئة</TableHead>
                <TableHead className="text-right">الباركود</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const category = getCategoryById(product.category_id);
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-blue-600 font-semibold">{product.price.toFixed(2)} {CURRENCY}</TableCell>
                    <TableCell>{getStockBadge(product.stock)}</TableCell>
                    <TableCell>{category ? <Badge variant="secondary" className="text-xs text-white border-0" style={{ backgroundColor: category.color }}>{category.name}</Badge> : <span className="text-gray-400 text-sm">-</span>}</TableCell>
                    <TableCell>{product.barcode ? <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{product.barcode}</span> : <span className="text-gray-400 text-sm">-</span>}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(product)}><Edit className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(product.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
