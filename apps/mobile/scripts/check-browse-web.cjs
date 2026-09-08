// Exercises only the Expo mobile app against its private desktop snapshot.
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
const product = db
  .prepare(
    `SELECT * FROM products p WHERE is_deleted=0 AND is_disabled=0 AND EXISTS(SELECT 1 FROM product_history h WHERE h.product_id=p.id) AND EXISTS(SELECT 1 FROM sale_items i WHERE i.product_id=p.id) ORDER BY length(name) DESC LIMIT 1`
  )
  .get();
const productBill = db
  .prepare(
    "SELECT s.id,s.invoice_no FROM sales s JOIN sale_items i ON i.sale_id=s.id WHERE i.product_id=? ORDER BY s.created_at DESC LIMIT 1"
  )
  .get(product.id);
const estimate = db
  .prepare("SELECT id,estimate_no FROM estimates ORDER BY created_at DESC LIMIT 1")
  .get();
const totals = db
  .prepare(
    "SELECT (SELECT SUM(grand_total) FROM sales) AS sales,(SELECT SUM(grand_total) FROM estimates) AS estimates"
  )
  .get();
const productCount = db
  .prepare("SELECT count(*) AS count FROM products WHERE is_deleted=0 AND is_disabled=0")
  .get().count;
const nextPageProduct = db
  .prepare(
    "SELECT product_snapshot FROM products WHERE is_deleted=0 AND is_disabled=0 ORDER BY name COLLATE NOCASE,id LIMIT 1 OFFSET 50"
  )
  .get();
db.close();
const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2
  }).format(value / 100);
