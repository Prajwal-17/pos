import { readPage, searchPattern, type ReadDatabase } from "@/lib/db/read";
import { dateFilter } from "@/lib/format/records";
import type {
  PriceChange,
  ProductBill,
  ProductBillFilters,
  ProductFilters,
  ProductRecord
} from "./products.types";
const columns = `p.id,p.name,p.product_snapshot AS productSnapshot,p.weight,p.unit,p.mrp,p.price,p.purchase_price AS purchasePrice,
 p.total_quantity_sold AS totalQuantitySold,p.is_disabled AS isDisabled,p.is_deleted AS isDeleted,p.disabled_at AS disabledAt,p.deleted_at AS deletedAt,p.last_sold_at AS lastSoldAt,p.created_at AS createdAt,p.updated_at AS updatedAt`;
const normalize = (row: ProductRecord): ProductRecord => ({
  ...row,
  isDisabled: !!row.isDisabled,
  isDeleted: !!row.isDeleted
});
export async function listProducts(db: ReadDatabase, filters: ProductFilters, page: number) {
  const status = {
    active: "p.is_deleted=0 AND p.is_disabled=0",
    inactive: "p.is_deleted=0 AND p.is_disabled=1",
    deleted: "p.is_deleted=1",
    all: "1=1"
  }[filters.status];
  const order = {
    name: "p.name COLLATE NOCASE",
    name_desc: "p.name COLLATE NOCASE DESC",
    price_low: "p.price ASC",
    price_high: "p.price DESC",
    mrp_low: "p.mrp IS NULL,p.mrp ASC",
    mrp_high: "p.mrp IS NULL,p.mrp DESC"
  }[filters.sort];
  const result = await readPage<ProductRecord>(
    db,
    `SELECT ${columns} FROM products p WHERE ${status} AND lower(p.product_snapshot) LIKE ? ESCAPE '\\'`,
    [searchPattern(filters.search)],
    `${order},p.id`,
    page
  );
  return { ...result, rows: result.rows.map(normalize) };
}
export async function getProduct(db: ReadDatabase, id: string) {
  const product = await db.getFirstAsync<ProductRecord>(
    `SELECT ${columns} FROM products p WHERE p.id=?`,
    id
  );
  return product ? normalize(product) : null;
}
export function productPrices(db: ReadDatabase, id: string, page: number) {
  return readPage<PriceChange>(
    db,
    `SELECT id,name,weight,unit,old_price AS oldPrice,new_price AS newPrice,old_mrp AS oldMrp,new_mrp AS newMrp,old_purchase_price AS oldPurchasePrice,new_purchase_price AS newPurchasePrice,created_at AS createdAt FROM product_history WHERE product_id=?`,
    [id],
    "created_at DESC,id DESC",
    page
  );
}
export function productBills(
  db: ReadDatabase,
  id: string,
  filters: ProductBillFilters,
  page: number
) {
  const date = dateFilter("createdAt", filters.range);
  const sql = `SELECT * FROM (
    SELECT 's-'||i.id AS id,t.id AS billId,'sale' AS kind,t.invoice_no AS number,c.name AS customerName,i.quantity,i.price,i.total_price AS totalPrice,t.created_at AS createdAt FROM sale_items i JOIN sales t ON t.id=i.sale_id JOIN customers c ON c.id=t.customer_id WHERE i.product_id=?
    UNION ALL SELECT 'e-'||i.id,t.id,'estimate',t.estimate_no,c.name,i.quantity,i.price,i.total_price,t.created_at FROM estimate_items i JOIN estimates t ON t.id=i.estimate_id JOIN customers c ON c.id=t.customer_id WHERE i.product_id=?
    ) WHERE ${date.sql} AND (lower(customerName) LIKE ? ESCAPE '\\' OR CAST(number AS TEXT)=?) ${filters.kind === "all" ? "" : "AND kind=?"}`;
  const params = [
    id,
    id,
    ...date.params,
    searchPattern(filters.search),
    filters.search.replace(/^#/, "")
  ];
  if (filters.kind !== "all") params.push(filters.kind);
  return readPage<ProductBill>(db, sql, params, "createdAt DESC,id DESC", page);
}
