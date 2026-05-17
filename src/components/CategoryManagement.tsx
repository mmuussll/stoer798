import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Plus, Edit, Trash2, Tag, AlertTriangle, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as categoriesApi from "@/api/categories";
import type { Category } from "@/types";

const PRESET_COLORS = [
  "#3B82F6", "#2563EB", "#06B6D4", "#10B981", "#059669",
  "#84CC16", "#EAB308", "#F59E0B", "#F97316", "#EF4444",
  "#DC2626", "#EC4899", "#8B5CF6", "#6366F1", "#4F46E5", "#6B7280",
];

export default function CategoryManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", color: "#3B82F6" });
  const [customColor, setCustomColor] = useState("");
  const [formError, setFormError] = useState("");

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.fetchCategories,
    staleTime: 5 * 60_000,
  });

  const createMutation = useMutation({
    mutationFn: categoriesApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "تم إضافة الفئة", description: `تم إضافة فئة ${formData.name} بنجاح` });
      resetForm();
    },
    onError: (error: Error) => toast({ title: "خطأ", description: error.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Category> }) => categoriesApi.updateCategory(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "تم تحديث الفئة", description: "تم تحديث الفئة بنجاح" });
      resetForm();
    },
    onError: (error: Error) => toast({ title: "خطأ", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: categoriesApi.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "تم حذف الفئة", description: "تم حذف الفئة بنجاح" });
      setDeletingCategory(null);
    },
    onError: (error: Error) => toast({ title: "خطأ", description: error.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    setFormData({ name: "", description: "", color: "#3B82F6" });
    setCustomColor("");
    setFormError("");
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) resetForm();
    else setIsDialogOpen(true);
  };

  const applyCustomColor = () => {
    const hex = customColor.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      setFormData({ ...formData, color: hex });
      setCustomColor("");
    } else if (hex) {
      toast({ title: "لون غير صالح", description: "أدخل كود HEX صحيح مثل #FF5733", variant: "destructive" });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = formData.name.trim();
    if (!trimmed) {
      setFormError("يرجى إدخال اسم الفئة");
      return;
    }
    const payload = {
      name: trimmed,
      description: formData.description.trim() || undefined,
      color: formData.color,
    };
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, updates: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, description: category.description || "", color: category.color });
    setCustomColor("");
    setFormError("");
    setIsDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingCategory) deleteMutation.mutate(deletingCategory.id);
  };

  const openNewDialog = () => {
    setEditingCategory(null);
    setFormData({ name: "", description: "", color: "#3B82F6" });
    setCustomColor("");
    setFormError("");
    setIsDialogOpen(true);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-blue-100" dir="rtl">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-primary/80">
            <Tag className="w-5 h-5" />
            الفئات ({categories.length})
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-primary/20 hover:bg-primary/5" onClick={openNewDialog}>
                <Plus className="w-4 h-4 ml-1" /> إضافة فئة
              </Button>
            </DialogTrigger>

            {/* ===== CATEGORY FORM DIALOG ===== */}
            <DialogContent className="sm:max-w-md p-0 gap-0" dir="rtl">
              {/* Header */}
              <div className="p-5 pb-2">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      {editingCategory ? <Edit className="w-4 h-4 text-primary" /> : <Tag className="w-4 h-4 text-primary" />}
                    </span>
                    {editingCategory ? "تعديل الفئة" : "إضافة فئة جديدة"}
                  </DialogTitle>
                  <DialogDescription className="mr-10">
                    {editingCategory ? "قم بتحديث بيانات الفئة" : "أنشئ فئة جديدة لتنظيم منتجاتك"}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <form onSubmit={handleSubmit} className="p-5 pt-2 space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="cat-name" className="text-sm font-medium">اسم الفئة <span className="text-red-500">*</span></Label>
                  <Input
                    id="cat-name"
                    value={formData.name}
                    onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setFormError(""); }}
                    placeholder="مثال: مشروبات، حلويات، ألبان..."
                    className={formError ? "border-red-400 focus-visible:ring-red-300" : ""}
                    autoFocus
                  />
                  {formError && <p className="text-xs text-red-500">{formError}</p>}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="cat-desc" className="text-sm font-medium">الوصف</Label>
                  <Input
                    id="cat-desc"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="وصف مختصر للفئة (اختياري)"
                  />
                </div>

                <Separator />

                {/* Color Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                    <Palette className="w-4 h-4 text-violet-500" />
                    اختر لون الفئة
                  </div>

                  {/* Live Preview Chip */}
                  <div className="flex justify-center">
                    <div
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm shadow-sm transition-all duration-200"
                      style={{ backgroundColor: formData.color }}
                    >
                      <span className="max-w-[160px] truncate">{formData.name || "اسم الفئة"}</span>
                      <span className="w-2 h-2 rounded-full bg-white/50" />
                    </div>
                  </div>

                  {/* Preset Colors */}
                  <div className="flex gap-1.5 flex-wrap justify-center">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-9 h-9 rounded-full border-2 transition-all ${
                          formData.color === color
                            ? "border-gray-800 scale-125 shadow-lg z-10"
                            : "border-transparent hover:scale-110 hover:shadow-md"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({ ...formData, color })}
                        title={color}
                      />
                    ))}
                  </div>

                  {/* Custom HEX Input */}
                  <div className="flex gap-2 items-center justify-center">
                    <div className="relative">
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60 font-mono">#</span>
                      <Input
                        value={customColor}
                        onChange={(e) => setCustomColor(e.target.value)}
                        placeholder="FF5733"
                        className="w-28 h-8 text-xs font-mono text-center pr-6"
                        maxLength={6}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyCustomColor(); } }}
                      />
                    </div>
                    <Button type="button" size="sm" variant="outline" onClick={applyCustomColor} className="h-8 text-xs">تطبيق</Button>
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button type="submit" className="flex-1 bg-gradient-brand hover:opacity-90 shadow-md" disabled={isPending}>
                    {isPending ? (
                      <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> جاري...</span>
                    ) : editingCategory ? "تحديث الفئة" : "إضافة الفئة"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={resetForm} className="text-muted-foreground">إلغاء</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground/60">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <Tag className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <p className="font-medium">لا توجد فئات</p>
            <p className="text-sm mt-1">أضف فئات لتنظيم منتجاتك</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-2 px-3 py-2 rounded-full text-white text-sm shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                style={{ backgroundColor: category.color }}
              >
                <span className="max-w-[120px] truncate font-medium">{category.name}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleEdit(category); }}
                  className="hover:bg-white/20 rounded-full p-1 transition-colors"
                  title="تعديل"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeletingCategory(category); }}
                  className="hover:bg-white/20 rounded-full p-1 transition-colors"
                  title="حذف"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingCategory} onOpenChange={(open) => { if (!open) setDeletingCategory(null); }}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              تأكيد الحذف
            </DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <p className="text-foreground/80">
              هل أنت متأكد من حذف فئة{" "}
              <span className="font-bold text-red-600">{deletingCategory?.name}</span>؟
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              المنتجات المرتبطة بهذه الفئة لن تحذف ولكن ستصبح بدون فئة.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="destructive" className="flex-1" onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "جاري الحذف..." : "نعم، احذف"}
            </Button>
            <Button variant="outline" onClick={() => setDeletingCategory(null)}>
              إلغاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
