/**
 * Thermal Printer Service - ESC/POS Command Generation
 * Supports: Browser Print, Web Serial (USB), Network (TCP)
 */

export type PrinterConnectionType = "browser" | "serial" | "network";

export interface PrinterConfig {
  type: PrinterConnectionType;
  paperSize: string;
  charsPerLine: number;
  encoding: string;
  density: number;
  speed: number;
  cutterEnabled: boolean;
  drawerEnabled: boolean;
  drawerPin: number;
  ip?: string;
  port?: string;
}

// ESC/POS Commands
const ESC = "\x1B";
const GS = "\x1D";

const CMD = {
  INIT: ESC + "@",
  CENTER: ESC + "a\x01",
  LEFT: ESC + "a\x00",
  RIGHT: ESC + "a\x02",
  BOLD_ON: ESC + "E\x01",
  BOLD_OFF: ESC + "E\x00",
  UNDERLINE_ON: ESC + "-\x01",
  UNDERLINE_OFF: ESC + "-\x00",
  DOUBLE_HEIGHT: ESC + "!\x10",
  DOUBLE_WIDTH: ESC + "!\x20",
  NORMAL: ESC + "!\x00",
  CUT_PARTIAL: GS + "V\x01",
  CUT_FULL: GS + "V\x00",
  LINE_FEED: "\n",
  FEED: (n: number) => ESC + "d" + String.fromCharCode(n),
  DRAWER: (pin: number) => ESC + "p" + String.fromCharCode(pin) + "\x19\xFA",
  BARCODE_HEIGHT: GS + "h\x50",
  BARCODE_WIDTH: GS + "w\x02",
  BARCODE_HRI: GS + "H\x02",
  BARCODE_CODE128: GS + "k\x49",
};

function getCharsPerLine(paperSize: string): number {
  switch (paperSize) {
    case "58mm": return 32;
    case "80mm": return 48;
    case "A4": return 80;
    case "A5": return 56;
    default: return 48;
  }
}

