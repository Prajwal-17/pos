// Browser checks target Expo mobile only; desktop supplies an installed browser driver.
const assert = require("node:assert/strict");
const { createRequire } = require("node:module");
const { DatabaseSync } = require("node:sqlite");
const { mkdir } = require("node:fs/promises");
const path = require("node:path");
const { chromium, expect } = createRequire(path.resolve(__dirname, "../../desktop/package.json"))(
  "@playwright/test"
);
const db = new DatabaseSync(path.resolve(__dirname, "../assets/data/desktop.db"), {
  readOnly: true
});
const customer = db
  .prepare(
    `SELECT c.id,c.name,COALESCE(SUM(l.amount_due-l.amount_paid),0) AS balance FROM customers c JOIN customer_ledger l ON l.customer_id=c.id WHERE EXISTS(SELECT 1 FROM sales s WHERE s.customer_id=c.id) GROUP BY c.id ORDER BY c.id LIMIT 1`
  )
  .get();
const bill = db
  .prepare(
    "SELECT id,invoice_no,grand_total FROM sales WHERE customer_id=? ORDER BY created_at DESC,id LIMIT 1"
  )
  .get(customer.id);
db.close();
(async () => {
  const browser = await chromium.launch({ headless: true });
  const output = "/tmp/relay-mobile-workspace";
  await mkdir(output, { recursive: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto((process.env.MOBILE_WEB_URL || "http://localhost:8084") + "/customers");
    const search = page.getByRole("textbox", { name: "Search customers", exact: true });
    await expect(search).toBeVisible({ timeout: 120000 });
    await search.fill(customer.name);
    await page
      .getByRole("button", { name: `Open customer ${customer.name}`, exact: true })
      .click({ timeout: 120000 });
    await expect(page.getByRole("heading", { name: customer.name, exact: true })).toBeVisible();
    const currency = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2
    }).format(Math.abs(customer.balance) / 100);
    await expect(
      page.getByText(currency, { exact: true }).filter({ visible: true }).first()
    ).toBeVisible();
    await page.screenshot({ path: `${output}/customer-ledger.png` });
    await page.getByRole("tab", { name: "Sales", exact: true }).click();
    await page.getByRole("button", { name: `Open sale ${bill.invoice_no}`, exact: true }).click();
    await expect(
      page.getByRole("heading", { name: `Sale #${bill.invoice_no}`, exact: true })
    ).toBeVisible();
    await page.screenshot({ path: `${output}/bill.png` });
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await expect(page.getByRole("tab", { name: "Sales", exact: true })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await page.getByRole("tab", { name: "Details", exact: true }).click();
    await expect(page.getByText("Opening balance", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await expect(search).toHaveValue(customer.name);
    await page.getByRole("button", { name: "Clear search", exact: true }).click();
    await page.screenshot({ path: `${output}/customers.png` });
    await page.getByRole("button", { name: "Filters", exact: true }).click();
    await page.getByRole("radio", { name: "Balance: Due", exact: true }).click();
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await expect(
      page.getByRole("button", { name: `Open customer ${customer.name}`, exact: true })
    ).toBeVisible();
    for (const width of [360, 390]) {
      await page.setViewportSize({ width, height: 844 });
      assert(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `Overflow at ${width}`
      );
    }
    assert.deepEqual(errors, []);
    console.log(
      `PASS: mobile snapshot load, customers, balances, ledger, linked bill, detail sections, back-state, filters and narrow viewports. Screenshots: ${output}`
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
