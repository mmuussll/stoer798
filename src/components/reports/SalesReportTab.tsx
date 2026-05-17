import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { TrendingUp, BarChart3, Activity, FileText, Clock } from "lucide-react";
import { ArabicXAxisTick, type XAxisTickProps } from "@/components/charts/ArabicXAxisTick";
import { formatCurrency } from "@/lib/format";
import type { ReportPeriod } from "@/lib/report-date-utils";
import { PERIOD_LABEL_MAP } from "@/lib/report-date-utils";

interface SalesPeriodItem {
  date: string;
  rawDate: string;
  invoices: number;
  total: number;
  items: number;
}

interface SalesTabProps {
  period: ReportPeriod;
  onPeriodChange: (p: ReportPeriod) => void;
  chartType: "bar" | "line";
  onChartTypeChange: (t: "bar" | "line") => void;
  salesPeriodData: SalesPeriodItem[];
}

export function SalesReportTab({ period, onPeriodChange, chartType, onChartTypeChange, salesPeriodData }: SalesTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Label className="text-sm font-medium ml-2">تجميع البيانات:</Label>
            {(["daily", "3days", "weekly", "monthly"] as ReportPeriod[]).map((p) => (
              <Button
                key={p}
                variant={period === p ? "default" : "outline"}
                size="sm"
                onClick={() => onPeriodChange(p)}
              >
                <Clock className="w-3.5 h-3.5 ml-1" />
                {PERIOD_LABEL_MAP[p]}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {salesPeriodData.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground/60">
            <BarChart3 className="w-12 h-12 mb-4" />
            <p className="text-lg font-medium">لا توجد بيانات مبيعات</p>
            <p className="text-sm mt-1">ستظهر البيانات هنا بعد إتمام المبيعات</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-5 h-5 text-primary" />
                رسم بياني للمبيعات ({PERIOD_LABEL_MAP[period]})
              </CardTitle>
              <div className="flex border rounded-md overflow-hidden">
                <Button variant={chartType === "bar" ? "default" : "ghost"} size="sm" className="rounded-none px-3" onClick={() => onChartTypeChange("bar")}>
                  <BarChart3 className="w-4 h-4" />
                </Button>
                <Button variant={chartType === "line" ? "default" : "ghost"} size="sm" className="rounded-none px-3" onClick={() => onChartTypeChange("line")}>
                  <Activity className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                {chartType === "bar" ? (
                  <BarChart data={salesPeriodData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={(p: XAxisTickProps) => <ArabicXAxisTick {...p} />} height={50} />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        if (name === "total") return [formatCurrency(value), "المبيعات"];
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
                    <XAxis dataKey="date" tick={(p: XAxisTickProps) => <ArabicXAxisTick {...p} />} height={50} />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), "المبيعات"]} />
                    <Legend formatter={() => "المبيعات"} />
                    <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} name="total" />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="w-5 h-5 text-violet-600" />
                تفاصيل المبيعات ({PERIOD_LABEL_MAP[period]})
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
                      <TableCell className="font-semibold text-primary">
                        {formatCurrency(item.total, 2)}
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
}