export function generateEscPosReceipt(
  invoice: {
    invoice_number: string;
    date: string;
    time: string;
    cashier: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    subtotal: number;
    discount_total?: number;
    tax_total?: number;
    total: number;
    payment_method?: string;
    paid_amount?: number;
    change_amount?: number;
    customer?: { name: string; phone?: string };
  },
  store: {
    store_name: string;
    store_phone?: string;
    store_address?: string;
    store_tax_number?: string;
    receipt_header?: string;
    receipt_footer?: string;
    currency: string;
    currency_position: string;
  },
  config: PrinterConfig
): Uint8Array {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const w = (s: string) => parts.push(encoder.encode(s));

  const cpL = config.charsPerLine || getCharsPerLine(config.paperSize);
  const fmtCurr = (amount: number) =>
    config.encoding === "utf8"
      ? store.currency_position === "before"
        ? `${store.currency} ${amount.toFixed(2)}`
        : `${amount.toFixed(2)} ${store.currency}`
      : amount.toFixed(2);

  // Divider
  const divider = "─".repeat(cpL);
  const thinDivider = "·".repeat(cpL);
  const pad = (left: string, right: string, width: number) => {
    const mid = width - left.length - right.length;
    if (mid <= 0) return left + " " + right;
    return left + " ".repeat(mid) + right;
  };

  // Init
  w(CMD.INIT);
  w(CMD.CENTER);

  // Store name
  w(CMD.BOLD_ON + CMD.DOUBLE_HEIGHT);
  w(store.store_name.toUpperCase() + CMD.LINE_FEED);
  w(CMD.NORMAL + CMD.BOLD_OFF);

  // Header text
  if (store.receipt_header) {
    w(store.receipt_header + CMD.LINE_FEED);
  }

  // Store info
  w(CMD.LEFT);
  if (store.store_address) w(store.store_address + CMD.LINE_FEED);
  if (store.store_phone) w("Tel: " + store.store_phone + CMD.LINE_FEED);
  if (store.store_tax_number) w("Tax: " + store.store_tax_number + CMD.LINE_FEED);
  w(divider + CMD.LINE_FEED);

  // Invoice meta
  w(CMD.CENTER);
  w("INVOICE" + CMD.LINE_FEED);
  w(CMD.LEFT);
  w(pad("No: " + invoice.invoice_number, "Date: " + invoice.date, cpL) + CMD.LINE_FEED);
  w(pad("Time: " + invoice.time, "Cashier: " + invoice.cashier, cpL) + CMD.LINE_FEED);
  if (invoice.customer?.name) {
    w("Customer: " + invoice.customer.name + CMD.LINE_FEED);
  }
  w(divider + CMD.LINE_FEED);

  // Items header
  w(CMD.BOLD_ON);
  w(pad("Item", "Qty x Price = Total", cpL) + CMD.LINE_FEED);
  w(CMD.BOLD_OFF);
  w(thinDivider + CMD.LINE_FEED);

  // Items
  for (const item of invoice.items) {
    const lineTotal = item.price * item.quantity;
    const name = item.name.length > cpL - 18 ? item.name.slice(0, cpL - 21) + ".." : item.name;
    const info = `${item.quantity} x ${item.price.toFixed(2)} = ${lineTotal.toFixed(2)}`;
    w(pad(name, info, cpL) + CMD.LINE_FEED);
  }

  w(divider + CMD.LINE_FEED);

  // Totals
  w(CMD.BOLD_ON);
  w(pad("SUBTOTAL:", fmtCurr(invoice.subtotal), cpL) + CMD.LINE_FEED);

  if (invoice.discount_total && invoice.discount_total > 0) {
    w(pad("DISCOUNT:", "-" + fmtCurr(invoice.discount_total), cpL) + CMD.LINE_FEED);
  }
  if (invoice.tax_total && invoice.tax_total > 0) {
    w(pad("TAX:", fmtCurr(invoice.tax_total), cpL) + CMD.LINE_FEED);
  }

  w(CMD.DOUBLE_HEIGHT);
  w(pad("TOTAL:", fmtCurr(invoice.total), cpL) + CMD.LINE_FEED);
  w(CMD.NORMAL + CMD.BOLD_OFF);

  // Payment info
  if (invoice.payment_method) {
    const pmLabel = invoice.payment_method === "cash" ? "CASH" : invoice.payment_method === "card" ? "CARD" : "MIXED";
    w(divider + CMD.LINE_FEED);
    w(pad("Payment:", pmLabel, cpL) + CMD.LINE_FEED);
    if (invoice.paid_amount && invoice.paid_amount > 0) {
      w(pad("Paid:", fmtCurr(invoice.paid_amount), cpL) + CMD.LINE_FEED);
    }
    if (invoice.change_amount && invoice.change_amount > 0) {
      w(pad("Change:", fmtCurr(invoice.change_amount), cpL) + CMD.LINE_FEED);
    }
  }

  // Footer
  w(CMD.CENTER);
  w(divider + CMD.LINE_FEED);
  if (store.receipt_footer) {
    w(store.receipt_footer + CMD.LINE_FEED);
  }
  w("Thank you!" + CMD.LINE_FEED);

  // Barcode (CODE128)
  w(CMD.LEFT);
  w(CMD.BARCODE_HEIGHT);
  w(CMD.BARCODE_WIDTH);
  w(CMD.BARCODE_HRI);
  w(CMD.BARCODE_CODE128 + String.fromCharCode(invoice.invoice_number.length) + invoice.invoice_number);
  w(CMD.LINE_FEED);
  w(CMD.LINE_FEED);

  // Feed & cut
  w(CMD.FEED(3));
  if (config.cutterEnabled) {
    w(CMD.CUT_PARTIAL);
  }

  // Open drawer
  if (config.drawerEnabled) {
    w(CMD.DRAWER(config.drawerPin || 0));
  }

  // Concatenate all parts
  const totalLen = parts.reduce((s, p) => s + p.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

// ============ Web Serial API ============

export async function connectSerialPrinter(): Promise<SerialPort | null> {
  try {
    if (!("serial" in navigator)) return null;
    const port = await (navigator as Navigator & { serial: Serial }).serial.requestPort({
      filters: [{ usbVendorId: 0x0416 }, { usbVendorId: 0x0493 }, { usbVendorId: 0x0471 }],
    });
    await port.open({ baudRate: 9600 });
    return port;
  } catch {
    return null;
  }
}

export async function printViaSerial(port: SerialPort, data: Uint8Array): Promise<boolean> {
  try {
    const writer = port.writable?.getWriter();
    if (!writer) return false;
    await writer.write(data);
    writer.releaseLock();
    return true;
  } catch {
    return false;
  }
}

export async function disconnectSerialPrinter(port: SerialPort): Promise<void> {
  try {
    if (port.writable) {
      const writer = port.writable.getWriter();
      writer.releaseLock();
    }
    await port.close();
  } catch { /* ignore */ }
}

// ============ Network Printer ============

export async function printViaNetwork(_ip: string, _port: string, _data: Uint8Array): Promise<boolean> {
  try {
    // Note: Direct TCP from browser is not possible without a proxy
    // This is a placeholder - actual implementation requires backend
    return false;
  } catch {
    return false;
  }
}

// ============ Printer Test ============

export function generateTestPage(config: PrinterConfig): Uint8Array {
  const cpL = config.charsPerLine || 48;
  const divider = "=".repeat(cpL);
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const w = (s: string) => parts.push(encoder.encode(s));

  w(CMD.INIT);
  w(CMD.CENTER);
  w(CMD.DOUBLE_HEIGHT + CMD.BOLD_ON);
  w("PRINTER TEST" + CMD.LINE_FEED);
  w(CMD.NORMAL + CMD.BOLD_OFF);
  w(divider + CMD.LINE_FEED);
  w("ESC/POS Thermal Printer" + CMD.LINE_FEED);
  w("Paper: " + config.paperSize + CMD.LINE_FEED);
  w("Chars/Line: " + cpL.toString() + CMD.LINE_FEED);
  w("Encoding: " + config.encoding + CMD.LINE_FEED);
  w(divider + CMD.LINE_FEED);
  w(CMD.LEFT);
  w("ABCDEFGHIJKLMNOPQRSTUVWXYZ" + CMD.LINE_FEED);
  w("abcdefghijklmnopqrstuvwxyz" + CMD.LINE_FEED);
  w("0123456789 !@#$%^&*()" + CMD.LINE_FEED);
  w(divider + CMD.LINE_FEED);
  w(CMD.CENTER);
  w("Barcode Test:" + CMD.LINE_FEED);
  w(CMD.LEFT);
  w(CMD.BARCODE_HEIGHT + CMD.BARCODE_WIDTH + CMD.BARCODE_HRI);
  w(CMD.BARCODE_CODE128 + "\x06" + "123456" + CMD.LINE_FEED);
  w(CMD.LINE_FEED);
  w(CMD.FEED(3));
  if (config.cutterEnabled) w(CMD.CUT_PARTIAL);

  const totalLen = parts.reduce((s, p) => s + p.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

// Check if Web Serial API is available
export function isWebSerialSupported(): boolean {
  return "serial" in navigator;
}
