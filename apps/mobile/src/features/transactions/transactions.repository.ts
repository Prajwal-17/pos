import { readPage, searchPattern, type ReadDatabase } from "@/lib/db/read";
import { dateFilter } from "@/lib/format/records";
import type {
  Bill,
  StoreProfile,
  TransactionFilters,
  TransactionKind,
  TransactionRow
} from "./transactions.types";

function transactionSource(kind: TransactionKind) {
  return kind === "sale"
    ? { table: "sales", items: "sale_items", number: "invoice_no", parent: "sale_id" }
    : { table: "estimates", items: "estimate_items", number: "estimate_no", parent: "estimate_id" };
}
function transactionWhere(kind: TransactionKind, filters: TransactionFilters) {
  const source = transactionSource(kind);
  const date = dateFilter("t.created_at", filters.range);
  const search = filters.search.trim().replace(/^#/, "");
  const number = /^\d+$/.test(search) && Number.isSafeInteger(Number(search)) ? Number(search) : -1;
  const conditions = [date.sql, `(lower(c.name) LIKE ? ESCAPE '\\' OR t.${source.number}=?)`];
  const params: (string | number)[] = [...date.params, searchPattern(filters.search), number];
  if (filters.customerId) {
    conditions.push("t.customer_id=?");
    params.push(filters.customerId);
  }
  return { source, params, where: conditions.join(" AND ") };
}
export function listTransactions(
  db: ReadDatabase,
  kind: TransactionKind,
  filters: TransactionFilters,
  page: number
) {
  const { source, params, where } = transactionWhere(kind, filters);
  const order = {
    newest: "t.created_at DESC",
    oldest: "t.created_at ASC",
    high: "t.grand_total DESC",
    low: "t.grand_total ASC"
  }[filters.sort];
  return readPage<TransactionRow>(
    db,
    `SELECT t.id,t.customer_id AS customerId,c.name AS customerName,t.${source.number} AS transactionNo,t.created_at AS createdAt,
    COALESCE(t.grand_total,0) AS grandTotal,COALESCE(t.total_quantity,0) AS totalQuantity,t.notes,
    ${kind === "sale" ? "EXISTS(SELECT 1 FROM customer_ledger l WHERE l.sale_id=t.id)" : "0"} AS inLedger
    FROM ${source.table} t JOIN customers c ON c.id=t.customer_id WHERE ${where}`,
    params,
    `${order},t.id`,
    page
  );
}
export async function transactionSummary(
  db: ReadDatabase,
  kind: TransactionKind,
  filters: TransactionFilters
) {
  const { source, params, where } = transactionWhere(kind, filters);
  return (await db.getFirstAsync<{ total: number; count: number }>(
    `SELECT COALESCE(SUM(t.grand_total),0) AS total,COUNT(*) AS count FROM ${source.table} t JOIN customers c ON c.id=t.customer_id WHERE ${where}`,
    ...params
  ))!;
}
export async function getBill(
  db: ReadDatabase,
  kind: TransactionKind,
  id: string
): Promise<Bill | null> {
  const source = transactionSource(kind);
  const bill = await db.getFirstAsync<TransactionRow & { recordedAt: string | null }>(
    `SELECT t.id,t.customer_id AS customerId,c.name AS customerName,t.${source.number} AS transactionNo,t.created_at AS createdAt,
    ${kind === "sale" ? "t.recorded_at" : "NULL"} AS recordedAt,COALESCE(t.grand_total,0) AS grandTotal,COALESCE(t.total_quantity,0) AS totalQuantity,t.notes,
    ${kind === "sale" ? "EXISTS(SELECT 1 FROM customer_ledger l WHERE l.sale_id=t.id)" : "0"} AS inLedger
    FROM ${source.table} t JOIN customers c ON c.id=t.customer_id WHERE t.id=?`,
    id
  );
  if (!bill) return null;
  const [customer, items] = await Promise.all([
    db.getFirstAsync<Bill["customer"]>(
      "SELECT id,name,contact,address FROM customers WHERE id=?",
      bill.customerId
    ),
    db.getAllAsync<Bill["items"][number]>(
      `SELECT id,product_id AS productId,name,product_snapshot AS productSnapshot,weight,unit,price,mrp,quantity,total_price AS totalPrice,purchase_price AS purchasePrice,COALESCE(checked_qty,0) AS checkedQty,position FROM ${source.items} WHERE ${source.parent}=? ORDER BY position,created_at,id`,
      id
    )
  ]);
  return { ...bill, kind, customer: customer!, items };
}
export function getStoreProfile(db: ReadDatabase) {
  return db.getFirstAsync<StoreProfile>(
    `SELECT id,store_name AS storeName,owner_name AS ownerName,phone,email,address_line1 AS addressLine1,address_line2 AS addressLine2,country,state,pincode,city,gstin,created_at AS createdAt,updated_at AS updatedAt FROM store_profile ORDER BY CASE WHEN id='default' THEN 0 ELSE 1 END,id LIMIT 1`
  );
}
