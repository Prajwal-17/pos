import type { ReadDatabase } from "@/lib/db/read";
import { dateFilter } from "@/lib/format/records";
import type { TransactionKind } from "@/features/transactions/transactions.types";
export interface HomeSummary {
  salesTotal: number;
  salesCount: number;
  estimatesTotal: number;
  estimatesCount: number;
  customers: number;
  products: number;
}
export function getHomeSummary(db: ReadDatabase) {
  const day = dateFilter("created_at", { period: "today" });
  return db.getFirstAsync<HomeSummary>(
    `SELECT
    (SELECT COALESCE(SUM(grand_total),0) FROM sales WHERE ${day.sql}) AS salesTotal,
    (SELECT COUNT(*) FROM sales WHERE ${day.sql}) AS salesCount,
    (SELECT COALESCE(SUM(grand_total),0) FROM estimates WHERE ${day.sql}) AS estimatesTotal,
    (SELECT COUNT(*) FROM estimates WHERE ${day.sql}) AS estimatesCount,
    (SELECT COUNT(*) FROM customers WHERE is_archived=0) AS customers,
    (SELECT COUNT(*) FROM products WHERE is_deleted=0 AND is_disabled=0) AS products`,
    ...day.params,
    ...day.params,
    ...day.params,
    ...day.params
  );
}
export interface RecentBill {
  id: string;
  billId: string;
  kind: TransactionKind;
  number: number;
  customerName: string;
  total: number;
  date: string;
}
export function recentBills(db: ReadDatabase) {
  return db.getAllAsync<RecentBill>(`SELECT * FROM (
    SELECT 's-'||t.id AS id,t.id AS billId,'sale' AS kind,t.invoice_no AS number,c.name AS customerName,COALESCE(t.grand_total,0) AS total,t.created_at AS date FROM sales t JOIN customers c ON c.id=t.customer_id
    UNION ALL SELECT 'e-'||t.id,t.id,'estimate',t.estimate_no,c.name,COALESCE(t.grand_total,0),t.created_at FROM estimates t JOIN customers c ON c.id=t.customer_id
    ) ORDER BY date DESC,id DESC LIMIT 6`);
}
