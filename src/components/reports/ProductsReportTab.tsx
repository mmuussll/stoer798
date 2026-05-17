import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, Package, DollarSign, Activity, FileText, ShoppingCart } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { ArabicXAxisTick, type XAxisTickProps } from "@/components/charts/ArabicXAxisTick";
import { formatCurrency } from "@/lib/format";
import type { Product, SaleInvoice } from "@/types";

interface ProductStat {
  name: string;
  quantity: number;
  revenue: number;
  stock: number;
}

interface SelectedProductDate {
  date: string;
  quantity: number;
  revenue: number;
}

interface ProductsTabProps {
  selectedProduct: string;
  onSelectProduct: (v: string) => void;
  selectedProductStats?: ProductStat;
  selectedProductChartData: SelectedProductDate[];
  filteredSales: SaleInvoice[];
  topProducts: ProductStat[];
  bottomProducts: ProductStat[];
  products: Product[];
}

export function ProductsReportTab({
  selectedProduct, onSelectProduct, selectedProductStats, selectedProductChartData,
  filteredSales, topProducts, bottomProducts, products,
}: ProductsTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-0 w-full sm:w-auto sm:min-w-[250px]">
              <Label className="mb-2 block">اختر منتج لعرض تقريره</Label>
              <Select value={selectedProduct} onValueChange={onSelectProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="كل المنتجات" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="all">كل المنتجات (ملخص)</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.name}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedProduct !== "all" && selectedProductStats ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="الكمية المباعة" value={String(selectedProductStats.quantity)} icon={ShoppingCart} color="text-primary" bg="bg-primary/5" />
            <StatCard title="الإيرادات" value={formatCurrency(selectedProductStats.revenue, 2)} icon={DollarSign} color="text-emerald-600" bg="bg-emerald-50" />
            <StatCard title="المخزون الحالي" value={String(selectedProductStats.stock)} icon={Package} color="text-violet-600" bg="bg-violet-50" />
            <StatCard title="متوسط السعر" value={formatCurrency(selectedProductStats.quantity > 0 ? selectedProductStats.revenue / selectedProductStats.quantity : 0, 2)} icon={TrendingUp} color="text-orange-600" bg="bg-orange-50" />
          </div>

          {selectedProductChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="w-5 h-5 text-primary" />
                  اتجاه مبيعات: {selectedProduct}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={selectedProductChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={(p: XAxisTickProps) => <ArabicXAxisTick {...p} />} height={50} />
                    <YAxis />
                    <Tooltip formatter={(value: number, name: string) => [name === "revenue" ? formatCurrency(value) : value, name === "revenue" ? "الإيرادات" : "الكمية"]} />
                    <Legend formatter={(v) => (v === "revenue" ? "الإيرادات" : "الكمية")} />
                    <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} name="revenue" />
                    <Line type="monotone" dataKey="quantity" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} name="quantity" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="w-5 h-5 text-violet-600" />
                فواتير تحتوي على {selectedProduct}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">رقم الفاتورة</TableHead>
                    <TableHead className="text-right">الكمية</TableHead>
                    <TableHead className="text-right">الإيراد</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales
                    .filter((inv) => inv.items.some((item) => item.name === selectedProduct))
                    .map((inv) => {
                      const item = inv.items.find((i) => i.name === selectedProduct)!;
                      return (
                        <TableRow key={inv.id}>
                          <TableCell>{inv.date}</TableCell>
                          <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{item.quantity}</Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-primary">
                            {formatCurrency(item.price * item.quantity, 2)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                الأعلى مبيعاً
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/60">
                  <Package className="w-8 h-8 mb-2" />
                  <p>لا توجد مبيعات</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">المنتج</TableHead>
                      <TableHead className="text-right">الكمية</TableHead>
                      <TableHead className="text-right">الإيرادات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell><Badge variant="secondary">{item.quantity}</Badge></TableCell>
                        <TableCell className="font-semibold text-emerald-600">{formatCurrency(item.revenue, 2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingDown className="w-5 h-5 text-destructive" />
                الأقل مبيعاً
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bottomProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/60">
                  <Package className="w-8 h-8 mb-2" />
                  <p>لا توجد مبيعات</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">المنتج</TableHead>
                      <TableHead className="text-right">الكمية</TableHead>
                      <TableHead className="text-right">الإيرادات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bottomProducts.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell><Badge variant="secondary">{item.quantity}</Badge></TableCell>
                        <TableCell className="font-semibold text-destructive">{formatCurrency(item.revenue, 2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
