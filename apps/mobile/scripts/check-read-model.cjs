// Mobile repository tests using Node SQLite; never starts the desktop app.
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { createRequire } = require("node:module");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const root = path.resolve(__dirname, "../../..");
const requireDesktop = createRequire(path.join(root, "apps/desktop/package.json"));
const { buildSync } = requireDesktop("esbuild");
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "relay-mobile-read-"));
function load(relative) {
  const target = path.join(temporary, path.basename(relative) + ".cjs");
  buildSync({
    entryPoints: [path.join(root, "apps/mobile/src", relative)],
    outfile: target,
    bundle: true,
    platform: "node",
    format: "cjs",
    tsconfig: path.join(root, "apps/mobile/tsconfig.json"),
    logLevel: "silent"
  });
  return require(target);
}
const db = new DatabaseSync(":memory:");
const migrations = path.join(root, "apps/desktop/drizzle");
for (const entry of JSON.parse(fs.readFileSync(path.join(migrations, "meta/_journal.json")))
  .entries)
  db.exec(fs.readFileSync(path.join(migrations, entry.tag + ".sql"), "utf8"));
const read = {
  getAllAsync: async (sql, ...args) => db.prepare(sql).all(...args),
  getFirstAsync: async (sql, ...args) => db.prepare(sql).get(...args) ?? null
};
const money = load("lib/format/records.ts");
const customers = load("features/customers/customers.repository.ts");
const products = load("features/products/products.repository.ts");
const reports = load("features/reports/reports.repository.ts");
const home = load("features/home/home.repository.ts");
const html = load("features/transactions/bill-html.ts");
const transactions = load("features/transactions/transactions.repository.ts");
const filters = { search: "", type: "all", balance: "all", archived: "active", sort: "name" };
const all = { period: "all" };
(async () => {
  db.exec(`INSERT INTO customers(id,name,customer_type,outstanding_balance) VALUES ('a','A & Co','account',7000),('b','Cash','cash',0),('c','Archived','account',-2000);
    UPDATE customers SET is_archived=1 WHERE id='c';
    INSERT INTO products(id,name,product_snapshot,price) VALUES ('p','Current name','Current name',500);
    INSERT INTO sales(id,invoice_no,customer_id,grand_total,total_quantity,created_at) VALUES ('s',42,'a',2000,1500,'2026-09-01T18:45:00.000Z');
    INSERT INTO sale_items(id,sale_id,product_id,name,product_snapshot,price,quantity,total_price,position) VALUES ('i','s','p','Historical name','Historical name 1kg',1300,1500,1950,0);
    INSERT INTO customer_ledger(id,customer_id,type,amount_due,amount_paid,created_at) VALUES
      ('l1','a','opening_balance',10000,0,'2026-09-01T00:00:00.000Z'),
      ('l2','a','payment',0,4000,'2026-09-02T00:00:00.000Z'),
      ('l3','a','adjustment',1000,0,'2026-09-02T00:00:00.000Z'),
      ('l4','c','payment',0,2000,'2026-09-01T00:00:00.000Z');`);
  db.exec(`INSERT INTO products(id,name,product_snapshot,price,is_disabled,is_deleted) VALUES ('inactive','Inactive','Inactive',900,1,0),('deleted','Deleted','Deleted',1000,0,1);
    INSERT INTO product_history(id,name,product_id,old_price,new_price) VALUES ('h','Historical name','p',NULL,500);
    INSERT INTO estimates(id,estimate_no,customer_id,grand_total,total_quantity,created_at) VALUES ('e',8,'b',3000,2000,'2026-09-02T04:00:00.000Z');
    INSERT INTO estimate_items(id,estimate_id,product_id,name,product_snapshot,price,quantity,total_price,position) VALUES ('ei','e','p','Estimate name','Estimate name',1500,2000,3000,0);`);
  db.exec("PRAGMA query_only=ON");
  assert.equal((await customers.listCustomers(read, filters, 1)).totalCount, 2);
  assert.equal(
    (await customers.listCustomers(read, { ...filters, search: "a &" }, 1)).rows[0].id,
    "a"
  );
  assert.equal(
    (await customers.listCustomers(read, { ...filters, search: "%" }, 1)).totalCount,
    0,
    "Search wildcard must be literal"
  );
  assert.equal(
    (await customers.listCustomers(read, { ...filters, balance: "advance", archived: "all" }, 1))
      .rows[0].id,
    "c"
  );
  const workspace = await customers.getCustomerWorkspace(read, "a");
  assert.equal(workspace.ledger.currentBalance, 7000);
  assert.equal(workspace.ledger.openingBalance, 10000);
  assert.equal(workspace.ledger.lastPayment.amount, 4000);
  assert.equal(workspace.summary.salesTotal, 2000);
  const ledger = await customers.listCustomerLedger(
    read,
    "a",
    { search: "", type: "payment", range: all, sort: "newest" },
    1
  );
  assert.equal(ledger.rows[0].runningBalance, 6000, "Filtered ledger includes preceding entries");
  const chronological = await customers.listCustomerLedger(
    read,
    "a",
    { search: "", type: "all", range: all, sort: "oldest" },
    1
  );
  assert.deepEqual(
    chronological.rows.map((r) => r.runningBalance),
    [10000, 6000, 7000],
    "Tie order uses IDs"
  );
  const bills = await transactions.listTransactions(
    read,
    "sale",
    { search: "#42", range: all, sort: "newest" },
    1
  );
  assert.equal(bills.rows[0].transactionNo, 42);
  assert.equal(bills.rows[0].inLedger, 0, "A sale is not automatically an account debt");
  const bill = await transactions.getBill(read, "sale", "s");
  assert.equal(bill.items[0].productSnapshot, "Historical name 1kg");
  const document = html.billHtml(
    { ...bill, notes: '<script>alert("x")</script>' },
    {
      storeName: "Shop & Sons",
      addressLine1: "Main road",
      phone: "123",
      city: "City",
      state: "State",
      pincode: "1"
    }
  );
  assert(document.includes("Shop &amp; Sons"));
  assert(document.includes("Historical name 1kg"));
  assert(document.includes("&lt;script&gt;"));
  assert(!document.includes("<script>"));
  assert(!document.includes("purchasePrice"));
  assert(document.includes("table-header-group"));
  assert.equal(bill.items[0].quantity, 1500);
  assert.equal(bill.grandTotal - bill.items[0].totalPrice, 50);
  assert.equal(money.quantity(1500), "1.5");
  const onSecond = await transactions.listTransactions(
    read,
    "sale",
    {
      search: "",
      range: { period: "custom", from: "2026-09-02", to: "2026-09-02" },
      sort: "newest"
    },
    1
  );
  assert.equal(onSecond.totalCount, 1, "IST midnight must not be grouped as prior UTC day");
  assert.equal(await transactions.getBill(read, "sale", "missing"), null);
  const activeProducts = await products.listProducts(
    read,
    { search: "", status: "active", sort: "name" },
    1
  );
  assert.equal(activeProducts.totalCount, 1);
  assert.equal(
    (await products.listProducts(read, { search: "", status: "inactive", sort: "name" }, 1)).rows[0]
      .id,
    "inactive"
  );
  assert.equal((await products.getProduct(read, "deleted")).isDeleted, true);
  assert.equal((await products.productPrices(read, "p", 1)).rows[0].oldPrice, null);
  assert.equal(
    (await products.productBills(read, "p", { search: "", kind: "all", range: all }, 1)).rows
      .length,
    2
  );
  const report = await reports.getReport(read, {
    period: "custom",
    from: "2026-09-01",
    to: "2026-09-03"
  });
  assert.equal(report.sales.total, 2000);
  assert.equal(report.estimates.total, 3000);
  assert.deepEqual(
    report.trend.map((row) => [row.date, row.sales, row.estimates]),
    [
      ["2026-09-01", 0, 0],
      ["2026-09-02", 2000, 3000],
      ["2026-09-03", 0, 0]
    ]
  );
  assert.equal(report.products[0].quantity, 1500, "Product ranking excludes estimate quantities");
  assert.equal(report.balances.due, 7000);
  assert.equal(report.balances.advance, 2000, "Archived advances remain visible");
  assert.equal((await reports.getReport(read, all)).trend[0].date, "2026-09");
  assert.equal((await home.getHomeSummary(read)).products, 1);
  assert.equal((await home.recentBills(read))[0].kind, "estimate");
  assert.throws(() => db.exec("DELETE FROM customers"), /readonly/);
  db.exec("PRAGMA query_only=OFF");
  const insertCustomer = db.prepare(
    "INSERT INTO customers(id,name,customer_type) VALUES (?,?,'cash')"
  );
  for (let index = 0; index < 113; index++)
    insertCustomer.run(`page-${index}`, `Pagination ${String(index).padStart(3, "0")}`);
  db.exec("PRAGMA query_only=ON");
  const paged = [];
  let nextPage = 1;
  while (nextPage != null) {
    const result = await customers.listCustomers(
      read,
      { ...filters, search: "Pagination" },
      nextPage
    );
    assert.equal(result.totalCount, 113);
    assert(result.rows.length <= 50);
    paged.push(...result.rows.map((row) => row.id));
    nextPage = result.nextPageNo;
  }
  assert.equal(paged.length, 113);
  assert.equal(new Set(paged).size, 113, "Pagination must not repeat or skip records");
  console.log(
    "PASS: mobile customer search, archives/advance, ledger balances/filter/ties, historical bills, paisa rounding, milli quantities, IST ranges, product history, separate report totals, chart gaps, balances, Home and read-only queries"
  );
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    db.close();
    fs.rmSync(temporary, { recursive: true, force: true });
  });
