import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Receipt, Package, Users, RotateCcw, Printer, X } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { SaleInvoice } from "@/types";

function getPaymentIcon(method: string) {
  switch (method) {
    case "cash": return "💵";
    case "card": return "💳";
    case "mixed": return "👛";
    default: return "💵";
  }
}

function getPaymentLabel(method: string) {
  switch (method) {
    case "cash": return "نقداً";
    case "card": return "بطاقة";
    case "mixed": return "مختلط";
    default: return method || "نقداً";
  }
}

interface InvoiceDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: SaleInvoice | null;
  onPrint: () => void;
  onReturn: () => void;
}

export default function InvoiceDetailDialog({ open, onOpenChange, invoice, onPrint, onReturn }: InvoiceDetailDialogProps) {
  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />تفاصيل الفاتورة
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-500 mb-1">رقم الفاتورة</p>
              <p className="font-semibold text-sm font-mono">{invoice.invoice_number}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">التاريخ</p>
              <p className="font-semibold text-sm">{invoice.date} - {invoice.time}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">البائع</p>
              <p className="font-semibold text-sm">{invoice.cashier}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">الزبون</p>
              <p className="font-semibold text-sm">
                {invoice.customer ? (
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-blue-500" />
                    {invoice.customer.name}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-500" />
              تفاصيل المنتجات ({invoice.items.length})
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-right">#</TableHead>
                    <TableHead className="text-right">المنتج</TableHead>
                    <TableHead className="text-right">السعر</TableHead>
                    <TableHead className="text-right">الكمية</TableHead>
                    <TableHead className="text-right">الإجمالي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item, index) => (
                    <TableRow key={item.id || index}>
                      <TableCell className="text-gray-500 text-sm">{index + 1}</TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{formatCurrency(item.price, 2)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.quantity}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(item.price * item.quantity, 2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">المجموع الفرعي:</span>
              <span className="font-medium">
                {invoice.subtotal > 0
                  ? formatCurrency(invoice.subtotal, 2)
                  : formatCurrency(invoice.total, 2)}
              </span>
            </div>

            {invoice.discount_total > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>
                  الخصم
                  {invoice.discount_type === "percentage"
                    ? ` (${invoice.discount_value}%)`
                    : ""}:
                </span>
                <span className="font-medium">
                  -{formatCurrency(invoice.discount_total, 2)}
                </span>
              </div>
            )}

            {invoice.tax_total > 0 && (
              <div className="flex justify-between text-sm text-orange-600">
                <span>الضريبة ({invoice.tax_rate}%):</span>
                <span className="font-medium">
                  {formatCurrency(invoice.tax_total, 2)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm text-gray-600">
              <span>طريقة الدفع:</span>
              <span className="font-medium flex items-center gap-1">
                {getPaymentIcon(invoice.payment_method)}
                {getPaymentLabel(invoice.payment_method)}
              </span>
            </div>

            {invoice.paid_amount > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>المبلغ المدفوع:</span>
                <span className="font-medium">
                  {formatCurrency(invoice.paid_amount, 2)}
                </span>
              </div>
            )}

            {invoice.change_amount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>الباقي:</span>
                <span className="font-medium">
                  {formatCurrency(invoice.change_amount, 2)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">عدد القطع:</span>
              <span className="font-medium">
                {invoice.items.reduce((s, item) => s + item.quantity, 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">عدد الأصناف:</span>
              <span className="font-medium">{invoice.items.length}</span>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">المبلغ الإجمالي:</span>
              <span className="text-2xl font-bold text-blue-600">
                {formatCurrency(invoice.total, 2)}
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 flex-wrap">
            <Button
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
              onClick={() => {
                onOpenChange(false);
                setTimeout(onReturn, 100);
              }}
            >
              <RotateCcw className="w-4 h-4 ml-2" />
              مرتجع
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={onPrint}
            >
              <Printer className="w-4 h-4 ml-2" />
              طباعة الفاتورة
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4 ml-2" />
              إغلاق
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
