import { fromMilliUnits } from "@desktop-shared/utils/milliUnits";
import { getTodayIST, type LocalDate } from "./dates";

export const quantity = (value: number | null) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 3 }).format(fromMilliUnits(value ?? 0));
export function recordDate(value: string | null | undefined, time = false): string {
  if (!value || Number.isNaN(Date.parse(value))) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(time ? ({ hour: "numeric", minute: "2-digit" } as const) : {})
  }).format(new Date(value));
}
export const balanceLabel = (paisa: number) =>
  paisa > 0 ? "Due" : paisa < 0 ? "Advance" : "Settled";
export const customerTypeLabel = (type: string) =>
  ({ cash: "Cash", account: "Account", hotel: "Hotel" })[type] ?? type;
export type Period = "all" | "today" | "week" | "month" | "year" | "custom";
export interface DateRange {
  period: Period;
  from?: LocalDate;
  to?: LocalDate;
}
export const periodNames: Record<Period, string> = {
  all: "All dates",
  today: "Today",
  week: "7 days",
  month: "This month",
  year: "This year",
  custom: "Custom"
};
export function rangeDates(range: DateRange): { from: LocalDate; to: LocalDate } | null {
  const today = getTodayIST();
  if (range.period === "all") return null;
  if (range.period === "custom")
    return range.from && range.to ? { from: range.from, to: range.to } : null;
  let from = today;
  if (range.period === "week") {
    const day = new Date(`${today}T12:00:00Z`);
    day.setUTCDate(day.getUTCDate() - 6);
    from = day.toISOString().slice(0, 10) as LocalDate;
  } else if (range.period === "month") from = `${today.slice(0, 7)}-01` as LocalDate;
  else if (range.period === "year") from = `${today.slice(0, 4)}-01-01` as LocalDate;
  return { from, to: today };
}
export function dateFilter(column: string, range: DateRange): { sql: string; params: string[] } {
  const dates = rangeDates(range);
  if (!dates) return { sql: "1=1", params: [] };
  const end = new Date(`${dates.to}T00:00:00+05:30`);
  end.setUTCDate(end.getUTCDate() + 1);
  return {
    sql: `${column} >= ? AND ${column} < ?`,
    params: [new Date(`${dates.from}T00:00:00+05:30`).toISOString(), end.toISOString()]
  };
}
