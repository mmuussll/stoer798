import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar, TrendingUp, Package, DollarSign, Download,
  BarChart3, PieChart as PieChartIcon, RefreshCw,
  Layers, ShoppingCart, Target,
  Zap, Receipt, Landmark
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useToast } from "@/hooks/use-toast";
import * as salesApi from "@/api/sales";
import * as purchasesApi from "@/api/purchases";
import * as productsApi from "@/api/products";
import * as debtsApi from "@/api/debts";
import { formatNumber, formatCurrency } from "@/lib/format";
import { getToday, formatDate, addDays, getPeriodKey, getPeriodLabel, type ReportPeriod } from "@/lib/report-date-utils";
import { SalesReportTab } from "@/components/reports/SalesReportTab";
import { ProductsReportTab } from "@/components/reports/ProductsReportTab";
import { ProfitReportTab } from "@/components/reports/ProfitReportTab";
import { StockReportTab } from "@/components/reports/StockReportTab";
import { CategoriesReportTab } from "@/components/reports/CategoriesReportTab";
import { DebtsReportTab } from "@/components/reports/DebtsReportTab";

export default function ReportsSection() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("sales");
  const [period, setPeriod] = useState<ReportPeriod>("daily");
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [chartType, setChartType] = useState<"bar" | "line">("bar");

  const { data: salesInvoices = [] } = useQuery({
    queryKey: ["sales-invoices"],
    queryFn: () => salesApi.fetchSalesInvoices(),
    staleTime: 2 * 60_000,
  });
  const { data: purchaseInvoices = [] } = useQuery({
    queryKey: ["purchase-invoices"],
    queryFn: () => purchasesApi.fetchPurchaseInvoices(),
    staleTime: 2 * 60_000,
  });
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => productsApi.fetchProducts(),
    staleTime: 5 * 60_000,
  });
  const { data: debts = [] } = useQuery({
    queryKey: ["debts"],
    queryFn: () => debtsApi.fetchDebts(),
    staleTime: 2 * 60_000,
  });

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
    Object.values(grouped).forEach((g) => { g.profit = g.sales - g.purchases; });
    return Object.values(grouped).sort((a, b) => a.rawDate.localeCompare(b.rawDate));
  }, [filteredSales, filteredPurchases, period]);

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
      .map((p) => { const product = products.find((pr) => pr.name === p.name); return { ...p, remaining: product?.stock ?? 0 }; })
      .sort((a, b) => b.sold - a.sold);
  }, [filteredSales, products]);

  const totalStockValue = useMemo(() => products.reduce((sum, p) => sum + p.price * p.stock, 0), [products]);

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

  const debtSummary = useMemo(() => {
    const active = debts.filter((d) => d.status !== "paid");
    const paid = debts.filter((d) => d.status === "paid");
    const overdue = active.filter((d) => d.due_date && d.due_date < new Date().toISOString().slice(0, 10));
    const totalOutstanding = active.reduce((s, d) => s + d.remaining_amount, 0);
    const totalPaid = debts.reduce((s, d) => s + (d.total_amount - d.remaining_amount), 0);
    const totalDebtValue = debts.reduce((s, d) => s + d.total_amount, 0);
    const overdueAmount = overdue.reduce((s, d) => s + d.remaining_amount, 0);
    const customerMap = new Map<string, { name: string; total: number; count: number; paid: number }>();
    debts.forEach((d) => {
      if (!d.customer_id) return;
      const key = d.customer_id;
      const existing = customerMap.get(key) || { name: d.customer_name, total: 0, count: 0, paid: 0 };
      existing.total += d.total_amount;
      existing.count += 1;
      existing.paid += d.total_amount - d.remaining_amount;
      customerMap.set(key, existing);
    });
    return {
      activeCount: active.length, paidCount: paid.length, overdueCount: overdue.length,
      totalOutstanding, totalPaid, totalDebtValue, overdueAmount,
      topCustomers: Array.from(customerMap.values()).sort((a, b) => (b.total - b.paid) - (a.total - a.paid)).slice(0, 10),
    };
  }, [debts]);

  const exportCSV = () => {
    let csv = "";
    let filename = "";
    switch (activeTab) {
      case "sales":
        csv = "الفترة,عدد الفواتير,القطع المباعة,إجمالي المبيعات\n";
        salesPeriodData.forEach((row) => { csv += `${row.date},${row.invoices},${row.items},${row.total.toFixed(2)}\n`; });
        filename = `sales-${period}-report`; break;
      case "products":
        csv = "المنتج,الكمية المباعة,الإيرادات,المخزون الحالي\n";
        allProductStats.forEach((row) => { csv += `${row.name},${row.quantity},${row.revenue.toFixed(2)},${row.stock}\n`; });
        filename = "products-report"; break;
      case "profit":
        csv = "الفترة,المبيعات,المشتريات,الربح\n";
        profitPeriodData.forEach((row) => { csv += `${row.date},${row.sales.toFixed(2)},${row.purchases.toFixed(2)},${row.profit.toFixed(2)}\n`; });
        filename = `profit-${period}-report`; break;
      case "stock":
        csv = "المنتج,الكمية المباعة,المخزون المتبقي,الحالة\n";
        soldItemsWithStock.forEach((row) => {
          const status = row.remaining === 0 ? "نفذ" : row.remaining <= 5 ? "منخفض" : "متوفر";
          csv += `${row.name},${row.sold},${row.remaining},${status}\n`;
        });
        filename = "stock-report"; break;
      case "categories":
        csv = "الفئة,الإيرادات,عدد القطع,النسبة المئوية\n";
        categoryData.forEach((row) => { csv += `${row.name},${row.revenue.toFixed(2)},${row.items},${row.percent.toFixed(1)}%\n`; });
        filename = "categories-report"; break;
    }
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}-${getToday()}.csv`;
    link.click();
    toast({ title: "تم التصدير", description: "تم تصدير التقرير بنجاح" });
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">التقارير والإحصائيات</h1>
          <p className="text-sm text-muted-foreground mt-1">تحليل شامل لأداء المبيعات والمنتجات والمخزون</p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="w-4 h-4 ml-2" />
          تصدير CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي المبيعات" value={formatCurrency(stats.totalRevenue, 2)} icon={DollarSign} color="text-primary" bg="bg-primary/5" />
        <StatCard title="عدد الفواتير" value={String(stats.totalInvoices)} icon={Receipt} color="text-violet-600" bg="bg-violet-50" />
        <StatCard title="القطع المباعة" value={String(stats.totalItemsSold)} icon={Package} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard title="صافي الربح" value={formatCurrency(stats.profit, 2)} icon={TrendingUp} color={stats.profit >= 0 ? "text-success" : "text-destructive"} bg={stats.profit >= 0 ? "bg-green-50" : "bg-red-50"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <StatCard title="متوسط الفاتورة" value={formatCurrency(stats.avgInvoice, 2)} icon={Target} color="text-orange-600" bg="bg-orange-50" />
        <StatCard title="إجمالي المشتريات" value={formatCurrency(stats.totalPurchaseCost, 2)} icon={ShoppingCart} color="text-amber-600" bg="bg-amber-50" />
        <StatCard title="نسبة الربح" value={`${formatNumber(stats.profitMargin, 1)}%`} icon={Zap} color={stats.profitMargin >= 0 ? "text-teal-600" : "text-destructive"} bg={stats.profitMargin >= 0 ? "bg-teal-50" : "bg-red-50"} />
        <StatCard title="قيمة المخزون" value={formatCurrency(totalStockValue, 2)} icon={Layers} color="text-primary" bg="bg-primary/5" />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-5 h-5 text-primary" />
            نطاق التاريخ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Label className="text-xs text-muted-foreground ml-2">سريع:</Label>
              {datePresets.map((preset) => (
                <Button key={preset.label} variant="outline" size="sm" onClick={() => applyPreset(preset)}>
                  {preset.label}
                </Button>
              ))}
              <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); }}>
                <RefreshCw className="w-3 h-3 ml-1" />
                إعادة
              </Button>
            </div>
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="sales" className="gap-1.5"><BarChart3 className="w-4 h-4" />المبيعات</TabsTrigger>
          <TabsTrigger value="products" className="gap-1.5"><Package className="w-4 h-4" />المنتجات</TabsTrigger>
          <TabsTrigger value="profit" className="gap-1.5"><DollarSign className="w-4 h-4" />الأرباح والخسائر</TabsTrigger>
          <TabsTrigger value="stock" className="gap-1.5"><Layers className="w-4 h-4" />المخزون</TabsTrigger>
          <TabsTrigger value="categories" className="gap-1.5"><PieChartIcon className="w-4 h-4" />الفئات</TabsTrigger>
          <TabsTrigger value="debts" className="gap-1.5"><Landmark className="w-4 h-4" />الديون</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <SalesReportTab period={period} onPeriodChange={setPeriod} chartType={chartType} onChartTypeChange={setChartType} salesPeriodData={salesPeriodData} />
        </TabsContent>
        <TabsContent value="products">
          <ProductsReportTab
            selectedProduct={selectedProduct} onSelectProduct={setSelectedProduct}
            selectedProductStats={selectedProductStats} selectedProductChartData={selectedProductChartData}
            filteredSales={filteredSales} topProducts={topProducts} bottomProducts={bottomProducts}
            products={products}
          />
        </TabsContent>
        <TabsContent value="profit">
          <ProfitReportTab period={period} profitPeriodData={profitPeriodData} />
        </TabsContent>
        <TabsContent value="stock">
          <StockReportTab lowStockProducts={lowStockProducts} soldItemsWithStock={soldItemsWithStock} />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesReportTab categoryData={categoryData} />
        </TabsContent>
        <TabsContent value="debts">
          <DebtsReportTab debts={debts} debtSummary={debtSummary} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
