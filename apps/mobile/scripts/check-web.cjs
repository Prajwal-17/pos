// Run after starting Expo web. Reuses the desktop workspace's Playwright install.
const assert = require("node:assert/strict");
const { createRequire } = require("node:module");
const { mkdir } = require("node:fs/promises");
const path = require("node:path");
const { chromium, expect } = createRequire(path.resolve(__dirname, "../../desktop/package.json"))(
  "@playwright/test"
);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const output = "/tmp/relay-mobile-check";
  await mkdir(output, { recursive: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(process.env.MOBILE_WEB_URL || "http://localhost:8084", {
      waitUntil: "networkidle",
      timeout: 120000
    });
    await expect(page.getByRole("button", { name: "Add record", exact: true })).toBeVisible({
      timeout: 120000
    });
    const ledgerTab = page.getByRole("tab", { name: "Ledger", exact: true });
    await expect(ledgerTab).toBeVisible();
    const tabBounds = await ledgerTab.boundingBox();
    assert(tabBounds.y > 740, "Ledger navigation must be at the bottom");
    await expect(page.getByText("Relay", { exact: true })).toHaveCount(0);
    for (const section of ["Sales", "Estimates", "Customers"]) {
      await page.getByRole("tab", { name: section, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/${section.toLowerCase()}$`));
      await expect(page.getByRole("tab", { name: section, exact: true })).toHaveAttribute(
        "aria-selected",
        "true"
      );
      await expect(page.getByRole("heading", { name: section, exact: true })).toBeVisible();
    }
    await ledgerTab.click();
    await expect(page.getByRole("button", { name: "Add record", exact: true })).toBeVisible();
    await page.screenshot({ path: `${output}/home-empty.png` });
    await page.getByRole("button", { name: "Add record", exact: true }).click();
    await page.getByLabel("Cash received", { exact: true }).fill("12450");
    await page.getByLabel("Paytm", { exact: true }).fill("2450");
    await page.getByLabel("PhonePe", { exact: true }).fill("4200.50");
    await page.getByLabel("Google Pay", { exact: true }).fill("1800");
    await page.getByLabel("Cash received", { exact: true }).scrollIntoViewIfNeeded();
    await page.getByLabel("Cash received", { exact: true }).blur();
    await page.screenshot({ path: `${output}/entry.png` });
    await page.getByRole("button", { name: "Add vendor payment", exact: true }).click();
    await page.getByLabel("Vendor name", { exact: true }).fill("Metro Wholesale & Distributors");
    await page.getByLabel("Amount paid", { exact: true }).fill("4250");
    await page
      .getByLabel("Note · optional", { exact: true })
      .fill("Rice and cooking oil · Invoice 208");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText("Saved", { exact: true })).toBeVisible();
    await expect(page.getByText("₹16,650.50", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText("₹16,650.50", { exact: true })).toBeVisible();
    await page.screenshot({ path: `${output}/home-saved.png` });

    for (const width of [360, 390, 768]) {
      await page.setViewportSize({ width, height: 844 });
      for (const section of ["Ledger", "Sales", "Estimates", "Customers"]) {
        const navLabel = page
          .getByRole("tab", { name: section, exact: true })
          .getByText(section, { exact: true });
        assert(
          await navLabel.evaluate((label) => {
            const bounds = label.getBoundingClientRect();
            return (
              bounds.height >= parseFloat(getComputedStyle(label).fontSize) &&
              bounds.bottom <= window.innerHeight
            );
          }),
          `${section} tab label clipped at ${width}px`
        );
      }
      assert(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        `Horizontal overflow at ${width}px`
      );
    }
    await page.setViewportSize({ width: 360, height: 800 });
    await page.getByRole("button", { name: "History", exact: true }).click();
    await expect(page.getByRole("button", { name: "Next month", exact: true })).toBeDisabled();
    await page.screenshot({ path: `${output}/history-360.png` });
    await page.getByRole("button", { name: "Close history", exact: true }).click();
    await page.getByRole("button", { name: "Edit record", exact: true }).click();
    await page.getByRole("button", { name: "Add vendor payment", exact: true }).click();
    const newVendor = page.getByLabel("Vendor name", { exact: true }).last();
    await newVendor.focus();
    const recentVendor = page.getByRole("button", {
      name: "Use vendor Metro Wholesale & Distributors",
      exact: true
    });
    await expect(recentVendor).toBeVisible();
    await newVendor.fill("mEtRo");
    await expect(recentVendor).toBeVisible();
    await newVendor.fill("not a saved vendor");
    await expect(page.getByText("No matches", { exact: true })).toBeVisible();
    await newVendor.fill("");
    await expect(recentVendor).toBeVisible();
    await page.screenshot({ path: `${output}/vendor-picker-360.png` });
    await recentVendor.click();
    await expect(newVendor).toHaveValue("Metro Wholesale & Distributors");
    await expect(recentVendor).toBeHidden();
    await expect(page.getByLabel("Amount paid", { exact: true }).last()).toHaveValue("");
    await page.getByLabel("Cash received", { exact: true }).fill("13000");
    page.once("dialog", (dialog) => dialog.dismiss());
    await page.getByRole("button", { name: "Close entry", exact: true }).click();
    await expect(page.getByLabel("Cash received", { exact: true })).toHaveValue("13000");
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Close entry", exact: true }).click();
    await expect(page.getByText("₹16,650.50", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Edit record", exact: true }).click();
    await page.getByRole("button", { name: "Providers", exact: true }).click();
    await page.getByLabel("New provider name", { exact: true }).fill("Shop bank transfer");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByText("Shop bank transfer", { exact: true })).toBeVisible();
    assert(
      await page.getByLabel("New provider name").evaluate((input) => {
        const card = input.parentElement.parentElement.getBoundingClientRect();
        const row = input.parentElement.getBoundingClientRect();
        return (
          row.left >= card.left &&
          row.right <= card.right &&
          input.parentElement.scrollWidth <= input.parentElement.clientWidth
        );
      }),
      "Provider form overflows its card"
    );
    await page.screenshot({ path: `${output}/providers-360.png` });
    await page.getByRole("button", { name: "Back to entry", exact: true }).click();
    await page.getByLabel("Shop bank transfer", { exact: true }).fill("100");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByText("₹16,750.50", { exact: true }).filter({ visible: true })
    ).toBeVisible();

    await page.getByRole("button", { name: "Edit record", exact: true }).click();
    await page.getByRole("button", { name: "Providers", exact: true }).click();
    await page.getByRole("button", { name: "Hide Shop bank transfer", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Restore Shop bank transfer", exact: true })
    ).toBeVisible();
    await page.getByRole("button", { name: "Back to entry", exact: true }).click();
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByText("₹16,750.50", { exact: true }).filter({ visible: true })
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByText("₹16,750.50", { exact: true }).filter({ visible: true })
    ).toBeVisible();

    page.once("dialog", (dialog) => dialog.dismiss());
    await page.getByRole("button", { name: "Delete record", exact: true }).click();
    await expect(page.getByText("Saved", { exact: true })).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete record", exact: true }).click();
    await expect(page.getByRole("button", { name: "Add record", exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("button", { name: "Add record", exact: true })).toBeVisible();
    assert.deepEqual(errors, [], "Browser runtime errors");
    console.log(
      `PASS: real SQLite create, reload, totals, recent vendor search/selection, bottom navigation, discard/cancel, provider creation/archive, historical receipts, delete/cancel, and 360/390/768px layouts. Screenshots: ${output}`
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
