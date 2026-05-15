import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { PieChart as PieChartIcon, Layers } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/format";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#EC4899", "#14B8A6", "#F97316", "#6366F1"];

interface CategoryItem {
  name: string;
  revenue: number;
  items: number;
  percent: number;
}

interface CategoriesTabProps {
  categoryData: CategoryItem[];
}

export function CategoriesReportTab({ categoryData }: CategoriesTabProps) {
  return (
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
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${formatNumber(percent * 100, 0)}%`}
                  outerRadius={110}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {categoryData.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [formatCurrency(value), "المبيعات"]} />
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
                    <TableCell className="font-semibold text-indigo-600">{formatCurrency(cat.revenue, 2)}</TableCell>
                    <TableCell>{formatNumber(cat.percent, 1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
