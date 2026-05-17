import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { PieChart as PieChartIcon, Landmark, CheckCircle2, Wallet, AlertTriangle, User2, FileText } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { STATUS_MAP } from "@/lib/debt-utils";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { Debt } from "@/types";

interface DebtSummaryData {
  activeCount: number;
  paidCount: number;
  overdueCount: number;
  totalOutstanding: number;
  totalPaid: number;
  totalDebtValue: number;
  overdueAmount: number;
  topCustomers: { name: string; total: number; count: number; paid: number }[];
}

interface DebtsTabProps {
  debts: Debt[];
  debtSummary: DebtSummaryData;
}

export function DebtsReportTab({ debts, debtSummary: ds }: DebtsTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard title="الديون المستحقة" value={formatCurrency(ds.totalOutstanding, 2)} icon={Landmark} color="text-red-600" bg="bg-red-50 border border-red-200" />
        <StatCard title="الديون المسددة" value={formatCurrency(ds.totalPaid, 2)} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard title="إجمالي الديون" value={formatCurrency(ds.totalDebtValue, 2)} icon={Wallet} color="text-primary" bg="bg-primary/5" />
        <StatCard title="عدد الديون النشطة" value={String(ds.activeCount)} icon={AlertTriangle} color="text-amber-600" bg="bg-amber-50" />
        <StatCard title="عدد الديون المتأخرة" value={`${ds.overdueCount} (${formatNumber(ds.overdueAmount, 0)})`} icon={AlertTriangle} color={ds.overdueCount > 0 ? "text-red-600" : "text-green-600"} bg={ds.overdueCount > 0 ? "bg-red-50" : "bg-green-50"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User2 className="w-5 h-5 text-violet-600" />
              أكثر الزبائن مدينةً
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ds.topCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/60">
                <User2 className="w-8 h-8 mb-2" />
                <p>لا توجد ديون حتى الآن</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الزبون</TableHead>
                    <TableHead className="text-right">عدد الديون</TableHead>
                    <TableHead className="text-right">إجمالي الدين</TableHead>
                    <TableHead className="text-right">المسدد</TableHead>
                    <TableHead className="text-right">المتبقي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ds.topCustomers.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell><Badge variant="secondary">{c.count}</Badge></TableCell>
                      <TableCell className="font-semibold">{formatCurrency(c.total, 2)}</TableCell>
                      <TableCell className="text-emerald-600">{formatCurrency(c.paid, 2)}</TableCell>
                      <TableCell className="font-bold text-red-600">{formatCurrency(c.total - c.paid, 2)}</TableCell>
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
              <PieChartIcon className="w-5 h-5 text-primary" />
              توزيع الديون (نشط/مسدد)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {debts.length === 0 ? (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground/60">لا توجد بيانات</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "مستحق", value: ds.totalOutstanding, color: "#EF4444" },
                      { name: "مسدد", value: ds.totalPaid, color: "#10B981" },
                    ]}
                    cx="50%" cy="50%" labelLine={false}
                    label={({ name, value }) => `${name}: ${formatNumber(value, 0)}`}
                    outerRadius={110}
                    dataKey="value"
                  >
                    <Cell fill="#EF4444" />
                    <Cell fill="#10B981" />
                  </Pie>
                <Tooltip formatter={(value: number) => [formatCurrency(value), ""]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-5 h-5 text-violet-600" />
            قائمة الديون ({debts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {debts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/60">
              <Landmark className="w-8 h-8 mb-2" />
              <p>لا توجد ديون</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الزبون</TableHead>
                  <TableHead className="text-right">المبلغ الكلي</TableHead>
                  <TableHead className="text-right">المسدد</TableHead>
                  <TableHead className="text-right">المتبقي</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">تاريخ الاستحقاق</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {debts.slice(0, 20).map((d) => {
                  const statusInfo = STATUS_MAP[d.status] || STATUS_MAP.active;
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.customer_name || "-"}</TableCell>
                      <TableCell>{formatCurrency(d.total_amount, 2)}</TableCell>
                      <TableCell className="text-emerald-600">{formatCurrency(d.total_amount - d.remaining_amount, 2)}</TableCell>
                      <TableCell className="font-bold text-red-600">{formatCurrency(d.remaining_amount, 2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusInfo.color}>{statusInfo.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{d.due_date || "-"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
