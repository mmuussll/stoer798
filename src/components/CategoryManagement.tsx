import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as categoriesApi from "@/api/categories";
import type { Category } from "@/types";

export default function CategoryManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", color: "#3B82F6" });

  const { data: categories = [], isLoading } = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.fetchCategories });

  const createMutation = useMutation({
    mutationFn: categoriesApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "تم إضافة الفئة", description: `تم إضافة فئة ${formData.name} بنجاح` });
      setIsDialogOpen(false);
      setFormData({ name: "", description: "", color: "#3B82F6" });
    },
    onError: (error: Error) => toast({ title: "خطأ", description: error.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Category> }) => categoriesApi.updateCategory(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "تم تحديث الفئة", description: "تم تحديث الفئة بنجاح" });
      setIsDialogOpen(false);
      setEditingCategory(null);
      setFormData({ name: "", description: "", color: "#3B82F6" });
    },
    onError: (error: Error) => toast({ title: "خطأ", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: categoriesApi.deleteCategory,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["categories"] }); toast({ title: "تم حذف الفئة", description: "تم حذف الفئة بنجاح" }); },
    onError: (error: Error) => toast({ title: "خطأ", description: error.message, variant: "destructive" }),
  });

  const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#84CC16", "#F97316"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) { toast({ title: "خطأ في البيانات", description: "يرجى إدخال اسم الفئة", variant: "destructive" }); return; }
    if (editingCategory) updateMutation.mutate({ id: editingCategory.id, updates: { name: formData.name, description: formData.description, color: formData.color } });
    else createMutation.mutate({ name: formData.name, description: formData.description, color: formData.color });
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, description: category.description || "", color: category.color });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => deleteMutation.mutate(id);

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-blue-800"><Tag className="w-5 h-5" />الفئات ({categories.length})</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-blue-200 hover:bg-blue-50" onClick={() => { setEditingCategory(null); setFormData({ name: "", description: "", color: "#3B82F6" }); }}>
                <Plus className="w-4 h-4 ml-1" /> إضافة فئة
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader><DialogTitle>{editingCategory ? "تعديل الفئة" : "إضافة فئة جديدة"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label htmlFor="cat-name">اسم الفئة *</Label><Input id="cat-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="أدخل اسم الفئة" required /></div>
                <div><Label htmlFor="cat-desc">الوصف</Label><Input id="cat-desc" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="وصف الفئة" /></div>
                <div><Label>اللون</Label><div className="flex gap-2 mt-2">{colors.map((color) => (
                  <button key={color} type="button" className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === color ? "border-gray-800 scale-125" : "border-transparent"}`} style={{ backgroundColor: color }} onClick={() => setFormData({ ...formData, color })} />
                ))}</div></div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500" disabled={createMutation.isPending || updateMutation.isPending}>{editingCategory ? "تحديث" : "إضافة"}</Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? <div className="text-center py-6 text-gray-500">جاري التحميل...</div> : categories.length === 0 ? (
          <div className="text-center py-6 text-gray-500"><Tag className="w-8 h-8 mx-auto mb-2 text-gray-300" /><p>لا توجد فئات</p></div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-sm" style={{ backgroundColor: category.color }}>
                <span>{category.name}</span>
                <button onClick={(e) => { e.stopPropagation(); handleEdit(category); }} className="hover:bg-white/20 rounded p-0.5"><Edit className="w-3 h-3" /></button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(category.id); }} className="hover:bg-white/20 rounded p-0.5"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
