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
import { Separator } from "@/components/ui/separator";
import {
  Package, Plus, Search, Edit, Trash2, Barcode, AlertTriangle,
  LayoutGrid, List, Filter, ArrowUpDown, X, Copy,
  Download, ZoomIn, MinusCircle, PlusCircle, CopyCheck,
  Info, Hash, ImagePlus, Save, RotateCcw, ChevronDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CategoryManagement from "./CategoryManagement";
import * as productsApi from "@/api/products";
import * as categoriesApi from "@/api/categories";
import { CURRENCY } from "@/constants";
import { formatNumber, formatCurrency, formatNumberDisplay, formatCurrencyDisplay, priceInWords } from "@/lib/format";
import { cn } from "@/lib/utils";
import { exportProductsCSV } from "@/lib/export";
import { useDebounce } from "@/hooks/useDebounce";
import type { Product, Category } from "@/types";

type ViewMode = "grid" | "list";
type SortField = "name" | "price" | "stock" | "created_at";
type SortOrder = "asc" | "desc";

export default function ProductManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: "", max: "" });
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [saveAndAdd, setSaveAndAdd] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [formData, setFormData] = useState({ name: "", price: "", wholesale_price: "", stock: "", barcode: "", description: "", unit: "قطعة", category_id: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ name?: string; price?: string }>({});

  const { data: allProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: productsApi.fetchProducts,
    staleTime: 2 * 60_000,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.fetchCategories,
    staleTime: 5 * 60_000,
  });

  const createMutation = useMutation({
    mutationFn: productsApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "تم إضافة المنتج", description: `تم إضافة ${formData.name} بنجاح` });
      if (saveAndAdd) {
        setFormData({ name: "", price: "", wholesale_price: "", stock: "", barcode: "", description: "", unit: "قطعة", category_id: "" });
        setImageFile(null);
        setImagePreview(null);
        setSaveAndAdd(false);
        setFormErrors({});
      } else {
        resetForm();
      }
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "تم حذف المنتج", description: "تم حذف المنتج بنجاح" });
      setDeleteTarget(null);
    },
    onError: (error: Error) => toast({ title: "خطأ", description: error.message, variant: "destructive" }),
  });

  const duplicateMutation = useMutation({
    mutationFn: productsApi.duplicateProduct,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "تم نسخ المنتج", description: `تم إنشاء نسخة من ${data.name}` });
    },
    onError: (error: Error) => toast({ title: "خطأ", description: error.message, variant: "destructive" }),
  });

  const stockMutation = useMutation({
    mutationFn: ({ id, stock }: { id: string; stock: number }) =>
      productsApi.updateProduct(id, { stock }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: Error) => toast({ title: "خطأ", description: error.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setFormData({ name: "", price: "", wholesale_price: "", stock: "", barcode: "", description: "", unit: "قطعة", category_id: "" });
    setImageFile(null);
    setImagePreview(null);
    setUploading(false);
    setSaveAndAdd(false);
    setFormErrors({});
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) resetForm();
    else setIsDialogOpen(true);
  };

  const generateBarcode = () => {
    setFormData((prev) => ({
      ...prev,
      barcode: String(Math.floor(100000000 + Math.random() * 900000000)),
    }));
  };

  const validateForm = (): boolean => {
    const errors: { name?: string; price?: string } = {};
    if (!formData.name.trim()) errors.name = "اسم المنتج مطلوب";
    const p = parseFloat(formData.price);
    if (isNaN(p) || p < 0) errors.price = "يرجى إدخال سعر صحيح";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent, addAnother = false) => {
    e.preventDefault();
    if (!validateForm()) return;

    const trimmedName = formData.name.trim();
    const priceNum = parseFloat(formData.price);

    try {
      let imageUrl = editingProduct?.image_url || undefined;

      if (imageFile) {
        setUploading(true);
        if (editingProduct?.image_url) {
          await productsApi.deleteProductImage(editingProduct.image_url).catch(() => {});
        }
        imageUrl = await productsApi.uploadProductImage(imageFile);
        setUploading(false);
      }

      const productData = {
        name: trimmedName,
        price: priceNum,
        wholesale_price: formData.wholesale_price ? parseFloat(formData.wholesale_price) : undefined,
        stock: parseInt(formData.stock) || 0,
        barcode: formData.barcode.trim() || undefined,
        image_url: imageUrl,
        description: formData.description.trim() || undefined,
        unit: formData.unit.trim() || undefined,
        category_id: formData.category_id || undefined,
      };

      if (editingProduct) {
        updateMutation.mutate({ id: editingProduct.id, updates: productData });
      } else {
        if (addAnother) setSaveAndAdd(true);
        createMutation.mutate(productData);
      }
    } catch (err: unknown) {
      setUploading(false);
      toast({ title: "خطأ في رفع الصورة", description: (err as Error).message, variant: "destructive" });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      wholesale_price: product.wholesale_price?.toString() || "",
      stock: product.stock.toString(),
      barcode: product.barcode || "",
      description: product.description || "",
      unit: product.unit || "قطعة",
      category_id: product.category_id || "",
    });
    setImageFile(null);
    setImagePreview(product.image_url || null);
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleOpenNew = () => {
    setEditingProduct(null);
    setFormData({ name: "", price: "", wholesale_price: "", stock: "", barcode: "", description: "", unit: "قطعة", category_id: "" });
    setImageFile(null);
    setImagePreview(null);
    setFormErrors({});
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "حجم الصورة كبير", description: "الحد الأقصى 5 ميجابايت", variant: "destructive" });
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleDelete = () => {
    if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
  };

  const handleDuplicate = (product: Product) => {
    duplicateMutation.mutate(product.id);
  };

  const handleStockAdjust = (product: Product, delta: number) => {
    const newStock = Math.max(0, product.stock + delta);
    stockMutation.mutate({ id: product.id, stock: newStock });
  };

  const copyBarcode = async (barcode: string) => {
    try {
      await navigator.clipboard.writeText(barcode);
      toast({ title: "تم النسخ", description: "تم نسخ الباركود إلى الحافظة" });
    } catch {
      toast({ title: "خطأ", description: "فشل نسخ الباركود", variant: "destructive" });
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortOrder("asc"); }
  };

  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    if (debouncedSearch.trim()) {
      const term = debouncedSearch.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(term) || (p.barcode && p.barcode.includes(term))
      );
    }

    if (categoryFilter !== "all") result = result.filter((p) => p.category_id === categoryFilter);

    if (stockFilter === "low") result = result.filter((p) => p.stock > 0 && p.stock <= 5);
    else if (stockFilter === "out") result = result.filter((p) => p.stock === 0);

    const minPrice = parseFloat(priceRange.min);
    const maxPrice = parseFloat(priceRange.max);
    if (!isNaN(minPrice)) result = result.filter((p) => p.price >= minPrice);
    if (!isNaN(maxPrice)) result = result.filter((p) => p.price <= maxPrice);

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name": comparison = a.name.localeCompare(b.name, "ar"); break;
        case "price": comparison = a.price - b.price; break;
        case "stock": comparison = a.stock - b.stock; break;
        case "created_at": comparison = (a.created_at || "").localeCompare(b.created_at || ""); break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [allProducts, debouncedSearch, categoryFilter, stockFilter, priceRange, sortField, sortOrder]);

  const { lowStockCount, outOfStockCount, totalStockValue } = useMemo(() => ({
    lowStockCount: allProducts.filter((p) => p.stock > 0 && p.stock <= 5).length,
    outOfStockCount: allProducts.filter((p) => p.stock === 0).length,
    totalStockValue: allProducts.reduce((sum, p) => sum + p.price * p.stock, 0),
  }), [allProducts]);
  const getCategoryById = (id?: string) => categories.find((c) => c.id === id);

  const getStockBadge = (stock: number) => {
    if (stock === 0) return <Badge variant="destructive">نفذ المخزون</Badge>;
    if (stock <= 5) return <Badge variant="outline" className="border-amber-500 text-amber-700"><AlertTriangle className="w-3 h-3 ml-1" />منخفض ({stock})</Badge>;
    return <Badge variant="secondary">متوفر: {stock}</Badge>;
  };

  const isMutating = createMutation.isPending || updateMutation.isPending || uploading;
  const selectedCategory = categories.find((c) => c.id === formData.category_id);
  const currentPrice = parseFloat(formData.price) || 0;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة المنتجات</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة منتجات المتجر والمخزون</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportProductsCSV(allProducts, categories)}
            className="gap-1"
            disabled={allProducts.length === 0}
          >
            <Download className="w-4 h-4" /> تصدير CSV
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleOpenNew}>
                <Plus className="w-4 h-4 ml-2" />إضافة منتج جديد
              </Button>
            </DialogTrigger>

            {/* ===== PRODUCT FORM DIALOG ===== */}
            <DialogContent className="sm:max-w-xl max-h-[92vh] overflow-y-auto p-0 gap-0 max-sm:mx-2 max-sm:w-[calc(100%-16px)]" dir="rtl">
              {/* Dialog Header */}
              <div className="p-6 pb-2">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      {editingProduct ? <Edit className="w-4 h-4 text-blue-600" /> : <Plus className="w-4 h-4 text-blue-600" />}
                    </span>
                    {editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}
                  </DialogTitle>
                  <DialogDescription className="mr-10">
                    {editingProduct ? "قم بتحديث بيانات المنتج" : "أدخل بيانات المنتج الجديد للمخزون"}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <form onSubmit={(e) => handleSubmit(e)} className="p-6 pt-0">
                {/* SECTION: Basic Info */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
                    <Info className="w-4 h-4 text-blue-500" />
                    المعلومات الأساسية
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">اسم المنتج <span className="text-red-500">*</span></Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setFormErrors((p) => ({ ...p, name: undefined })); }}
                        placeholder="مثال: قهوة تركية 250g"
                        className={formErrors.name ? "border-red-400 focus-visible:ring-red-300" : ""}
                        autoFocus
                      />
                      {formErrors.name && <p className="text-xs text-red-500">{formErrors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-sm font-medium">السعر ({CURRENCY}) <span className="text-red-500">*</span></Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.001"
                        min="0"
                        value={formData.price}
                        onChange={(e) => { setFormData({ ...formData, price: e.target.value }); setFormErrors((p) => ({ ...p, price: undefined })); }}
                        placeholder="أدخل السعر"
                        className={formErrors.price ? "border-red-400 focus-visible:ring-red-300" : ""}
                      />
                      {formErrors.price && <p className="text-xs text-red-500">{formErrors.price}</p>}
                      {currentPrice > 0 && (
                        <p className="text-xs text-emerald-600 font-medium">{priceInWords(currentPrice)}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="wholesale_price" className="text-sm font-medium">سعر الجملة ({CURRENCY})</Label>
                    <Input
                      id="wholesale_price"
                      type="number"
                      step="0.001"
                      min="0"
                      value={formData.wholesale_price}
                      onChange={(e) => setFormData({ ...formData, wholesale_price: e.target.value })}
                      placeholder="أدخل سعر الجملة (اختياري)"
                      className="mt-2"
                    />
                  </div>
                </div>

                <Separator className="mb-4" />

                {/* SECTION: Stock & Category */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
                    <Package className="w-4 h-4 text-emerald-500" />
                    المخزون والتصنيف
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stock" className="text-sm font-medium">الكمية المتوفرة</Label>
                      <div className="flex gap-1">
                        <Button type="button" size="icon" variant="outline" className="h-10 w-10 shrink-0 rounded-l-none" onClick={() => setFormData({ ...formData, stock: String(Math.max(0, (parseInt(formData.stock) || 0) - 1)) })}><MinusCircle className="w-4 h-4" /></Button>
                        <Input id="stock" type="number" min="0" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} placeholder="0" className="text-center rounded-none" />
                        <Button type="button" size="icon" variant="outline" className="h-10 w-10 shrink-0 rounded-r-none" onClick={() => setFormData({ ...formData, stock: String((parseInt(formData.stock) || 0) + 1) })}><PlusCircle className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit" className="text-sm font-medium">الوحدة</Label>
                      <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                        <SelectTrigger id="unit"><SelectValue placeholder="اختر الوحدة..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="قطعة">قطعة</SelectItem>
                          <SelectItem value="كرتون">كرتون</SelectItem>
                          <SelectItem value="كيس">كيس</SelectItem>
                          <SelectItem value="علبة">علبة</SelectItem>
                          <SelectItem value="كيلو">كيلو</SelectItem>
                          <SelectItem value="لتر">لتر</SelectItem>
                          <SelectItem value="دستة">دستة</SelectItem>
                          <SelectItem value="طقم">طقم</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="category_id" className="text-sm font-medium">الفئة</Label>
                      <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                        <SelectTrigger><SelectValue placeholder="اختر الفئة..." /></SelectTrigger>
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
                </div>

                <Separator className="mb-4" />

                {/* SECTION: Barcode */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
                    <Hash className="w-4 h-4 text-violet-500" />
                    الباركود
                  </div>
                  <div className="flex gap-2">
                    <Input id="barcode" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} placeholder="أدخل الباركود أو قم بتوليده" className="flex-1" dir="ltr" />
                    <Button type="button" variant="outline" onClick={generateBarcode} className="gap-1 shrink-0" title="توليد باركود عشوائي"><Barcode className="w-4 h-4" /> توليد</Button>
                  </div>
                </div>

                <Separator className="mb-4" />

                {/* SECTION: Description */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
                    <Info className="w-4 h-4 text-teal-500" />
                    الوصف
                  </div>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="وصف المنتج، ملاحظات، تفاصيل إضافية..."
                  />
                </div>

                <Separator className="mb-4" />

                {/* SECTION: Image */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
                    <ImagePlus className="w-4 h-4 text-pink-500" />
                    صورة المنتج
                  </div>
                  {imagePreview ? (
                    <div className="flex gap-4 items-start">
                      <div className="relative w-40 h-40 rounded-xl overflow-hidden border-2 border-blue-200 shadow-sm group">
                        <img src={imagePreview} alt="معاينة" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                        </div>
                        <Button type="button" variant="destructive" size="icon" className="absolute top-1.5 end-1.5 h-7 w-7 rounded-full shadow-md" onClick={removeImage}><X className="w-3.5 h-3.5" /></Button>
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-sm text-gray-600">تم اختيار الصورة</p>
                        <label className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
                          <RotateCcw className="w-3 h-3" /> تغيير الصورة
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all group">
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-2 group-hover:bg-blue-100 transition-colors">
                        <ImagePlus className="w-6 h-6 text-blue-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">اسحب الصورة هنا أو اضغط للاختيار</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG حتى 5MB</p>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                    </label>
                  )}
                  {uploading && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      جاري رفع الصورة...
                    </div>
                  )}
                </div>

                {/* Live Preview Card */}
                {formData.name && (
                  <>
                <Separator className="mb-4" />

                {/* SECTION: Description */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
                    <Info className="w-4 h-4 text-teal-500" />
                    الوصف
                  </div>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="وصف المنتج، ملاحظات، تفاصيل إضافية..."
                  />
                </div>

                <Separator className="mb-4" />
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
                        <LayoutGrid className="w-4 h-4 text-gray-400" />
                        معاينة المنتج في الشبكة
                      </div>
                      <div className="max-w-[220px] mx-auto">
                        <Card className="overflow-hidden border border-gray-200 rounded-xl">
                          {imagePreview ? (
                            <div className="h-28 bg-gray-100 overflow-hidden">
                              <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="h-20 bg-gradient-to-br from-slate-50 to-blue-50/50 flex items-center justify-center">
                              <Package className="w-8 h-8 text-slate-300" />
                            </div>
                          )}
                          <CardContent className="p-3 space-y-1.5">
                            <h4 className="font-semibold text-sm text-gray-800 line-clamp-1">{formData.name || "اسم المنتج"}</h4>
                            <p className="text-base font-bold text-blue-600">{currentPrice > 0 ? formatCurrency(currentPrice) : formatCurrencyDisplay(0)}</p>
                            <div className="flex gap-1 flex-wrap">
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{formData.stock ? `متوفر: ${formData.stock}` : "متوفر: 0"}</Badge>
                              {selectedCategory && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-white border-0" style={{ backgroundColor: selectedCategory.color }}>
                                  {selectedCategory.name}
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </>
                )}

                {/* ACTION BUTTONS */}
                <div className="flex gap-2 pt-2 border-t pt-4 sticky bottom-0 bg-white">
                  {!editingProduct && (
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-1"
                      onClick={(e) => handleSubmit(e as never, true)}
                      disabled={isMutating}
                    >
                      <Save className="w-4 h-4" /> حفظ وإضافة آخر
                    </Button>
                  )}
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-sm" disabled={isMutating}>
                    {isMutating ? (
                      <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> جاري...</span>
                    ) : editingProduct ? "تحديث المنتج" : "إضافة المنتج"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={resetForm} className="text-gray-500">إلغاء</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-600 font-medium">إجمالي المنتجات</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{allProducts.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <p className="text-sm text-amber-600 font-medium">مخزون منخفض</p>
            <p className="text-2xl font-bold text-amber-900 mt-1">{lowStockCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <p className="text-sm text-red-600 font-medium">نفذ المخزون</p>
            <p className="text-2xl font-bold text-red-900 mt-1">{outOfStockCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4">
            <p className="text-sm text-emerald-600 font-medium">قيمة المخزون</p>
            <p className="text-2xl font-bold text-emerald-900 mt-1">{formatCurrencyDisplay(totalStockValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Management */}
      <CategoryManagement />

      {/* Filters Card */}
      <Card>
        <CardContent className="p-3 lg:p-4 space-y-3">
          {/* Row 1: Search + View Toggle */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="ابحث بالاسم أو الباركود..." className="pr-10 h-9 lg:h-10" />
            </div>
            <div className="flex border rounded-md overflow-hidden shrink-0">
              <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" className="rounded-none px-2.5 h-9" onClick={() => setViewMode("grid")}><LayoutGrid className="w-4 h-4" /></Button>
              <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" className="rounded-none px-2.5 h-9" onClick={() => setViewMode("list")}><List className="w-4 h-4" /></Button>
            </div>
          </div>

          {/* Row 2: Category chips + toggle advanced */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5 overflow-x-auto flex-1 scrollbar-thin pb-1">
              <Button variant={categoryFilter === "all" ? "default" : "outline"} size="sm"
                onClick={() => setCategoryFilter("all")}
                className={cn("h-8 text-xs px-3 shrink-0", categoryFilter === "all" ? "bg-blue-600 hover:bg-blue-700" : "")}>الكل</Button>
              {categories.map((cat: Category) => (
                <Button key={cat.id} variant={categoryFilter === cat.id ? "default" : "outline"} size="sm"
                  onClick={() => setCategoryFilter(cat.id)}
                  className="h-8 text-xs px-3 shrink-0"
                  style={categoryFilter === cat.id ? { backgroundColor: cat.color, borderColor: cat.color } : undefined}>{cat.name}</Button>
              ))}
            </div>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-1 shrink-0 h-8 px-2.5 rounded-lg text-xs font-medium border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">فلاتر</span>
              <ChevronDown className={cn("w-3 h-3 transition-transform", showAdvancedFilters && "rotate-180")} />
            </button>
          </div>

          {/* Collapsible: Stock + Price Range */}
          {showAdvancedFilters && (
            <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-slate-100 animate-scale-in">
              <Select value={stockFilter} onValueChange={(v) => setStockFilter(v as "all" | "low" | "out")}>
                <SelectTrigger className="w-full sm:w-40 h-9 text-xs"><AlertTriangle className="w-3.5 h-3.5 ml-1.5" /><SelectValue placeholder="المخزون" /></SelectTrigger>
                <SelectContent><SelectItem value="all">جميع المنتجات</SelectItem><SelectItem value="low">مخزون منخفض</SelectItem><SelectItem value="out">نفذ المخزون</SelectItem></SelectContent>
              </Select>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="shrink-0">السعر:</span>
                <Input type="number" min="0" step="0.001" placeholder="من" value={priceRange.min} onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })} className="w-20 h-8 text-xs" />
                <span>-</span>
                <Input type="number" min="0" step="0.001" placeholder="إلى" value={priceRange.max} onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })} className="w-20 h-8 text-xs" />
                {(priceRange.min || priceRange.max) && (
                  <Button variant="ghost" size="sm" onClick={() => setPriceRange({ min: "", max: "" })} className="h-7 text-[10px] text-red-500 px-1.5"><X className="w-3 h-3 ml-0.5" />مسح</Button>
                )}
              </div>
              <span className="text-[11px] text-gray-400 mr-auto self-center shrink-0">{filteredProducts.length} منتج</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content */}
      {productsLoading ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
          </div>
        ) : <Skeleton className="h-96 rounded-lg" />
      ) : filteredProducts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Package className="w-12 h-12 mb-4" />
            <p className="text-lg font-medium">لا توجد منتجات</p>
            <p className="text-sm mt-1">{searchTerm || categoryFilter !== "all" || stockFilter !== "all" || priceRange.min || priceRange.max ? "جرب تغيير معايير البحث" : "أضف منتجات جديدة للبدء"}</p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const category = getCategoryById(product.category_id);
            return (
              <Card key={product.id} className="hover:shadow-md transition-all duration-200 group overflow-hidden">
                {product.image_url && (
                  <div
                    className="h-40 bg-gray-100 overflow-hidden cursor-pointer relative"
                    onClick={() => setZoomedImage(product.image_url!)}
                  >
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover lg:group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    <div className="absolute inset-0 bg-black/0 lg:group-hover:bg-black/10 transition-colors hidden lg:flex items-center justify-center">
                      <ZoomIn className="w-5 h-5 text-white opacity-0 lg:group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                  </div>
                )}
                <CardHeader className={product.image_url ? "pb-1 pt-3" : "pb-3"}>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base text-gray-800 line-clamp-1 flex-1">{product.name}</CardTitle>
                    {category && (
                      <Badge variant="secondary" className="text-xs text-white border-0 shrink-0 mr-2" style={{ backgroundColor: category.color }}>
                        {category.name}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">السعر</span>
                    <span className="text-lg font-bold text-blue-600">{formatCurrency(product.price)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">المخزون</span>
                    {getStockBadge(product.stock)}
                  </div>
                  {product.barcode && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">الباركود</span>
                      <button
                        onClick={() => copyBarcode(product.barcode!)}
                        className="text-xs font-mono bg-gray-100 px-2 py-1 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-1"
                        title="نسخ الباركود"
                      >
                        {product.barcode} <CopyCheck className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span>الكمية:</span>
                    <button onClick={() => handleStockAdjust(product, -1)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 hover:text-red-500 active:bg-red-100 transition-colors" title="إنقاص 1"><MinusCircle className="w-4 h-4" /></button>
                    <span className="font-bold text-gray-600 w-6 text-center">{product.stock}</span>
                    <button onClick={() => handleStockAdjust(product, 1)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-green-50 hover:text-green-500 active:bg-green-100 transition-colors" title="زيادة 1"><PlusCircle className="w-4 h-4" /></button>
                    <button onClick={() => handleStockAdjust(product, 5)} className="px-1.5 h-6 flex items-center justify-center rounded-md hover:bg-green-50 hover:text-green-600 active:bg-green-100 transition-colors text-[11px] font-bold" title="زيادة 5">+5</button>
                    <button onClick={() => handleStockAdjust(product, -5)} className="px-1.5 h-6 flex items-center justify-center rounded-md hover:bg-red-50 hover:text-red-600 active:bg-red-100 transition-colors text-[11px] font-bold" title="إنقاص 5">-5</button>
                  </div>
                  <div className="flex gap-2 pt-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(product)} className="flex-1"><Edit className="w-3.5 h-3.5 ml-1" />تعديل</Button>
                    <Button size="sm" variant="outline" onClick={() => handleDuplicate(product)} disabled={duplicateMutation.isPending} title="نسخ المنتج"><Copy className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(product)}><Trash2 className="w-3.5 h-3.5" /></Button>
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
                <TableHead className="text-right w-10">#</TableHead>
                <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort("name")}><div className="flex items-center gap-1">المنتج<ArrowUpDown className="w-3 h-3" /></div></TableHead>
                <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort("price")}><div className="flex items-center gap-1">السعر<ArrowUpDown className="w-3 h-3" /></div></TableHead>
                <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort("stock")}><div className="flex items-center gap-1">المخزون<ArrowUpDown className="w-3 h-3" /></div></TableHead>
                <TableHead className="text-right hidden sm:table-cell">الفئة</TableHead>
                <TableHead className="text-right hidden sm:table-cell">الباركود</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product, idx) => {
                const category = getCategoryById(product.category_id);
                return (
                  <TableRow key={product.id}>
                    <TableCell className="text-gray-400 text-xs">{idx + 1}</TableCell>
                    <TableCell className="font-medium flex items-center gap-2">
                      {product.image_url && (
                        <img src={product.image_url} alt="" className="w-8 h-8 rounded object-cover cursor-pointer" onClick={() => setZoomedImage(product.image_url!)} />
                      )}
                      {product.name}
                    </TableCell>
                    <TableCell className="text-blue-600 font-semibold">{formatCurrency(product.price)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleStockAdjust(product, -1)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"><MinusCircle className="w-4 h-4" /></button>
                        {getStockBadge(product.stock)}
                        <button onClick={() => handleStockAdjust(product, 1)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-green-50 hover:text-green-500 transition-colors"><PlusCircle className="w-4 h-4" /></button>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {category ? (
                        <Badge variant="secondary" className="text-xs text-white border-0" style={{ backgroundColor: category.color }}>{category.name}</Badge>
                      ) : <span className="text-gray-400 text-sm">-</span>}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {product.barcode ? (
                        <button onClick={() => copyBarcode(product.barcode!)} className="text-xs font-mono bg-gray-100 px-2 py-1 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors inline-flex items-center gap-1" title="نسخ">
                          {product.barcode} <CopyCheck className="w-3 h-3" />
                        </button>
                      ) : <span className="text-gray-400 text-sm">-</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-0.5">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleEdit(product)} title="تعديل"><Edit className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleDuplicate(product)} disabled={duplicateMutation.isPending} title="نسخ"><Copy className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteTarget(product)} title="حذف"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Image Zoom Dialog */}
      <Dialog open={!!zoomedImage} onOpenChange={(open) => { if (!open) setZoomedImage(null); }}>
        <DialogContent className="max-w-2xl p-1 bg-black/90" dir="ltr">
          <button onClick={() => setZoomedImage(null)} className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/20 hover:bg-white/40 transition-colors text-white">
            <X className="w-5 h-5" />
          </button>
          {zoomedImage && (
            <img src={zoomedImage} alt="عرض الصورة" className="w-full max-h-[70vh] object-contain rounded" />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              تأكيد الحذف
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف المنتج{" "}
              <span className="font-bold text-red-600">{deleteTarget?.name}</span>؟
              هذا الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "جاري الحذف..." : "نعم، احذف"}
            </Button>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>إلغاء</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
