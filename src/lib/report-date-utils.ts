const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

export type ReportPeriod = "daily" | "3days" | "weekly" | "monthly";

export const PERIOD_LABEL_MAP: Record<ReportPeriod, string> = {
  daily: "يومي",
  "3days": "كل 3 أيام",
  weekly: "أسبوعي",
  monthly: "شهري",
};

export function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function getPeriodKey(dateStr: string, period: ReportPeriod): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  switch (period) {
    case "daily":
      return dateStr;
    case "3days": {
      const periodStart = Math.floor((day - 1) / 3) * 3 + 1;
      return `${y}-${String(m).padStart(2, "0")}-${String(periodStart).padStart(2, "0")}`;
    }
    case "weekly": {
      const daysSinceSaturday = (d.getDay() + 1) % 7;
      const saturday = new Date(d);
      saturday.setDate(d.getDate() - daysSinceSaturday);
      return `${saturday.getFullYear()}-${String(saturday.getMonth() + 1).padStart(2, "0")}-${String(saturday.getDate()).padStart(2, "0")}`;
    }
    case "monthly":
      return `${y}-${String(m).padStart(2, "0")}`;
    default:
      return dateStr;
  }
}

export function getPeriodLabel(key: string, period: ReportPeriod): string {
  const [y, m, ...rest] = key.split("-").map(Number);
  switch (period) {
    case "daily": {
      const d = new Date(y, m - 1, rest[0]);
      return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[m - 1]}`;
    }
    case "3days": {
      const end = new Date(y, m - 1, rest[0] + 2);
      return `${String(rest[0]).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")} ${MONTHS[m - 1]}`;
    }
    case "weekly": {
      const end = new Date(y, m - 1, rest[0] + 6);
      const startMonth = MONTHS[m - 1];
      const endMonth = MONTHS[end.getMonth()];
      if (startMonth === endMonth) {
        return `${String(rest[0]).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")} ${startMonth}`;
      }
      return `${String(rest[0]).padStart(2, "0")} ${startMonth} - ${String(end.getDate()).padStart(2, "0")} ${endMonth}`;
    }
    case "monthly":
      return `${MONTHS[m - 1]} ${y}`;
    default:
      return key;
  }
}
