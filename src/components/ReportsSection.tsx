import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import {
  FileText, Calendar, TrendingUp, Package, DollarSign, Download,
  BarChart3, PieChart as PieChartIcon, Activity, RefreshCw,
  TrendingDown, AlertTriangle, Layers, ShoppingCart, Target,
  Clock, Zap, Receipt
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as salesApi from "@/api/sales";
import * as purchasesApi from "@/api/purchases";
import * as productsApi from "@/api/products";
import { CURRENCY } from "@/constants";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#EC4899", "#14B8A6", "#F97316", "#6366F1"];

type ReportPeriod = "daily" | "3days" | "weekly" | "monthly";

const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getPeriodKey(dateStr: string, period: ReportPeriod): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  switch (period) {
    case "daily":
      return dateStr;
    case "3days": {
      const periodStart = Math.floor((day - 1) / 3) * 3 + 1;
      return `${y}-${String(m).padStart(2, "0")}-${String(periodStart).padStart(2, "0")}`;
    }
    case "weekly": {
      const daysSinceSaturday = (d.getDay() + 1) % 7;
      const saturday = new Date(d);
      saturday.setDate(d.getDate() - daysSinceSaturday);
      return `${saturday.getFullYear()}-${String(saturday.getMonth() + 1).padStart(2, "0")}-${String(saturday.getDate()).padStart(2, "0")}`;
    }
    case "monthly":
      return `${y}-${String(m).padStart(2, "0")}`;
    default:
      return dateStr;
  }
}

function getPeriodLabel(key: string, period: ReportPeriod): string {
  const [y, m, ...rest] = key.split("-").map(Number);
  switch (period) {
    case "daily": {
      const d = new Date(y, m - 1, rest[0]);
      return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[m - 1]}`;
    }
    case "3days": {
      const end = new Date(y, m - 1, rest[0] + 2);
      return `${String(rest[0]).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")} ${MONTHS[m - 1]}`;
    }
    case "weekly": {
      const end = new Date(y, m - 1, rest[0] + 6);
      const startMonth = MONTHS[m - 1];
      const endMonth = MONTHS[end.getMonth()];
      if (startMonth === endMonth) {
        return `${String(rest[0]).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")} ${startMonth}`;
      }
      return `${String(rest[0]).padStart(2, "0")} ${startMonth} - ${String(end.getDate()).padStart(2, "0")} ${endMonth}`;
    }
    case "monthly":
      return `${MONTHS[m - 1]} ${y}`;
    default:
      return key;
  }
}

function ArabicXAxisTick(props: { x?: number; y?: number; payload?: { value: string } }) {
  if (props.x == null || props.y == null || !props.payload) return null;
  return (
    <foreignObject x={props.x - 65} y={props.y - 2} width="130" height="28" style={{ overflow: "visible" }}>
      <div xmlns="http://www.w3.org/1999/xhtml" style={{ fontSize: 11, color: "#6B7280", textAlign: "right", direction: "rtl", width: "100%", whiteSpace: "nowrap" }}>
        {props.payload.value}
      </div>
    </foreignObject>
  );
}

