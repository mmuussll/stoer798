import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Activity, FileText, DollarSign } from "lucide-react";
import { ArabicXAxisTick, type XAxisTickProps } from "@/components/charts/ArabicXAxisTick";
import { formatCurrency } from "@/lib/format";
import type { ReportPeriod } from "@/lib/report-date-utils";
import { PERIOD_LABEL_MAP } from "@/lib/report-date-utils";

interface ProfitPeriodItem {
  date: string;
  rawDate: string;
  sales: number;
  purchases: number;
  profit: number;
}

interface ProfitTabProps {
  period: ReportPeriod;
  profitPeriodData: ProfitPeriodItem[];
}

export function ProfitReportTab({ period, profitPeriodData }: ProfitTabProps) {
  return (
    <div className="space-y-6">
      {profitPeriodData.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground/60">
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
                مقارنة المبيعات والمشتريات ({PERIOD_LABEL_MAP[period]})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={profitPeriodData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={(p: XAxisTickProps) => <ArabicXAxisTick {...p} />} height={50} />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), ""]} />
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
                تفاصيل الأرباح والخسائر ({PERIOD_LABEL_MAP[period]})
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
                      <TableCell className="text-primary">{formatCurrency(item.sales, 2)}</TableCell>
                      <TableCell className="text-warning">{formatCurrency(item.purchases, 2)}</TableCell>
                      <TableCell className={`font-semibold ${item.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {formatCurrency(item.profit, 2)}
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
}
