import { readPage, searchPattern, type ReadDatabase } from "@/lib/db/read";
import { dateFilter } from "@/lib/format/records";
import type {
  Customer,
  CustomerFilters,
  CustomerWorkspace,
  LedgerEntry,
  LedgerFilters
} from "./customers.types";

const customerColumns = `c.id,c.name,c.contact,c.customer_type AS customerType,c.notes,c.address,
 COALESCE(c.outstanding_balance,0) AS outstandingBalance,c.is_archived AS isArchived,
 c.archived_at AS archivedAt,c.created_at AS createdAt,c.updated_at AS updatedAt`;

export async function listCustomers(db: ReadDatabase, filters: CustomerFilters, page: number) {
  const conditions = ["(lower(c.name) LIKE ? ESCAPE '\\' OR c.contact LIKE ? ESCAPE '\\')"];
  const params: (string | number)[] = [
    searchPattern(filters.search),
    searchPattern(filters.search)
  ];
  if (filters.type !== "all") {
    conditions.push("c.customer_type = ?");
    params.push(filters.type);
  }
  if (filters.archived !== "all") {
    conditions.push("c.is_archived = ?");
    params.push(filters.archived === "archived" ? 1 : 0);
  }
  if (filters.balance !== "all")
    conditions.push(
      `COALESCE(c.outstanding_balance,0) ${filters.balance === "due" ? ">" : filters.balance === "advance" ? "<" : "="} 0`
    );
  const order = {
    name: "c.name COLLATE NOCASE ASC",
    name_desc: "c.name COLLATE NOCASE DESC",
    balance: "ABS(COALESCE(c.outstanding_balance,0)) DESC",
    newest: "c.created_at DESC"
  }[filters.sort];
  const result = await readPage<Customer>(
    db,
    `SELECT ${customerColumns} FROM customers c WHERE ${conditions.join(" AND ")}`,
    params,
    `${order},c.id`,
    page
  );
  return { ...result, rows: result.rows.map((row) => ({ ...row, isArchived: !!row.isArchived })) };
}

export async function getCustomerWorkspace(
  db: ReadDatabase,
  id: string
): Promise<CustomerWorkspace | null> {
  const customer = await db.getFirstAsync<Customer>(
    `SELECT ${customerColumns} FROM customers c WHERE c.id=?`,
    id
  );
  if (!customer) return null;
  const [totals, lastPayment, opening, summary, activity] = await Promise.all([
    db.getFirstAsync<{
      totalDue: number;
      totalPaid: number;
      salesTotal: number;
      salesCount: number;
    }>(
      `SELECT
      COALESCE(SUM(amount_due),0) AS totalDue,COALESCE(SUM(amount_paid),0) AS totalPaid,
      COALESCE(SUM(CASE WHEN type IN ('sale','quick_sale') THEN amount_due ELSE 0 END),0) AS salesTotal,
      SUM(CASE WHEN type IN ('sale','quick_sale') THEN 1 ELSE 0 END) AS salesCount FROM customer_ledger WHERE customer_id=?`,
      id
    ),
    db.getFirstAsync<{ amount: number; mode: string; date: string }>(
      `SELECT COALESCE(amount_paid,0) AS amount,COALESCE(payment_mode,'cash') AS mode,created_at AS date FROM customer_ledger WHERE customer_id=? AND type='payment' ORDER BY created_at DESC,id DESC LIMIT 1`,
      id
    ),
    db.getFirstAsync<{ amount: number }>(
      `SELECT COALESCE(amount_due,0)-COALESCE(amount_paid,0) AS amount FROM customer_ledger WHERE customer_id=? AND type='opening_balance' ORDER BY created_at,id LIMIT 1`,
      id
    ),
    db.getFirstAsync<{
      salesCount: number;
      salesTotal: number;
      estimatesCount: number;
      estimatesTotal: number;
    }>(
      `SELECT
      (SELECT COUNT(*) FROM sales WHERE customer_id=?) AS salesCount,
      (SELECT COALESCE(SUM(grand_total),0) FROM sales WHERE customer_id=?) AS salesTotal,
      (SELECT COUNT(*) FROM estimates WHERE customer_id=?) AS estimatesCount,
      (SELECT COALESCE(SUM(grand_total),0) FROM estimates WHERE customer_id=?) AS estimatesTotal`,
      id,
      id,
      id,
      id
    ),
    db.getAllAsync<CustomerWorkspace["activity"][number]>(
      `SELECT * FROM (
      SELECT 's-'||id AS id,'sale' AS kind,created_at AS date,COALESCE(grand_total,0) AS amount,id AS documentId,invoice_no AS documentNo,notes FROM sales WHERE customer_id=?
      UNION ALL SELECT 'e-'||id,'estimate',created_at,COALESCE(grand_total,0),id,estimate_no,notes FROM estimates WHERE customer_id=?
      UNION ALL SELECT 'l-'||id,type,created_at,CASE WHEN COALESCE(amount_due,0)!=0 THEN amount_due ELSE -COALESCE(amount_paid,0) END,NULL,NULL,notes FROM customer_ledger WHERE customer_id=? AND type!='sale'
    ) ORDER BY date DESC,id DESC LIMIT 15`,
      id,
      id,
      id
    )
  ]);
  const s = summary!;
  return {
    customer: { ...customer, isArchived: !!customer.isArchived },
    summary: {
      ...s,
      average:
        s.salesCount + s.estimatesCount
          ? Math.round((s.salesTotal + s.estimatesTotal) / (s.salesCount + s.estimatesCount))
          : 0
    },
    ledger: {
      currentBalance: (totals?.totalDue ?? 0) - (totals?.totalPaid ?? 0),
      totalDue: totals?.totalDue ?? 0,
      totalPaid: totals?.totalPaid ?? 0,
      openingBalance: opening?.amount ?? 0,
      avgSale: totals?.salesCount ? Math.round(totals.salesTotal / totals.salesCount) : 0,
      salesCount: totals?.salesCount ?? 0,
      lastPayment
    },
    activity
  };
}

export function listCustomerLedger(
  db: ReadDatabase,
  id: string,
  filters: LedgerFilters,
  page: number
) {
  const date = dateFilter("l.created_at", filters.range);
  const conditions = [
    "l.customer_id=?",
    "(COALESCE(lower(l.notes),'') LIKE ? ESCAPE '\\' OR CAST(s.invoice_no AS TEXT)=?)",
    date.sql
  ];
  const params = [
    id,
    searchPattern(filters.search),
    filters.search.replace(/^#/, ""),
    ...date.params
  ];
  if (filters.type !== "all") {
    conditions.push("l.type=?");
    params.push(filters.type);
  }
  return readPage<LedgerEntry>(
    db,
    `SELECT l.id,l.customer_id AS customerId,l.type,l.sale_id AS saleId,s.invoice_no AS invoiceNo,
    COALESCE(l.amount_due,0) AS amountDue,COALESCE(l.amount_paid,0) AS amountPaid,l.payment_mode AS paymentMode,l.notes,l.created_at AS createdAt,
    (SELECT COALESCE(SUM(COALESCE(p.amount_due,0)-COALESCE(p.amount_paid,0)),0) FROM customer_ledger p
     WHERE p.customer_id=l.customer_id AND (p.created_at<l.created_at OR (p.created_at=l.created_at AND p.id<=l.id))) AS runningBalance
    FROM customer_ledger l LEFT JOIN sales s ON s.id=l.sale_id WHERE ${conditions.join(" AND ")}`,
    params,
    filters.sort === "oldest" ? "l.created_at ASC,l.id ASC" : "l.created_at DESC,l.id DESC",
    page
  );
}