export default function ReportsSection() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("sales");
  const [period, setPeriod] = useState<ReportPeriod>("daily");
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [chartType, setChartType] = useState<"bar" | "line">("bar");

  const { data: salesInvoices = [], isLoading: salesLoading } = useQuery({
    queryKey: ["sales-invoices"],
    queryFn: salesApi.fetchSalesInvoices,
  });
  const { data: purchaseInvoices = [], isLoading: purchasesLoading } = useQuery({
    queryKey: ["purchase-invoices"],
    queryFn: purchasesApi.fetchPurchaseInvoices,
  });
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: productsApi.fetchProducts,
  });

  const isLoading = salesLoading || purchasesLoading || productsLoading;

  // Quick date presets
  const datePresets = [
    { label: "اليوم", get: () => ({ from: getToday(), to: getToday() }) },
    { label: "أمس", get: () => ({ from: formatDate(addDays(new Date(), -1)), to: formatDate(addDays(new Date(), -1)) }) },
    { label: "آخر 3 أيام", get: () => ({ from: formatDate(addDays(new Date(), -2)), to: getToday() }) },
    { label: "هذا الأسبوع", get: () => {
      const today = new Date();
      const daysSinceSaturday = (today.getDay() + 1) % 7;
      const saturday = new Date(today);
      saturday.setDate(today.getDate() - daysSinceSaturday);
      return { from: formatDate(saturday), to: getToday() };
    }},
    { label: "هذا الشهر", get: () => {
      const now = new Date();
      return { from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`, to: getToday() };
    }},
    { label: "الشهر الماضي", get: () => {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: formatDate(lastMonth), to: formatDate(lastDay) };
    }},
  ];

  const applyPreset = (preset: typeof datePresets[0]) => {
    const { from, to } = preset.get();
    setDateFrom(from);
    setDateTo(to);
  };

  // Filtered data
  const filteredSales = useMemo(() => {
    let result = salesInvoices;
    if (dateFrom) result = result.filter((inv) => inv.date >= dateFrom);
    if (dateTo) result = result.filter((inv) => inv.date <= dateTo);
    return result;
  }, [salesInvoices, dateFrom, dateTo]);

  const filteredPurchases = useMemo(() => {
    let result = purchaseInvoices;
    if (dateFrom) result = result.filter((inv) => inv.date >= dateFrom);
    if (dateTo) result = result.filter((inv) => inv.date <= dateTo);
    return result;
  }, [purchaseInvoices, dateFrom, dateTo]);

  // Summary stats
  const stats = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, inv) => sum + inv.total, 0);
    const totalInvoices = filteredSales.length;
    const totalItemsSold = filteredSales.reduce((sum, inv) => sum + inv.items.reduce((s, item) => s + item.quantity, 0), 0);
    const avgInvoice = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

    const totalPurchaseCost = filteredPurchases.reduce(
      (sum, inv) => sum + inv.items.reduce((s, item) => s + item.quantity * item.purchase_price, 0),
      0
    );
    const profit = totalRevenue - totalPurchaseCost;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    return { totalRevenue, totalInvoices, totalItemsSold, avgInvoice, totalPurchaseCost, profit, profitMargin };
  }, [filteredSales, filteredPurchases]);

  // ===================== Sales Report (Tab 1) =====================
  const salesPeriodData = useMemo(() => {
    const grouped = filteredSales.reduce((acc: Record<string, { invoices: number; total: number; items: number }>, inv) => {
      const key = getPeriodKey(inv.date, period);
      if (!acc[key]) acc[key] = { invoices: 0, total: 0, items: 0 };
      acc[key].invoices += 1;
      acc[key].total += inv.total;
      acc[key].items += inv.items.reduce((s, item) => s + item.quantity, 0);
      return acc;
    }, {});
    return Object.entries(grouped)
      .map(([date, data]) => ({ date: getPeriodLabel(date, period), rawDate: date, ...data }))
      .sort((a, b) => a.rawDate.localeCompare(b.rawDate));
  }, [filteredSales, period]);

  const periodLabelMap: Record<ReportPeriod, string> = {
    daily: "يومي",
    "3days": "كل 3 أيام",
    weekly: "أسبوعي",
    monthly: "شهري",
  };

  // ===================== Products Report (Tab 2) =====================
  const allProductStats = useMemo(() => {
    const items = filteredSales.flatMap((inv) => inv.items);
    const grouped = items.reduce((acc: Record<string, { name: string; quantity: number; revenue: number }>, item) => {
      const key = item.name;
      if (!acc[key]) acc[key] = { name: item.name, quantity: 0, revenue: 0 };
      acc[key].quantity += item.quantity;
      acc[key].revenue += item.price * item.quantity;
      return acc;
    }, {});
    return Object.values(grouped)
      .map((p) => {
        const product = products.find((pr) => pr.name === p.name);
        return { ...p, stock: product?.stock ?? 0 };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales, products]);

  const topProducts = allProductStats.slice(0, 10);
  const bottomProducts = [...allProductStats].sort((a, b) => a.revenue - b.revenue).slice(0, 10);

  const selectedProductData = useMemo(() => {
    if (selectedProduct === "all") return [];
    return filteredSales
      .flatMap((inv) =>
        inv.items
          .filter((item) => item.name === selectedProduct)
          .map((item) => ({ date: inv.date, quantity: item.quantity, revenue: item.price * item.quantity }))
      )
      .reduce((acc: Record<string, { date: string; quantity: number; revenue: number }>, curr) => {
        if (!acc[curr.date]) acc[curr.date] = { date: curr.date, quantity: 0, revenue: 0 };
        acc[curr.date].quantity += curr.quantity;
        acc[curr.date].revenue += curr.revenue;
        return acc;
      }, {});
  }, [filteredSales, selectedProduct]);

  const selectedProductChartData = Object.values(selectedProductData).sort((a, b) => a.date.localeCompare(b.date));
  const selectedProductStats = allProductStats.find((p) => p.name === selectedProduct);

  // ===================== Profit Report (Tab 3) =====================
  const profitPeriodData = useMemo(() => {
    const grouped: Record<string, { date: string; rawDate: string; sales: number; purchases: number; profit: number }> = {};

    filteredSales.forEach((inv) => {
      const key = getPeriodKey(inv.date, period);
      if (!grouped[key]) grouped[key] = { date: getPeriodLabel(key, period), rawDate: key, sales: 0, purchases: 0, profit: 0 };
      grouped[key].sales += inv.total;
    });

    filteredPurchases.forEach((inv) => {
      const key = getPeriodKey(inv.date, period);
      if (!grouped[key]) grouped[key] = { date: getPeriodLabel(key, period), rawDate: key, sales: 0, purchases: 0, profit: 0 };
      grouped[key].purchases += inv.items.reduce((s, item) => s + item.quantity * item.purchase_price, 0);
    });

    Object.values(grouped).forEach((g) => {
      g.profit = g.sales - g.purchases;
    });

    return Object.values(grouped).sort((a, b) => a.rawDate.localeCompare(b.rawDate));
  }, [filteredSales, filteredPurchases, period]);

  // ===================== Stock Report (Tab 4) =====================
  const lowStockProducts = products.filter((p) => p.stock <= 5).sort((a, b) => a.stock - b.stock);

  const soldItemsWithStock = useMemo(() => {
    const items = filteredSales.flatMap((inv) => inv.items);
    const grouped = items.reduce((acc: Record<string, { name: string; sold: number }>, item) => {
      const key = item.name;
      if (!acc[key]) acc[key] = { name: item.name, sold: 0 };
      acc[key].sold += item.quantity;
      return acc;
    }, {});
    return Object.values(grouped)
      .map((p) => {
        const product = products.find((pr) => pr.name === p.name);
        return { ...p, remaining: product?.stock ?? 0 };
      })
      .sort((a, b) => b.sold - a.sold);
  }, [filteredSales, products]);

  const totalStockValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

  // ===================== Categories Report (Tab 5) =====================
  const categoryData = useMemo(() => {
    const items = filteredSales.flatMap((inv) => inv.items);
    const catMap = new Map<string, { revenue: number; items: number }>();
    items.forEach((item) => {
      const product = products.find((p) => p.id === item.product_id);
      const catName = product?.category?.name || "غير مصنف";
      const existing = catMap.get(catName) || { revenue: 0, items: 0 };
      existing.revenue += item.price * item.quantity;
      existing.items += item.quantity;
      catMap.set(catName, existing);
    });
    const total = Array.from(catMap.values()).reduce((s, v) => s + v.revenue, 0);
    return Array.from(catMap.entries())
      .map(([name, data]) => ({ name, revenue: data.revenue, items: data.items, percent: total > 0 ? (data.revenue / total) * 100 : 0 }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales, products]);

  // ===================== CSV Export =====================
  const exportCSV = () => {
    let csv = "";
    let filename = "";

    switch (activeTab) {
      case "sales": {
        csv = "الفترة,عدد الفواتير,القطع المباعة,إجمالي المبيعات\n";
        salesPeriodData.forEach((row) => {
          csv += `${row.date},${row.invoices},${row.items},${row.total.toFixed(2)}\n`;
        });
        filename = `sales-${period}-report`;
        break;
      }
      case "products": {
        csv = "المنتج,الكمية المباعة,الإيرادات,المخزون الحالي\n";
        allProductStats.forEach((row) => {
          csv += `${row.name},${row.quantity},${row.revenue.toFixed(2)},${row.stock}\n`;
        });
        filename = "products-report";
        break;
      }
      case "profit": {
        csv = "الفترة,المبيعات,المشتريات,الربح\n";
        profitPeriodData.forEach((row) => {
          csv += `${row.date},${row.sales.toFixed(2)},${row.purchases.toFixed(2)},${row.profit.toFixed(2)}\n`;
        });
        filename = `profit-${period}-report`;
        break;
      }
      case "stock": {
        csv = "المنتج,الكمية المباعة,المخزون المتبقي,الحالة\n";
        soldItemsWithStock.forEach((row) => {
          const status = row.remaining === 0 ? "نفذ" : row.remaining <= 5 ? "منخفض" : "متوفر";
          csv += `${row.name},${row.sold},${row.remaining},${status}\n`;
        });
        filename = "stock-report";
        break;
      }
      case "categories": {
        csv = "الفئة,الإيرادات,عدد القطع,النسبة المئوية\n";
        categoryData.forEach((row) => {
          csv += `${row.name},${row.revenue.toFixed(2)},${row.items},${row.percent.toFixed(1)}%\n`;
        });
        filename = "categories-report";
        break;
      }
    }

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}-${getToday()}.csv`;
    link.click();
    toast({ title: "تم التصدير", description: "تم تصدير التقرير بنجاح" });
  };

  // ===================== Stat Card Component =====================
  const StatCard = ({ title, value, icon: Icon, color, bg }: { title: string; value: string; icon: any; color: string; bg: string }) => (
    <Card className={bg}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
          <Icon className={`w-8 h-8 opacity-40 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );

  // ===================== Loading State =====================
  if (isLoading) {
    return (
      <div className="space-y-6" dir="rtl">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  // ===================== Render Functions =====================
  const renderSalesTab = () => (
    <div className="space-y-6">
      {/* Period selector */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Label className="text-sm font-medium ml-2">تجميع البيانات:</Label>
            {(["daily", "3days", "weekly", "monthly"] as ReportPeriod[]).map((p) => (
              <Button
                key={p}
                variant={period === p ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(p)}
              >
                <Clock className="w-3.5 h-3.5 ml-1" />
                {periodLabelMap[p]}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {salesPeriodData.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
            <BarChart3 className="w-12 h-12 mb-4" />
            <p className="text-lg font-medium">لا توجد بيانات مبيعات</p>
            <p className="text-sm mt-1">ستظهر البيانات هنا بعد إتمام المبيعات</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                رسم بياني للمبيعات ({periodLabelMap[period]})
              </CardTitle>
              <div className="flex border rounded-md overflow-hidden">
                <Button variant={chartType === "bar" ? "default" : "ghost"} size="sm" className="rounded-none px-3" onClick={() => setChartType("bar")}>
                  <BarChart3 className="w-4 h-4" />
                </Button>
                <Button variant={chartType === "line" ? "default" : "ghost"} size="sm" className="rounded-none px-3" onClick={() => setChartType("line")}>
                  <Activity className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                {chartType === "bar" ? (
                  <BarChart data={salesPeriodData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={(p: any) => <ArabicXAxisTick {...p} />} height={50} />
                    <YAxis />
                    <Tooltip
                      formatter={(value: any, name: any) => {
                        if (name === "total") return [`${CURRENCY} ${value}`, "المبيعات"];
                        if (name === "invoices") return [value, "الفواتير"];
                        return [value, "القطع"];
                      }}
                    />
                    <Legend formatter={(v) => (v === "total" ? "المبيعات" : v === "invoices" ? "الفواتير" : "القطع")} />
                    <Bar dataKey="total" fill="#3B82F6" radius={[4, 4, 0, 0]} name="total" />
                  </BarChart>
                ) : (
                  <LineChart data={salesPeriodData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={(p: any) => <ArabicXAxisTick {...p} />} height={50} />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`${CURRENCY} ${value}`, "المبيعات"]} />
                    <Legend formatter={() => "المبيعات"} />
                    <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} name="total" />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detail table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="w-5 h-5 text-violet-600" />
                تفاصيل المبيعات ({periodLabelMap[period]})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الفترة</TableHead>
                    <TableHead className="text-right">عدد الفواتير</TableHead>
                    <TableHead className="text-right">القطع المباعة</TableHead>
                    <TableHead className="text-right">إجمالي المبيعات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesPeriodData.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{item.date}</TableCell>
                      <TableCell>{item.invoices}</TableCell>
                      <TableCell>{item.items}</TableCell>
                      <TableCell className="font-semibold text-blue-600">
                        {CURRENCY} {item.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  const renderProductsTab = () => (
    <div className="space-y-6">
      {/* Product Selector */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[250px]">
              <Label className="mb-2 block">اختر منتج لعرض تقريره</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
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

      {/* Specific Product Report */}
      {selectedProduct !== "all" && selectedProductStats ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="الكمية المباعة" value={String(selectedProductStats.quantity)} icon={ShoppingCart} color="text-blue-600" bg="bg-blue-50" />
            <StatCard title="الإيرادات" value={`${CURRENCY} ${selectedProductStats.revenue.toFixed(2)}`} icon={DollarSign} color="text-emerald-600" bg="bg-emerald-50" />
            <StatCard title="المخزون الحالي" value={String(selectedProductStats.stock)} icon={Package} color="text-violet-600" bg="bg-violet-50" />
            <StatCard title="متوسط السعر" value={`${CURRENCY} ${(selectedProductStats.quantity > 0 ? selectedProductStats.revenue / selectedProductStats.quantity : 0).toFixed(2)}`} icon={TrendingUp} color="text-orange-600" bg="bg-orange-50" />
          </div>

          {selectedProductChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="w-5 h-5 text-blue-600" />
                  اتجاه مبيعات: {selectedProduct}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={selectedProductChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={(p: any) => <ArabicXAxisTick {...p} />} height={50} />
                    <YAxis />
                    <Tooltip formatter={(value: any, name: any) => [name === "revenue" ? `${CURRENCY} ${value}` : value, name === "revenue" ? "الإيرادات" : "الكمية"]} />
                    <Legend formatter={(v) => (v === "revenue" ? "الإيرادات" : "الكمية")} />
                    <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} name="revenue" />
                    <Line type="monotone" dataKey="quantity" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} name="quantity" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Product invoices list */}
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
                          <TableCell className="font-semibold text-blue-600">
                            {CURRENCY} {(item.price * item.quantity).toFixed(2)}
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
        /* All Products Summary */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 10 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                الأعلى مبيعاً
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
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
                        <TableCell className="font-semibold text-emerald-600">{CURRENCY} {item.revenue.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Bottom 10 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingDown className="w-5 h-5 text-red-500" />
                الأقل مبيعاً
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bottomProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
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
                        <TableCell className="font-semibold text-red-500">{CURRENCY} {item.revenue.toFixed(2)}</TableCell>
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

  const renderProfitTab = () => (
    <div className="space-y-6">
      {profitPeriodData.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
            <DollarSign className="w-12 h-12 mb-4" />
            <p className="text-lg font-medium">لا توجد بيانات كافية</p>
            <p className="text-sm mt-1">يجب وجود فواتير مبيعات ومشتريات لحساب الأرباح</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="w-5 h-5 text-emerald-600" />
                مقارنة المبيعات والمشتريات ({periodLabelMap[period]})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={profitPeriodData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={(p: any) => <ArabicXAxisTick {...p} />} height={50} />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [`${CURRENCY} ${value}`, ""]} />
                  <Legend formatter={(v) => (v === "sales" ? "المبيعات" : v === "purchases" ? "المشتريات" : "الربح")} />
                  <Bar dataKey="sales" fill="#3B82F6" radius={[4, 4, 0, 0]} name="sales" />
                  <Bar dataKey="purchases" fill="#F59E0B" radius={[4, 4, 0, 0]} name="purchases" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="w-5 h-5 text-violet-600" />
                تفاصيل الأرباح والخسائر ({periodLabelMap[period]})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الفترة</TableHead>
                    <TableHead className="text-right">المبيعات</TableHead>
                    <TableHead className="text-right">المشتريات</TableHead>
                    <TableHead className="text-right">الربح</TableHead>
                    <TableHead className="text-right">نسبة الربح</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profitPeriodData.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{item.date}</TableCell>
                      <TableCell className="text-blue-600">{CURRENCY} {item.sales.toFixed(2)}</TableCell>
                      <TableCell className="text-amber-600">{CURRENCY} {item.purchases.toFixed(2)}</TableCell>
                      <TableCell className={`font-semibold ${item.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {CURRENCY} {item.profit.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.sales > 0 ? (item.profit / item.sales) * 100 >= 0 ? "default" : "destructive" : "secondary"}>
                          {item.sales > 0 ? ((item.profit / item.sales) * 100).toFixed(1) : "0.0"}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  const renderStockTab = () => (
    <div className="space-y-6">
      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-amber-800">
              <AlertTriangle className="w-5 h-5" />
              تنبيهات المخزون المنخفض
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-200">
                  <div>
                    <p className="font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.category?.name || "غير مصنف"}</p>
                  </div>
                  <Badge variant={p.stock === 0 ? "destructive" : "outline"} className={p.stock === 0 ? "" : "border-amber-500 text-amber-700"}>
                    {p.stock === 0 ? "نفذ" : `${p.stock} متبقي`}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sold Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="w-5 h-5 text-blue-600" />
            المنتجات المباعة والمخزون
          </CardTitle>
        </CardHeader>
        <CardContent>
          {soldItemsWithStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Package className="w-10 h-10 mb-3" />
              <p>لا توجد مبيعات بعد</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المنتج</TableHead>
                  <TableHead className="text-right">الكمية المباعة</TableHead>
                  <TableHead className="text-right">المخزون المتبقي</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {soldItemsWithStock.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-blue-600">{item.sold}</TableCell>
                    <TableCell className="font-semibold">
                      {item.remaining > 0 ? (
                        <span className="text-orange-600">{item.remaining}</span>
                      ) : (
                        <Badge variant="destructive" className="text-[10px]">نفذ</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.remaining === 0 ? (
                        <Badge variant="destructive">نفذ المخزون</Badge>
                      ) : item.remaining <= 5 ? (
                        <Badge variant="outline" className="border-amber-500 text-amber-700">منخفض</Badge>
                      ) : (
                        <Badge variant="secondary">متوفر</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderCategoriesTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PieChartIcon className="w-5 h-5 text-purple-600" />
            توزيع المبيعات حسب الفئة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={110}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {categoryData.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${CURRENCY} ${value}`, "المبيعات"]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[320px] text-gray-400">لا توجد بيانات كافية</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="w-5 h-5 text-indigo-600" />
            أداء الفئات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Layers className="w-10 h-10 mb-3" />
              <p>لا توجد بيانات</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الفئة</TableHead>
                  <TableHead className="text-right">القطع</TableHead>
                  <TableHead className="text-right">الإيرادات</TableHead>
                  <TableHead className="text-right">النسبة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryData.map((cat, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        {cat.name}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{cat.items}</Badge></TableCell>
                    <TableCell className="font-semibold text-indigo-600">{CURRENCY} {cat.revenue.toFixed(2)}</TableCell>
                    <TableCell>{cat.percent.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">التقارير والإحصائيات</h1>
          <p className="text-sm text-gray-500 mt-1">تحليل شامل لأداء المبيعات والمنتجات والمخزون</p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="w-4 h-4 ml-2" />
          تصدير CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي المبيعات" value={`${CURRENCY} ${stats.totalRevenue.toFixed(2)}`} icon={DollarSign} color="text-blue-600" bg="bg-blue-50" />
        <StatCard title="عدد الفواتير" value={String(stats.totalInvoices)} icon={Receipt} color="text-violet-600" bg="bg-violet-50" />
        <StatCard title="القطع المباعة" value={String(stats.totalItemsSold)} icon={Package} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard title="صافي الربح" value={`${CURRENCY} ${stats.profit.toFixed(2)}`} icon={TrendingUp} color={stats.profit >= 0 ? "text-green-600" : "text-red-600"} bg={stats.profit >= 0 ? "bg-green-50" : "bg-red-50"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <StatCard title="متوسط الفاتورة" value={`${CURRENCY} ${stats.avgInvoice.toFixed(2)}`} icon={Target} color="text-orange-600" bg="bg-orange-50" />
        <StatCard title="إجمالي المشتريات" value={`${CURRENCY} ${stats.totalPurchaseCost.toFixed(2)}`} icon={ShoppingCart} color="text-amber-600" bg="bg-amber-50" />
        <StatCard title="نسبة الربح" value={`${stats.profitMargin.toFixed(1)}%`} icon={Zap} color={stats.profitMargin >= 0 ? "text-teal-600" : "text-red-600"} bg={stats.profitMargin >= 0 ? "bg-teal-50" : "bg-red-50"} />
        <StatCard title="قيمة المخزون" value={`${CURRENCY} ${totalStockValue.toFixed(2)}`} icon={Layers} color="text-indigo-600" bg="bg-indigo-50" />
      </div>

      {/* Date Filter */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-5 h-5 text-blue-600" />
            نطاق التاريخ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Quick presets */}
            <div className="flex items-center gap-2 flex-wrap">
              <Label className="text-xs text-muted-foreground ml-2">سريع:</Label>
              {datePresets.map((preset) => (
                <Button key={preset.label} variant="outline" size="sm" onClick={() => applyPreset(preset)}>
                  {preset.label}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
              >
                <RefreshCw className="w-3 h-3 ml-1" />
                إعادة
              </Button>
            </div>
            {/* Custom range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">من تاريخ</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">إلى تاريخ</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="sales" className="gap-1.5">
            <BarChart3 className="w-4 h-4" />
            المبيعات
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-1.5">
            <Package className="w-4 h-4" />
            المنتجات
          </TabsTrigger>
          <TabsTrigger value="profit" className="gap-1.5">
            <DollarSign className="w-4 h-4" />
            الأرباح والخسائر
          </TabsTrigger>
          <TabsTrigger value="stock" className="gap-1.5">
            <Layers className="w-4 h-4" />
            المخزون
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-1.5">
            <PieChartIcon className="w-4 h-4" />
            الفئات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales">{renderSalesTab()}</TabsContent>
        <TabsContent value="products">{renderProductsTab()}</TabsContent>
        <TabsContent value="profit">{renderProfitTab()}</TabsContent>
        <TabsContent value="stock">{renderStockTab()}</TabsContent>
        <TabsContent value="categories">{renderCategoriesTab()}</TabsContent>
      </Tabs>
    </div>
  );
}
