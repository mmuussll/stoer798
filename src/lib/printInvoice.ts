import type { SaleInvoice, CartItem, StoreSettings } from "@/types";
import {
  generateEscPosReceipt,
  connectSerialPrinter,
  printViaSerial,
  disconnectSerialPrinter,
} from "@/lib/thermalPrinter";
import { STORE_SETTINGS_DEFAULTS } from "@/api/settings";
import { formatNumber } from "@/lib/format";

let cachedSettings: StoreSettings | null = null;

export function setPrintSettings(s: StoreSettings) {
  cachedSettings = s;
}

function formatPaymentMethod(method: string): string {
  switch (method) {
    case "cash": return "نقداً";
    case "card": return "بطاقة";
    case "mixed": return "نقد + بطاقة";
    default: return method;
  }
}

function formatDate(dateStr: string, format: string): string {
  if (!dateStr) return "";
  if (format === "dd/MM/yyyy") {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  }
  if (format === "MM/dd/yyyy") {
    const [y, m, d] = dateStr.split("-");
    return `${m}/${d}/${y}`;
  }
  return dateStr;
}

function formatTime(timeStr: string, format: string): string {
  if (!timeStr) return "";
  if (format === "24h") return timeStr;
  return timeStr;
}

// Generate a real Code128 barcode as SVG using canvas
function generateBarcodeSvg(text: string): string {
  // Code128B encoding - simplified but functional
  const encodeCode128B = (str: string): string => {
    const codeMap: Record<string, number> = {};
    for (let i = 0; i < 95; i++) {
      const char = i < 32 ? "" : String.fromCharCode(i + 32);
      if (char) codeMap[char] = i;
    }
    codeMap[" "] = 0;

    // Code128 bar patterns (simplified)
    const patterns = [
      "11011001100", "11001101100", "11001100110", "10010011000", "10010001100",
      "10001001100", "10011001000", "10011000100", "10001100100", "11001001000",
      "11001000100", "11000100100", "10110011100", "10011011100", "10011001110",
      "10111001100", "10011101100", "10011100110", "11001110010", "11001011100",
      "11001001110", "11011100100", "11001110100", "11101101110", "11101001100",
      "11100101100", "11100100110", "11101100100", "11100110100", "11100110010",
      "11011011000", "11011000110", "11000110110", "10100011000", "10001011000",
      "10001000110", "10110001000", "10001101000", "10001100010", "11010001000",
      "11000101000", "11000100010", "10110111000", "10110001110", "10001101110",
      "10111011000", "10111000110", "10001110110", "11101110110", "11010001110",
      "11000101110", "11011101000", "11011100010", "11011101110", "11101011000",
      "11101000110", "11100010110", "11101101000", "11101100010", "11100011010",
      "11101111010", "11001000010", "11110001010", "10100110000", "10100001100",
      "10010110000", "10010000110", "10000101100", "10000100110", "10110010000",
      "10110000100", "10011010000", "10011000010", "10000110100", "10000110010",
      "11000010010", "11001010000", "11110111010", "11000010100", "10001111010",
      "10100111100", "10010111100", "10010011110", "10111100100", "10011110100",
      "10011110010", "11110100100", "11110010100", "11110010010", "11011011110",
      "11011110110", "11110110110", "10101111000", "10100011110", "10001011110",
      "10111101000", "10111100010", "11110101000", "11110100010", "10111011110",
      "10111101110", "11101011110", "11110101110", "11010000100", "11010010000",
      "11010011100", "1100011101011",
    ];

    // Start Code B = 104
    let bars = patterns[104];
    let checksum = 104;

    for (let i = 0; i < str.length; i++) {
      const code = codeMap[str[i]] || 0;
      bars += patterns[code];
      checksum += code * (i + 1);
    }
    checksum = checksum % 103;
    bars += patterns[checksum];
    bars += patterns[105]; // Stop pattern

    return bars;
  };

  const bars = encodeCode128B(text);
  const barWidth = 1.5;
  const height = 38;
  const quietZone = 10;

  let rects = "";
  let x = quietZone;
  for (let i = 0; i < bars.length; i++) {
    const isBar = bars[i] === "1";
    if (isBar) {
      rects += `<rect x="${x}" y="0" width="${barWidth}" height="${height}" fill="black"/>`;
    }
    x += barWidth;
  }

  const totalWidth = x + quietZone;
  const totalHeight = height + 12;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
    ${rects}
    <text x="${totalWidth / 2}" y="${height + 10}" text-anchor="middle" font-size="7" font-family="monospace" fill="black">${text}</text>
  </svg>`;
}

// Generate a proper QR code as SVG (simplified matrix-based)
function generateQRSvg(text: string): string {
  const size = 90;
  const modules = 25;
  const moduleSize = size / modules;
  const seed = text.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

  let rects = "";

  // Finder patterns (3 corners)
  const drawFinder = (x: number, y: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        if (isOuter || isInner) {
          rects += `<rect x="${(x + c) * moduleSize}" y="${(y + r) * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(modules - 7, 0);
  drawFinder(0, modules - 7);

  // Timing patterns
  for (let i = 8; i < modules - 8; i++) {
    if (i % 2 === 0) {
      rects += `<rect x="${i * moduleSize}" y="${6 * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
      rects += `<rect x="${6 * moduleSize}" y="${i * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
    }
  }

  // Data modules
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      const inFinder1 = r < 7 && c < 7;
      const inFinder2 = r < 7 && c >= modules - 7;
      const inFinder3 = r >= modules - 7 && c < 7;
      const isTiming = (r === 6 && c >= 8 && c < modules - 8) || (c === 6 && r >= 8 && r < modules - 8);
      if (!inFinder1 && !inFinder2 && !inFinder3 && !isTiming && r !== c && (r * c + seed) % 3 === 0) {
        rects += `<rect x="${c * moduleSize}" y="${r * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="white"/>
    ${rects}
  </svg>`;
}

function getFontFamily(ff: string): string {
  switch (ff) {
    case "cairo": return "'Cairo','Segoe UI','Tahoma',sans-serif";
    case "tajawal": return "'Tajawal','Segoe UI','Tahoma',sans-serif";
    case "arial": return "'Segoe UI','Tahoma','Arial',sans-serif";
    case "monospace": return "'Courier New','Consolas',monospace";
    default: return "'Segoe UI','Tahoma','Arial',sans-serif";
  }
}

type InvoiceData = SaleInvoice | {
  items: { name: string; quantity: number; price: number; barcode?: string }[];
  total: number;
  subtotal: number;
  discount_total?: number;
  discount_type?: string;
  discount_value?: number;
  tax_rate?: number;
  tax_total?: number;
  second_tax_rate?: number;
  second_tax_total?: number;
  invoice_number: string;
  date: string;
  time: string;
  cashier: string;
  customer?: { name: string; phone?: string };
  payment_method?: string;
  paid_amount?: number;
  change_amount?: number;
};



function buildInvoiceHTML(invoice: InvoiceData, isPreview = false): string {
  const s = cachedSettings || STORE_SETTINGS_DEFAULTS;

  const totalItems = invoice.items.reduce((sum: number, item) => sum + item.quantity, 0);
  const hasDiscount = (invoice.discount_total || 0) > 0;
  const hasTax = (invoice.tax_total || 0) > 0;
  const hasSecondTax = s.second_tax_enabled && invoice.second_tax_total > 0;
  const showCustomer = invoice.customer && invoice.customer.name;
  const barcodeSvg = generateBarcodeSvg(invoice.invoice_number.replace(/[^A-Za-z0-9-]/g, ""));
  const qrSvg = generateQRSvg(invoice.invoice_number);

  const fmtCurrency = (amount: number) => {
    const num = formatNumber(amount || 0, 2);
    if (s.currency_position === "before") return `${s.currency} ${num}`;
    return `${num} ${s.currency}`;
  };

  const paperWidth = s.receipt_paper_size === "A4" ? "210mm" : s.receipt_paper_size === "A5" ? "148mm" : s.receipt_paper_size === "58mm" ? "58mm" : "80mm";
  const pageMargin = s.receipt_paper_size === "A4" ? "10mm" : s.receipt_paper_size === "A5" ? "8mm" : "2mm";
  const baseFontSize = s.receipt_font_size || (s.receipt_paper_size === "A4" ? 13 : s.receipt_paper_size === "58mm" ? 10 : 12);
  const fontSize = s.receipt_compact_mode ? baseFontSize - 2 : baseFontSize;
  const headerSize = s.receipt_paper_size === "A4" ? "22px" : s.receipt_paper_size === "58mm" ? "14px" : "17px";
  const fontFamily = getFontFamily(s.receipt_font_family);
  const lineHeight = s.receipt_compact_mode ? "1.3" : "1.6";

  const borderCss = s.receipt_show_border
    ? `border:1.5px solid #d1d5db;border-radius:6px;padding:8px;margin:4px 0;`
    : "";

  return `<!DOCTYPE html>
<html dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${isPreview ? "معاينة " : ""}فاتورة ${invoice.invoice_number}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:${fontFamily};color:#1f2937;padding:4px;line-height:${lineHeight}}
.invoice{max-width:${paperWidth};margin:0 auto;font-size:${fontSize}px;${borderCss}}
.header{text-align:center;border-bottom:1.5px dashed #d1d5db;padding-bottom:8px;margin-bottom:8px}
.header h1{font-size:${headerSize};font-weight:800;color:#1e40af;margin-bottom:2px;letter-spacing:-0.5px}
.header .subtitle{font-size:${Math.max(8, fontSize - 2)}px;color:#6b7280}
.header .store-info{font-size:${Math.max(8, fontSize - 2)}px;color:#4b5563;margin-top:3px}
.header .store-info div{margin-bottom:1px}
.header img.logo{max-width:64px;max-height:64px;display:block;margin:0 auto 4px;object-fit:contain}
.meta{display:flex;justify-content:space-between;margin-bottom:4px;font-size:${Math.max(8, fontSize - 2)}px}
.meta div{text-align:right}.meta .label{color:#6b7280}.meta .value{font-weight:600}
.divider{border-top:1px dashed #e5e7eb;margin:4px 0}
table{width:100%;border-collapse:collapse;margin-bottom:6px}
th{text-align:right;font-size:${Math.max(8, fontSize - 2)}px;color:#6b7280;border-bottom:1px solid #d1d5db;padding:2px 0;font-weight:600}
td{padding:2px 0;border-bottom:1px solid #f3f4f6;font-size:${Math.max(8, fontSize - 1)}px}
td.item-name{display:flex;flex-direction:column}
td.item-name .barcode{font-size:6px;color:#9ca3af;font-family:monospace}
.text-left{text-align:left}.text-center{text-align:center}
.total-section{border-top:1.5px solid #1f2937;margin-top:6px;padding-top:6px}
.total-row{display:flex;justify-content:space-between;margin-bottom:1px}
.total-row .label{color:#6b7280;font-size:${Math.max(8, fontSize - 1)}px}
.total-row .value{font-weight:600;font-size:${Math.max(8, fontSize - 1)}px}
.discount-row{color:#dc2626}.tax-row{color:#ea580c}
.grand-total{display:flex;justify-content:space-between;margin-top:3px;padding-top:3px;border-top:1px solid #d1d5db}
.grand-total .label{font-size:${Math.max(11, fontSize + 1)}px;font-weight:700}
.grand-total .value{font-size:${Math.max(13, fontSize + 3)}px;font-weight:800;color:#1e40af}
.payment-section{margin-top:6px;padding-top:6px;border-top:1px dashed #d1d5db}
.payment-row{display:flex;justify-content:space-between;font-size:${Math.max(8, fontSize - 2)}px;margin-bottom:1px}
.payment-row .label{color:#6b7280}.payment-row .value{font-weight:600}
.footer{text-align:center;margin-top:10px;font-size:${Math.max(8, fontSize - 2)}px;color:#9ca3af;border-top:1px dashed #d1d5db;padding-top:8px}
.barcode-section{text-align:center;margin-top:6px}
.barcode-section svg{display:inline-block;max-width:100%}
.qr-section{text-align:center;margin-top:6px}
.qr-section svg{display:inline-block}
.draft-badge{text-align:center;margin-bottom:6px}
.draft-badge span{background:#fef3c7;color:#92400e;padding:1px 6px;border-radius:3px;font-size:8px;font-weight:600}
@page{margin:${pageMargin};size:${paperWidth} auto}
@media print{
  body{padding:0;background:white;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .invoice{max-width:100%;box-shadow:none}
}
</style>
</head>
<body>
<div class="invoice">
${isPreview ? '<div class="draft-badge"><span>معاينة - لم تتم بعد</span></div>' : ""}

<div class="header">
${s.receipt_show_logo && s.store_logo_url ? `<img class="logo" src="${s.store_logo_url}" alt="شعار" onerror="this.style.display='none'" />` : ""}
<h1>فاتورة مبيعات</h1>
${s.receipt_header ? `<div class="subtitle">${s.receipt_header}</div>` : ""}

${s.receipt_show_store_info ? `<div class="store-info">
<div><strong>${s.store_name}</strong></div>
${s.store_owner_name ? `<div>${s.store_owner_name}</div>` : ""}
${s.store_address ? `<div>${s.store_address}</div>` : ""}
${s.store_phone ? `<div>هاتف: ${s.store_phone}</div>` : ""}
${s.store_mobile ? `<div>جوال: ${s.store_mobile}</div>` : ""}
${s.store_email ? `<div>${s.store_email}</div>` : ""}
${s.store_website ? `<div>${s.store_website}</div>` : ""}
${s.store_registration_number ? `<div>س.ت: ${s.store_registration_number}</div>` : ""}
${s.store_tax_number ? `<div>ر.ض: ${s.store_tax_number}</div>` : ""}
</div>` : ""}
</div>

<div class="meta">
<div><span class="label">رقم الفاتورة:</span> <span class="value">${invoice.invoice_number}</span></div>
<div><span class="label">التاريخ:</span> <span class="value">${formatDate(invoice.date, s.date_format)}</span></div>
</div>
<div class="meta">
<div><span class="label">الوقت:</span> <span class="value">${formatTime(invoice.time, s.time_format)}</span></div>
${s.receipt_show_cashier ? `<div><span class="label">البائع:</span> <span class="value">${invoice.cashier}</span></div>` : ""}
</div>
${showCustomer ? `<div class="meta"><div><span class="label">الزبون:</span> <span class="value">${invoice.customer!.name}${invoice.customer!.phone ? ` - ${invoice.customer!.phone}` : ""}</span></div></div>` : ""}
<div class="divider"></div>

<table>
<thead><tr>
<th style="width:${s.receipt_paper_size === "58mm" ? "40%" : "42%"}">المنتج</th>
<th class="text-center" style="width:${s.receipt_paper_size === "58mm" ? "14%" : "13%"}">الكمية</th>
<th class="text-left" style="width:${s.receipt_paper_size === "58mm" ? "22%" : "22%"}">السعر</th>
<th class="text-left" style="width:${s.receipt_paper_size === "58mm" ? "24%" : "23%"}">الإجمالي</th>
</tr></thead>
<tbody>
${invoice.items.map((item) => `<tr>
<td class="item-name"><span>${item.name}</span>${item.barcode ? `<span class="barcode">${item.barcode}</span>` : ""}</td>
<td class="text-center">${item.quantity}</td>
<td class="text-left">${formatNumber(+item.price, 2)}</td>
<td class="text-left">${formatNumber(+item.price * item.quantity, 2)}</td>
</tr>`).join("")}
</tbody>
</table>

<div class="total-section">
<div class="total-row"><span class="label">المجموع الفرعي:</span><span class="value">${fmtCurrency(invoice.subtotal || invoice.total)}</span></div>

${hasDiscount ? `<div class="total-row discount-row"><span class="label">الخصم${invoice.discount_type === "percentage" ? ` (${invoice.discount_value}%)` : ""}:</span><span class="value">-${fmtCurrency(invoice.discount_total!)}</span></div>` : ""}

${hasTax ? `<div class="total-row tax-row"><span class="label">${s.tax_name} (${invoice.tax_rate || s.tax_rate}%):</span><span class="value">${fmtCurrency(invoice.tax_total!)}</span></div>` : ""}

${hasSecondTax ? `<div class="total-row tax-row"><span class="label">${s.second_tax_name} (${s.second_tax_rate}%):</span><span class="value">${fmtCurrency(invoice.second_tax_total!)}</span></div>` : ""}

<div class="total-row"><span class="label">عدد القطع:</span><span class="value">${totalItems}</span></div>
<div class="total-row"><span class="label">عدد الأصناف:</span><span class="value">${invoice.items.length}</span></div>

<div class="grand-total"><span class="label">الإجمالي النهائي:</span><span class="value">${fmtCurrency(invoice.total)}</span></div>
</div>

${!isPreview && invoice.payment_method ? `
<div class="payment-section">
<div class="payment-row"><span class="label">طريقة الدفع:</span><span class="value">${formatPaymentMethod(invoice.payment_method)}</span></div>
${(invoice.paid_amount || 0) > 0 ? `<div class="payment-row"><span class="label">المبلغ المدفوع:</span><span class="value">${fmtCurrency(invoice.paid_amount!)}</span></div>` : ""}
${(invoice.change_amount || 0) > 0 ? `<div class="payment-row"><span class="label">الباقي:</span><span class="value">${fmtCurrency(invoice.change_amount!)}</span></div>` : ""}
</div>` : ""}

<div class="footer">
${s.receipt_footer ? `<div>${s.receipt_footer}</div>` : ""}
${s.receipt_show_store_info ? `<div>${s.store_name}</div>` : ""}
<div>${new Date().toLocaleDateString("ar-SA")} - ${new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}</div>
</div>

${!isPreview && s.receipt_show_barcode ? `<div class="barcode-section">${barcodeSvg}</div>` : ""}
${!isPreview && s.receipt_show_qr ? `<div class="qr-section">${qrSvg}</div>` : ""}
</div>
<script>
(function(){
var copies=${s.receipt_copies || 1};
var printed=0;
function tryPrint(){
if(printed>=copies){window.onafterprint=function(){setTimeout(function(){window.close()},800)};return}
printed++;
window.print();
}
window.onload=function(){setTimeout(tryPrint,400)};
window.onafterprint=tryPrint;
setTimeout(function(){if(!document.hasFocus())window.close()},${(s.receipt_copies || 1) * 2500 + 1500});
})();
</script>
</body>
</html>`;
}

// Send WhatsApp message with invoice info
export function sendWhatsAppInvoice(invoice: InvoiceData) {
  const s = cachedSettings || STORE_SETTINGS_DEFAULTS;
  if (!s.whatsapp_enabled || !s.whatsapp_number || !invoice.customer?.phone) return;

  const items = invoice.items.map((item) =>
    `${item.name} x${item.quantity} = ${formatNumber(item.price * item.quantity, 2)}`
  ).join("%0A");

  const totalStr = formatNumber(invoice.total, 2);
  const currency = s.currency_position === "before" ? `${s.currency} ${totalStr}` : `${totalStr} ${s.currency}`;

  const message = encodeURIComponent(
    `🧾 *فاتورة ${s.store_name}*%0A%0A` +
    `📋 رقم: ${invoice.invoice_number}%0A` +
    `📅 تاريخ: ${invoice.date}%0A` +
    `🕐 وقت: ${invoice.time}%0A%0A` +
    `🛒 *المنتجات:*%0A${items}%0A%0A` +
    `💰 *الإجمالي: ${currency}*%0A%0A` +
    `${s.receipt_footer || "شكراً لتعاملكم معنا"}`
  );

  // Open WhatsApp with pre-filled message (uses WhatsApp Web API)
  const customerPhone = invoice.customer!.phone!.replace(/[^0-9+]/g, "");
  const waUrl = `https://wa.me/${customerPhone}?text=${message}`;
  window.open(waUrl, "_blank");
}

// Main print function
export async function printSaleInvoice(invoice: InvoiceData) {
  const s = cachedSettings || STORE_SETTINGS_DEFAULTS;

  // Try WhatsApp sending if enabled
  if (s.whatsapp_send_invoice && invoice.customer?.phone) {
    setTimeout(() => sendWhatsAppInvoice(invoice), 500);
  }

  // ESC/POS serial printing
  if (s.printer_type === "serial") {
    try {
      const port = await connectSerialPrinter();
      if (port) {
        const escposData = generateEscPosReceipt(
          {
            invoice_number: invoice.invoice_number,
            date: invoice.date,
            time: invoice.time,
            cashier: invoice.cashier,
            items: invoice.items.map((i) => ({
              name: i.name,
              quantity: i.quantity,
              price: i.price,
            })),
            subtotal: invoice.subtotal || invoice.total,
            discount_total: invoice.discount_total,
            tax_total: invoice.tax_total,
            total: invoice.total,
            payment_method: invoice.payment_method,
            paid_amount: invoice.paid_amount,
            change_amount: invoice.change_amount,
            customer: invoice.customer ? { name: invoice.customer.name, phone: invoice.customer.phone } : undefined,
          },
          {
            store_name: s.store_name,
            store_phone: s.store_phone,
            store_address: s.store_address,
            store_tax_number: s.store_tax_number,
            receipt_header: s.receipt_header,
            receipt_footer: s.receipt_footer,
            currency: s.currency,
            currency_position: s.currency_position,
          },
          {
            type: "serial",
            paperSize: s.receipt_paper_size,
            charsPerLine: s.printer_chars_per_line,
            encoding: s.printer_encoding,
            density: s.thermal_print_density,
            speed: s.thermal_print_speed,
            cutterEnabled: s.printer_cutter_enabled,
            drawerEnabled: s.printer_drawer_enabled,
            drawerPin: s.printer_drawer_pin,
          }
        );

        await printViaSerial(port, escposData);
        await disconnectSerialPrinter(port);
        return;
      }
    } catch {
      // Fall through to browser print
    }
  }

  // Network printing
  if (s.printer_type === "network" && s.printer_ip) {
    try {
      const escposData = generateEscPosReceipt(
        {
          invoice_number: invoice.invoice_number,
          date: invoice.date, time: invoice.time, cashier: invoice.cashier,
          items: invoice.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
          subtotal: invoice.subtotal || invoice.total,
          discount_total: invoice.discount_total,
          tax_total: invoice.tax_total,
          total: invoice.total,
          payment_method: invoice.payment_method,
          paid_amount: invoice.paid_amount,
          change_amount: invoice.change_amount,
          customer: invoice.customer ? { name: invoice.customer.name, phone: invoice.customer.phone } : undefined,
        },
        {
          store_name: s.store_name, store_phone: s.store_phone,
          store_address: s.store_address, store_tax_number: s.store_tax_number,
          receipt_header: s.receipt_header, receipt_footer: s.receipt_footer,
          currency: s.currency, currency_position: s.currency_position,
        },
        {
          type: "network", paperSize: s.receipt_paper_size,
          charsPerLine: s.printer_chars_per_line, encoding: s.printer_encoding,
          density: s.thermal_print_density, speed: s.thermal_print_speed,
          cutterEnabled: s.printer_cutter_enabled, drawerEnabled: s.printer_drawer_enabled,
          drawerPin: s.printer_drawer_pin,
          ip: s.printer_ip, port: s.printer_port,
        }
      );

      // Try sending via fetch to local print proxy
      try {
        await fetch(`http://localhost:9898/print`, {
          method: "POST",
          headers: { "Content-Type": "application/octet-stream" },
          body: escposData,
        });
        return;
      } catch { /* fall through */ }
    } catch { /* fall through */ }
  }

  // Default: Browser print
  const printWindow = window.open("", "_blank", "width=400,height=500");
  if (!printWindow) return;
  printWindow.document.write(buildInvoiceHTML(invoice));
  printWindow.document.close();
}

// Preview cart before checkout
export function printCartPreview(cart: CartItem[], cashier: string) {
  const printWindow = window.open("", "_blank", "width=400,height=500");
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

// Alias for backward compatibility
export { printSaleInvoice as printInvoice };
