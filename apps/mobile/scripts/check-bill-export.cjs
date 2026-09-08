// Verify the mobile bill HTML and web print action with an isolated browser.
const assert = require("node:assert/strict");
const { createRequire } = require("node:module");
const { DatabaseSync } = require("node:sqlite");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const requireDesktop = createRequire(path.resolve(__dirname, "../../desktop/package.json"));
const { chromium, expect } = requireDesktop("@playwright/test");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "relay-mobile-pdf-"));
requireDesktop("esbuild").buildSync({
  entryPoints: [path.resolve(__dirname, "../src/features/transactions/bill-html.ts")],
  outfile: path.join(tmp, "bill.cjs"),
  bundle: true,
  platform: "node",
  tsconfig: path.resolve(__dirname, "../tsconfig.json"),
  logLevel: "silent"
});
const { billHtml } = require(path.join(tmp, "bill.cjs"));
const data = new DatabaseSync(path.resolve(__dirname, "../assets/data/desktop.db"), {
  readOnly: true
});
const sale = data
  .prepare("SELECT id,invoice_no FROM sales ORDER BY created_at DESC,id LIMIT 1")
  .get();
data.close();
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(() => {
      window.print = () => {
        window.top.postMessage(
          { kind: "test-print", html: document.documentElement.outerHTML },
          "*"
        );
        setTimeout(() => window.dispatchEvent(new Event("afterprint")), 30);
      };
      window.addEventListener("message", (event) => {
        if (event.data?.kind === "test-print") window.__billPrint = event.data.html;
      });
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto((process.env.MOBILE_WEB_URL || "http://localhost:8084") + "/sales");
    const search = page.getByRole("textbox", { name: "Search sales", exact: true });
    await expect(search).toBeVisible({ timeout: 120000 });
    await search.fill("#" + sale.invoice_no);
    await page
      .getByRole("button", { name: `Open sale ${sale.invoice_no}`, exact: true })
      .click({ timeout: 120000 });
    await page.getByRole("button", { name: "Share PDF", exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => window.__billPrint || ""))
      .toContain(`Sale #${sale.invoice_no}`);
    await expect(page.locator('iframe[title="Bill print preview"]')).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Share PDF", exact: true })).toBeEnabled();
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await expect(search).toHaveValue("#" + sale.invoice_no);
    assert.deepEqual(errors, []);
    const html = billHtml(
      {
        kind: "sale",
        transactionNo: 42,
        createdAt: "2026-09-08T10:00:00Z",
        grandTotal: 117000,
        customer: { name: "Test customer & family", contact: "", address: "Test address" },
        notes: "60-item pagination check. <Text is escaped>.",
        items: Array.from({ length: 60 }, (_, i) => ({
          productSnapshot: `Item ${i + 1}: Rice & lentils - premium grain, 1 kg`,
          quantity: 1500,
          price: 1300,
          totalPrice: 1950
        }))
      },
      {
        storeName: "Test shop",
        addressLine1: "Market road",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
        phone: "0000000000"
      }
    );
    const printPage = await browser.newPage();
    await printPage.setContent(html);
    assert.equal(await printPage.locator("tbody tr").count(), 63);
    const output = "/tmp/relay-mobile-workspace";
    fs.mkdirSync(output, { recursive: true });
    await printPage.pdf({
      path: path.join(output, "bill-pagination.pdf"),
      preferCSSPageSize: true,
      printBackground: true
    });
    console.log(
      "PASS: mobile Sales lookup, PDF action, print cleanup/cancellation, back-state, escaped content and 60-item PDF generation"
    );
  } finally {
    await browser.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
