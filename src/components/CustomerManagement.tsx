import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
} from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User2, Plus, Pencil, Trash2, Search, Users, Phone, MapPin,
  Star, ShoppingBag, Award, TrendingUp, AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as customersApi from "@/api/customers";
import { CURRENCY } from "@/constants";
import { formatNumber, formatCurrency, formatNumberDisplay, formatCurrencyDisplay } from "@/lib/format";
import type { Customer } from "@/types";

interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  note: string;
}

const EMPTY_FORM: CustomerFormData = { name: "", phone: "", email: "", address: "", note: "" };

export default function CustomerManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [showAddEditDialog, setShowAddEditDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>(EMPTY_FORM);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 15;

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => customersApi.fetchCustomers(),
    staleTime: 2 * 60_000,
  });

  const addEditMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: formData.name,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        address: formData.address || undefined,
        note: formData.note || undefined,
      };
      if (editingCustomer) return customersApi.updateCustomer(editingCustomer.id, payload);
      return customersApi.createCustomer(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: editingCustomer ? "تم تحديث الزبون" : "تمت إضافة الزبون" });
      resetForm();
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customersApi.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "تم حذف الزبون" });
      setDeletingCustomer(null);
      setShowDeleteDialog(false);
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setEditingCustomer(null);
    setFormData(EMPTY_FORM);
    setShowAddEditDialog(false);
  };

  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      phone: c.phone || "",
      email: c.email || "",
      address: c.address || "",
      note: c.note || "",
    });
    setShowAddEditDialog(true);
  };

  const openAdd = () => {
    setEditingCustomer(null);
    setFormData(EMPTY_FORM);
    setShowAddEditDialog(true);
  };

  const updateFormField = (field: keyof CustomerFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const { filtered, totalPages, paginated, stats } = useMemo(() => {
    const f = customers.filter((c) => {
      if (!searchTerm.trim()) return true;
      const t = searchTerm.toLowerCase();
      return c.name.toLowerCase().includes(t) || (c.phone && c.phone.includes(t));
    });
    const tp = Math.ceil(f.length / perPage);
    const p = f.slice((page - 1) * perPage, page * perPage);
    const s = customers.reduce(
      (acc, c) => ({
        total: acc.total + 1,
        purchases: acc.purchases + c.total_purchases,
        visits: acc.visits + c.total_visits,
        points: acc.points + c.points,
      }),
      { total: 0, purchases: 0, visits: 0, points: 0 }
    );
    return { filtered: f, totalPages: tp, paginated: p, stats: s };
  }, [customers, searchTerm, page]);

  return (
    <div className="space-y-4 p-4" dir="rtl">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="w-8 h-8 opacity-80" />
            <div><div className="text-2xl font-bold">{stats.total}</div><div className="text-xs opacity-80">إجمالي الزبائن</div></div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-4 flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 opacity-80" />
            <div><div className="text-2xl font-bold">{formatNumberDisplay(stats.purchases, 0)}</div><div className="text-xs opacity-80">إجمالي المشتريات ({CURRENCY})</div></div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 opacity-80" />
            <div><div className="text-2xl font-bold">{stats.visits}</div><div className="text-xs opacity-80">إجمالي الزيارات</div></div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardContent className="p-4 flex items-center gap-3">
            <Award className="w-8 h-8 opacity-80" />
            <div><div className="text-2xl font-bold">{stats.points.toLocaleString()}</div><div className="text-xs opacity-80">إجمالي النقاط</div></div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Add */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} placeholder="ابحث بالاسم أو رقم الهاتف..." className="pr-10" />
        </div>
        <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 gap-2"><Plus className="w-4 h-4" />إضافة زبون</Button>
      </div>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Users className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">لا يوجد زبائن</p>
              <p className="text-sm mb-4">{searchTerm ? "جرب تغيير معايير البحث" : "أضف أول زبون لبدء التتبع"}</p>
              {!searchTerm && <Button onClick={openAdd} variant="outline"><Plus className="w-4 h-4 ml-2" />إضافة أول زبون</Button>}
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الزبون</TableHead>
                  <TableHead className="text-right">الهاتف</TableHead>
                  <TableHead className="text-center">الزيارات</TableHead>
                  <TableHead className="text-center">المشتريات</TableHead>
                  <TableHead className="text-center hidden sm:table-cell">النقاط</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((c) => (
                  <TableRow key={c.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                          <User2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{c.name}</div>
                          {c.address && <div className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> {c.address}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {c.phone ? (
                        <div className="flex items-center gap-1 text-sm"><Phone className="w-3 h-3 text-gray-400" /> {c.phone}</div>
                      ) : <span className="text-gray-300">-</span>}
                    </TableCell>
                    <TableCell className="text-center"><Badge variant="secondary">{c.total_visits}</Badge></TableCell>
                    <TableCell className="text-center font-medium">{formatCurrency(c.total_purchases, 2)}</TableCell>
                    <TableCell className="text-center hidden sm:table-cell">
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        <Star className="w-3 h-3 ml-0.5 fill-amber-400" /> {c.points}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-blue-600 hover:bg-blue-50 active:bg-blue-100 rounded-xl" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-red-500 hover:bg-red-50 active:bg-red-100 rounded-xl" onClick={() => { setDeletingCustomer(c); setShowDeleteDialog(true); }}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>السابق</PaginationLink>
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => (
              <PaginationItem key={i}>
                <PaginationLink onClick={() => setPage(i + 1)} isActive={page === i + 1}>{i + 1}</PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationLink onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>التالي</PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddEditDialog} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent dir="rtl" className="max-w-md max-sm:mx-2 max-sm:w-[calc(100%-16px)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><User2 className="w-5 h-5 text-blue-600" />{editingCustomer ? "تعديل بيانات الزبون" : "إضافة زبون جديد"}</DialogTitle>
            <DialogDescription>{editingCustomer ? "عدل بيانات الزبون الحالي" : "أدخل بيانات الزبون الجديد"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">الاسم <span className="text-red-500">*</span></label>
              <Input value={formData.name} onChange={(e) => updateFormField("name", e.target.value)} placeholder="اسم الزبون الكامل" autoFocus />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">رقم الهاتف</label>
              <Input value={formData.phone} onChange={(e) => updateFormField("phone", e.target.value)} placeholder="07xxxxxxxxx" dir="ltr" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">البريد الإلكتروني</label>
              <Input value={formData.email} onChange={(e) => updateFormField("email", e.target.value)} placeholder="example@email.com" dir="ltr" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">العنوان</label>
              <Input value={formData.address} onChange={(e) => updateFormField("address", e.target.value)} placeholder="العنوان الكامل" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">ملاحظات</label>
              <Input value={formData.note} onChange={(e) => updateFormField("note", e.target.value)} placeholder="ملاحظات إضافية" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={resetForm}>إلغاء</Button>
            <Button onClick={() => addEditMutation.mutate()} disabled={!formData.name.trim() || addEditMutation.isPending} className="bg-blue-600">
              {addEditMutation.isPending ? "جاري..." : editingCustomer ? "حفظ التغييرات" : "إضافة الزبون"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent dir="rtl" className="max-w-sm max-sm:mx-2 max-sm:w-[calc(100%-16px)]">
          <DialogHeader>
            <DialogTitle className="text-red-600">حذف الزبون</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف "{deletingCustomer?.name}"؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          {deletingCustomer && deletingCustomer.total_debt > 0 && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">تنبيه: ديون مستحقة</p>
                <p className="text-xs mt-0.5">على هذا الزبون دين بقيمة <strong>{formatCurrency(deletingCustomer.total_debt)}</strong>. سيتم حذف الزبون مع فقدان سجل الديون المرتبط به.</p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={() => deletingCustomer && deleteMutation.mutate(deletingCustomer.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "جاري..." : "تأكيد الحذف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
