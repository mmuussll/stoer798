import { CURRENCY } from "@/constants";

/**
 * تنسيق رقم بفواصل كل 3 أرقام وإزالة الأصفار العشرية الزائدة.
 * أمثلة: 1000 => "1,000" | 1234.5 => "1,234.5" | 0 => "" | NaN => ""
 */
export function formatNumber(value: number | undefined | null, maxDecimals = 3): string {
  if (value === undefined || value === null) return "";
  if (Number.isNaN(value)) return "";
  if (value === 0) return "0";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
}

/**
 * تنسيق رقم مع رمز العملة. يُرجع نصاً فارغاً للقيم الصفرية أو غير الصالحة.
 */
export function formatCurrency(value: number | undefined | null, maxDecimals = 3): string {
  const num = formatNumber(value, maxDecimals);
  if (!num && num !== "0") return "";
  return `${num} ${CURRENCY}`;
}

/**
 * تنسيق رقم للعرض العام - لا يعود فارغاً أبداً (يُظهر "0" بدلاً من الفراغ).
 */
export function formatNumberDisplay(value: number | undefined | null, maxDecimals = 3): string {
  if (value === undefined || value === null) return "0";
  if (Number.isNaN(value)) return "0";
  if (value === 0) return "0";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
}

/**
 * تنسيق مبلغ مع العملة - لا يعود فارغاً أبداً.
 */
export function formatCurrencyDisplay(value: number | undefined | null, maxDecimals = 3): string {
  const num = formatNumberDisplay(value, maxDecimals);
  return `${num} ${CURRENCY}`;
}
