import type { ReadDatabase } from "@/lib/db/read";
import { dateFilter, rangeDates, type DateRange } from "@/lib/format/records";

export interface TrendPoint {
  date: string;
  sales: number;
  estimates: number;
}
export interface Report {
  sales: { total: number; count: number };
  estimates: { total: number; count: number };
  trend: TrendPoint[];
  products: { id: string; name: string; quantity: number; total: number }[];
  balances: { due: number; advance: number; count: number };
}
export async function getReport(db: ReadDatabase, range: DateRange): Promise<Report> {
  const date = dateFilter("t.created_at", range);
  const dates = rangeDates(range);
  const monthly =
    range.period === "year" ||
    !dates ||
    (Date.parse(dates.to) - Date.parse(dates.from)) / 86400000 > 62;
  const grouping = monthly ? "%Y-%m" : "%Y-%m-%d";
  const [sales, estimates, trend, products, balances] = await Promise.all([
    db.getFirstAsync<Report["sales"]>(
      `SELECT COALESCE(SUM(t.grand_total),0) AS total,COUNT(*) AS count FROM sales t WHERE ${date.sql}`,
      ...date.params
    ),
    db.getFirstAsync<Report["estimates"]>(
      `SELECT COALESCE(SUM(t.grand_total),0) AS total,COUNT(*) AS count FROM estimates t WHERE ${date.sql}`,
      ...date.params
    ),
    db.getAllAsync<TrendPoint>(
      `SELECT date,SUM(sales) AS sales,SUM(estimates) AS estimates FROM (
      SELECT strftime('${grouping}',t.created_at,'+330 minutes') AS date,COALESCE(SUM(t.grand_total),0) AS sales,0 AS estimates FROM sales t WHERE ${date.sql} GROUP BY date
      UNION ALL SELECT strftime('${grouping}',t.created_at,'+330 minutes'),0,COALESCE(SUM(t.grand_total),0) FROM estimates t WHERE ${date.sql} GROUP BY 1
      ) GROUP BY date ORDER BY date`,
      ...date.params,
      ...date.params
    ),
    db.getAllAsync<Report["products"][number]>(
      `SELECT p.id,p.name,SUM(i.quantity) AS quantity,SUM(i.total_price) AS total FROM sale_items i JOIN sales t ON t.id=i.sale_id JOIN products p ON p.id=i.product_id WHERE ${date.sql} GROUP BY p.id ORDER BY quantity DESC,p.id LIMIT 10`,
      ...date.params
    ),
    db.getFirstAsync<
      Report["balances"]
    >(`SELECT COALESCE(SUM(CASE WHEN outstanding_balance>0 THEN outstanding_balance ELSE 0 END),0) AS due,
      COALESCE(SUM(CASE WHEN outstanding_balance<0 THEN -outstanding_balance ELSE 0 END),0) AS advance,
      SUM(CASE WHEN COALESCE(outstanding_balance,0)!=0 THEN 1 ELSE 0 END) AS count FROM customers`)
  ]);
  // Fill missing buckets so a closed/no-sale day does not disappear from the chart.
  const first = dates?.from ?? (trend[0]?.date ? `${trend[0].date}-01` : null);
  const last = dates?.to ?? (trend.at(-1)?.date ? `${trend.at(-1)!.date}-01` : null);
  const complete: TrendPoint[] = [];
  if (first && last) {
    const cursor = new Date(`${first.slice(0, monthly ? 7 : 10)}${monthly ? "-01" : ""}T12:00:00Z`);
    const end = new Date(`${last}T12:00:00Z`);
    const indexed = new Map(trend.map((point) => [point.date, point]));
    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, monthly ? 7 : 10);
      complete.push(indexed.get(key) ?? { date: key, sales: 0, estimates: 0 });
      if (monthly) cursor.setUTCMonth(cursor.getUTCMonth() + 1);
      else cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }
  return { sales: sales!, estimates: estimates!, trend: complete, products, balances: balances! };
}
