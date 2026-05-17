import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, AlertTriangle } from "lucide-react";
import type { Product } from "@/types";

interface SoldItemWithStock {
  name: string;
  sold: number;
  remaining: number;
}

interface StockTabProps {
  lowStockProducts: Product[];
  soldItemsWithStock: SoldItemWithStock[];
}

export function StockReportTab({ lowStockProducts, soldItemsWithStock }: StockTabProps) {
  return (
    <div className="space-y-6">
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
                    <p className="font-medium text-foreground">{p.name}</p>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="w-5 h-5 text-primary" />
            المنتجات المباعة والمخزون
          </CardTitle>
        </CardHeader>
        <CardContent>
          {soldItemsWithStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/60">
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
                    <TableCell className="text-primary">{item.sold}</TableCell>
                    <TableCell className="font-semibold">
                      {item.remaining > 0 ? (
                        <span className="text-orange-600">{item.remaining}</span>
                      ) : (
                        <Badge variant="destructive" className="text-xs">نفذ</Badge>
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
}