(async () => {
  const browser = await chromium.launch({ headless: true });
  const output = "/tmp/relay-mobile-workspace";
  await mkdir(output, { recursive: true });
  try {
    const context = await browser.newContext({ viewport: { width: 360, height: 800 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const base = process.env.MOBILE_WEB_URL || "http://localhost:8084";
    const button = (name) => page.getByRole("button", { name, exact: true });
    const shown = (text) => page.getByText(text, { exact: true }).filter({ visible: true }).first();
    async function capture(name) {
      assert(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${name} horizontal overflow`
      );
      await page.screenshot({ path: `${output}/${name}.png` });
    }
    await page.goto(base);
    await expect(button("Today's sales")).toBeVisible({ timeout: 120000 });
    await expect(button(/^Open (sale|estimate) /).first()).toBeVisible();
    await capture("home-360");
    await button("Today's sales").click();
    await expect(page).toHaveURL(/sales\?period=today$/);
    await expect(shown("Today")).toBeVisible();
    await page.getByRole("tab", { name: "Home", exact: true }).click();
    await button("Reports").click();
    await expect(button("View report sales")).toBeVisible();
    await button("Filters").click();
    await page.getByRole("radio", { name: "Period: All dates", exact: true }).click();
    await button("Done").click();
    await expect(button("View report sales")).toContainText(currency(totals.sales));
    await expect(button("View report estimates")).toContainText(currency(totals.estimates));
    await capture("reports-360");
    await button("View customer due").click();
    await expect(page.getByRole("heading", { name: "Customer dues", exact: true })).toBeVisible();
    await button("Back").click();
    await expect(shown("All dates")).toBeVisible();
    await button("View report sales").click();
    await expect(page).toHaveURL(/sales\?period=all$/);
    await expect(shown(currency(totals.sales))).toBeVisible();
    await page.getByRole("tab", { name: "Estimates", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Search estimates", exact: true })
      .fill(`#${estimate.estimate_no}`);
    await button(`Open estimate ${estimate.estimate_no}`).click();
    await expect(
      page.getByRole("heading", { name: `Estimate #${estimate.estimate_no}`, exact: true })
    ).toBeVisible();
    await capture("estimate-360");
    await expect(button("Share PDF")).toBeEnabled();
    assert.equal(
      await page.getByRole("textbox").count(),
      0,
      "Bill must not expose editable fields"
    );
    await button("Back").click();
    await page.getByRole("tab", { name: "Products", exact: true }).click();
    await expect(shown(`${productCount.toLocaleString("en-IN")} records`)).toBeVisible();
    // Exercise an actual next page, including FlatList's automatic onEndReached path.
    const more = button("Load more");
    await more.click();
    await page.mouse.move(180, 450);
    for (
      let scroll = 0;
      scroll < 15 && !(await button(`Open product ${nextPageProduct.product_snapshot}`).count());
      scroll++
    ) {
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(150);
    }
    await capture("product-pagination-360");
    await expect(button(`Open product ${nextPageProduct.product_snapshot}`)).toBeVisible({
      timeout: 15000
    });
    const search = page.getByRole("textbox", { name: "Search products", exact: true });
    await search.fill(product.name);
    await button(`Open product ${product.product_snapshot}`).click();
    await expect(page.getByRole("heading", { name: product.name, exact: true })).toBeVisible();
    await capture("product-360");
    await page.getByRole("tab", { name: "Prices", exact: true }).click();
    await expect(shown("Selling")).toBeVisible();
    await capture("product-prices-360");
    await page.getByRole("tab", { name: "Bills", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Search product bills", exact: true })
      .fill(`#${productBill.invoice_no}`);
    await button(`Open sale ${productBill.invoice_no}`).first().click();
    await expect(
      page.getByRole("heading", { name: `Sale #${productBill.invoice_no}`, exact: true })
    ).toBeVisible();
    await button("Back").click();
    await expect(page.getByRole("tab", { name: "Bills", exact: true })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await button("Back").click();
    await expect(search).toHaveValue(product.name);
    await search.fill("missing-mobile-product-9e07");
    await expect(shown("No records")).toBeVisible();
    // A calendar range must propagate through the report link into the existing sales tab.
    await page.getByRole("tab", { name: "Home", exact: true }).click();
    await button("Reports").click();
    await button("Filters").click();
    await page.getByRole("radio", { name: "Period: Custom", exact: true }).click();
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date());
    await button(`Choose ${today.slice(0, 8)}01`).click();
    await button(`Choose ${today}`).click();
    await capture("custom-range-360");
    await button("Done").click();
    await button("View report sales").click();
    await expect(shown(`${today.slice(0, 8)}01 – ${today}`)).toBeVisible();
    await page.goto(base + "/product/missing-mobile-product");
    await expect(shown("Product not found")).toBeVisible({ timeout: 120000 });
    await button("Back").click();
    await page.goto(base + "/bill/sale/missing-mobile-bill");
    await expect(shown("Bill not found")).toBeVisible({ timeout: 120000 });
    const recovery = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const failedPage = await recovery.newPage();
    failedPage.on("pageerror", (error) => errors.push(error.message));
    let rejectSnapshot = true;
    await failedPage.route(
      (url) => url.href.includes("desktop.db"),
      (route) => {
        if (!rejectSnapshot) return route.continue();
        rejectSnapshot = false;
        return route.fulfill({ status: 503, body: "Unavailable" });
      }
    );
    await failedPage.goto(base);
    await expect(
      failedPage.getByText("Desktop snapshot could not load.", { exact: true }).first()
    ).toBeVisible({ timeout: 120000 });
    await failedPage.getByRole("button", { name: "Money entry", exact: true }).click();
    await expect(failedPage.getByRole("button", { name: "Add record", exact: true })).toBeVisible();
    await failedPage.getByRole("button", { name: "Back", exact: true }).click();
    await failedPage.getByRole("button", { name: "Try again", exact: true }).first().click();
    await expect(
      failedPage.getByRole("button", { name: "Today's sales", exact: true })
    ).toBeVisible({ timeout: 30000 });
    await recovery.close();
    assert.deepEqual(errors, []);
    console.log(
      `PASS: Home, report source totals and drilldowns, estimates, product pagination/details/prices/bills, back-state, empty/missing records, custom dates, snapshot error/retry, independent Money access and 360px layouts. Screenshots: ${output}`
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
