import type { SaleInvoice, CartItem } from "@/types";
import { CURRENCY } from "@/constants";

function formatPaymentMethod(method: string): string {
  switch (method) {
    case "cash": return "نقداً";
    case "card": return "بطاقة";
    case "mixed": return "نقد + بطاقة";
    default: return method;
  }
}

function buildInvoiceHTML(invoice: SaleInvoice | { items: any[]; total: number; subtotal: number; discount_total?: number; discount_type?: string; discount_value?: number; tax_rate?: number; tax_total?: number; invoice_number: string; date: string; time: string; cashier: string; customer?: { name: string }; payment_method?: string; paid_amount?: number; change_amount?: number }, isPreview = false): string {
  const totalItems = invoice.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
  const hasDiscount = (invoice.discount_total || 0) > 0;
  const hasTax = (invoice.tax_total || 0) > 0;

  return `<!DOCTYPE html>
<html dir="rtl">
<head>
<meta charset="utf-8" />
<title>${isPreview ? "معاينة " : ""}فاتورة ${invoice.invoice_number}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Tahoma,sans-serif;color:#1f2937;padding:20px}
.invoice{max-width:80mm;margin:0 auto;font-size:12px}
.header{text-align:center;border-bottom:2px dashed #d1d5db;padding-bottom:12px;margin-bottom:12px}
.header h1{font-size:18px;font-weight:800;color:#1e40af;margin-bottom:4px}
.header .subtitle{font-size:10px;color:#6b7280}
.meta{display:flex;justify-content:space-between;margin-bottom:8px;font-size:10px}
.meta div{text-align:right}.meta .label{color:#6b7280}.meta .value{font-weight:600}
table{width:100%;border-collapse:collapse;margin-bottom:12px}
th{text-align:right;font-size:10px;color:#6b7280;border-bottom:1px solid #d1d5db;padding:4px 0}
td{padding:4px 0;border-bottom:1px solid #f3f4f6;font-size:11px}
.text-left{text-align:left}.text-center{text-align:center}
.total{border-top:2px solid #1f2937;margin-top:8px;padding-top:8px}
.total-row{display:flex;justify-content:space-between;margin-bottom:3px}
.total-row .label{color:#6b7280;font-size:11px}.total-row .value{font-weight:600;font-size:12px}
.discount{color:#dc2626}.tax{color:#ea580c}
.grand-total{display:flex;justify-content:space-between;margin-top:4px;padding-top:4px;border-top:1px solid #d1d5db}
.grand-total .label{font-size:14px;font-weight:700}
.grand-total .value{font-size:16px;font-weight:800;color:#1e40af}
.payment-section{margin-top:8px;padding-top:8px;border-top:1px dashed #d1d5db}
.payment-row{display:flex;justify-content:space-between;font-size:10px;margin-bottom:2px}
.payment-row .label{color:#6b7280}.payment-row .value{font-weight:600}
.footer{text-align:center;margin-top:16px;font-size:10px;color:#9ca3af;border-top:1px dashed #d1d5db;padding-top:10px}
.draft-badge{text-align:center;margin-bottom:8px}
.draft-badge span{background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:600}
@media print{body{padding:0}.invoice{max-width:100%}@page{margin:5mm;size:80mm auto}}
</style>
</head>
<body>
<div class="invoice">
${isPreview ? '<div class="draft-badge"><span>معاينة - لم تتم بعد</span></div>' : ""}
<div class="header">
<h1>فاتورة مبيعات</h1>
<div class="subtitle">نظام نقطة البيع</div>
</div>
<div class="meta">
<div><span class="label">رقم الفاتورة:</span> <span class="value">${invoice.invoice_number}</span></div>
<div><span class="label">التاريخ:</span> <span class="value">${invoice.date}</span></div>
</div>
<div class="meta">
<div><span class="label">الوقت:</span> <span class="value">${invoice.time}</span></div>
<div><span class="label">البائع:</span> <span class="value">${invoice.cashier}</span></div>
</div>
${invoice.customer ? `<div class="meta"><div><span class="label">الزبون:</span> <span class="value">${invoice.customer.name}</span></div></div>` : ""}
<table>
<thead><tr>
<th style="width:45%">المنتج</th>
<th class="text-center" style="width:15%">الكمية</th>
<th class="text-left" style="width:20%">السعر</th>
<th class="text-left" style="width:20%">الإجمالي</th>
</tr></thead>
<tbody>
${invoice.items.map((item: any) => `<tr>
<td>${item.name}</td>
<td class="text-center">${item.quantity}</td>
<td class="text-left">${item.price.toFixed(2)}</td>
<td class="text-left">${(item.price * item.quantity).toFixed(2)}</td>
</tr>`).join("")}
</tbody>
</table>
<div class="total">
<div class="total-row"><span class="label">المجموع الفرعي:</span><span class="value">${(invoice.subtotal || invoice.total).toFixed(2)} ${CURRENCY}</span></div>
${hasDiscount ? `<div class="total-row discount"><span class="label">الخصم:</span><span class="value">-${(invoice.discount_total!).toFixed(2)} ${CURRENCY}</span></div>` : ""}
${hasTax ? `<div class="total-row tax"><span class="label">الضريبة (${invoice.tax_rate}%):</span><span class="value">${(invoice.tax_total!).toFixed(2)} ${CURRENCY}</span></div>` : ""}
<div class="total-row"><span class="label">عدد القطع:</span><span class="value">${totalItems}</span></div>
<div class="total-row"><span class="label">عدد الأصناف:</span><span class="value">${invoice.items.length}</span></div>
<div class="grand-total"><span class="label">الإجمالي:</span><span class="value">${invoice.total.toFixed(2)} ${CURRENCY}</span></div>
</div>
${!isPreview && invoice.payment_method ? `
<div class="payment-section">
<div class="payment-row"><span class="label">طريقة الدفع:</span><span class="value">${formatPaymentMethod(invoice.payment_method)}</span></div>
${(invoice.paid_amount || 0) > 0 ? `<div class="payment-row"><span class="label">المبلغ المدفوع:</span><span class="value">${invoice.paid_amount!.toFixed(2)} ${CURRENCY}</span></div>` : ""}
${(invoice.change_amount || 0) > 0 ? `<div class="payment-row"><span class="label">الباقي:</span><span class="value">${invoice.change_amount!.toFixed(2)} ${CURRENCY}</span></div>` : ""}
</div>` : ""}
<div class="footer">شكراً لتعاملکم معنا</div>
</div>
<script>window.onload=function(){window.print();window.onafterprint=function(){window.close()}};setTimeout(function(){if(!document.hasFocus())window.close()},1000)</script>
</body>
</html>`;
}

export function printSaleInvoice(invoice: SaleInvoice) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(buildInvoiceHTML(invoice));
  printWindow.document.close();
}

export function printCartPreview(cart: CartItem[], cashier: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const now = new Date();

  printWindow.document.write(buildInvoiceHTML({
    invoice_number: "معاينة",
    date: now.toISOString().slice(0, 10),
    time: now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
    cashier,
    total,
    subtotal: total,
    items: cart,
  }, true));
  printWindow.document.close();
}
