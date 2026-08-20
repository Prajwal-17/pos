import { count, eq, sql } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { LEDGER_ENTRY_TYPE } from "../../../../shared/types";
import {
  appInstance,
  appPreferences,
  customerLedger,
  customers,
  estimateItems,
  estimates,
  productHistory,
  products,
  saleItems,
  sales
} from "../../../db/schema";
import { seedTestData } from "../../../scripts/testDataGenerator";
import { createTestDb, type TestDb } from "../../helpers";

describe("test data generator", () => {
  let testDb: TestDb | undefined;

  afterEach(() => {
    testDb?.sqlite.close();
    testDb = undefined;
  });

  it("creates a complete, internally consistent dataset", () => {
    testDb = createTestDb();
    const { db, sqlite } = testDb;
    const summary = seedTestData(db, {
      customers: 12,
      products: 30,
      sales: 36,
      estimates: 15,
      seed: 42,
      asOf: new Date("2026-08-20T23:59:59.999Z")
    });

    const defaultCustomer = db.select().from(customers).where(eq(customers.name, "DEFAULT")).get();
    const preference = db
      .select()
      .from(appPreferences)
      .where(eq(appPreferences.storeId, "default"))
      .get();
    expect(db.select().from(appInstance).where(eq(appInstance.id, "default")).get()).toBeDefined();
    expect(preference?.config.billing.defaultCustomerId).toBe(defaultCustomer?.id);

    expect(db.select({ value: count() }).from(customers).get()?.value).toBe(summary.customers);
    expect(db.select({ value: count() }).from(products).get()?.value).toBe(summary.products);
    expect(db.select({ value: count() }).from(sales).get()?.value).toBe(summary.sales);
    expect(db.select({ value: count() }).from(estimates).get()?.value).toBe(summary.estimates);
    expect(db.select({ value: count() }).from(saleItems).get()?.value).toBe(summary.saleItems);
    expect(db.select({ value: count() }).from(estimateItems).get()?.value).toBe(
      summary.estimateItems
    );
    expect(db.select({ value: count() }).from(customerLedger).get()?.value).toBe(
      summary.ledgerEntries
    );
    expect(db.select({ value: count() }).from(productHistory).get()?.value).toBe(
      summary.productHistory
    );

    const invalidSaleTotals = db
      .select({ value: count() })
      .from(sales)
      .where(
        sql`${sales.grandTotal} != (SELECT COALESCE(SUM(total_price), 0) FROM sale_items WHERE sale_id = ${sales.id})
            OR ${sales.totalQuantity} != (SELECT COALESCE(SUM(quantity), 0) FROM sale_items WHERE sale_id = ${sales.id})`
      )
      .get()?.value;
    const invalidEstimateTotals = db
      .select({ value: count() })
      .from(estimates)
      .where(
        sql`${estimates.grandTotal} != (SELECT COALESCE(SUM(total_price), 0) FROM estimate_items WHERE estimate_id = ${estimates.id})
            OR ${estimates.totalQuantity} != (SELECT COALESCE(SUM(quantity), 0) FROM estimate_items WHERE estimate_id = ${estimates.id})`
      )
      .get()?.value;
    const invalidProductTotals = db
      .select({ value: count() })
      .from(products)
      .where(
        sql`${products.totalQuantitySold} !=
          (SELECT COALESCE(SUM(quantity), 0) FROM sale_items WHERE product_id = ${products.id}) +
          (SELECT COALESCE(SUM(quantity), 0) FROM estimate_items WHERE product_id = ${products.id})`
      )
      .get()?.value;

    expect(invalidSaleTotals).toBe(0);
    expect(invalidEstimateTotals).toBe(0);
    expect(invalidProductTotals).toBe(0);

    const allCustomers = db.select().from(customers).all();
    const allProducts = db.select().from(products).all();
    const allSaleItems = db.select().from(saleItems).all();
    const allEstimateItems = db.select().from(estimateItems).all();
    const ledgerTypes = new Set(
      db
        .select({ type: customerLedger.type })
        .from(customerLedger)
        .all()
        .map((entry) => entry.type)
    );

    expect(allCustomers.every((customer) => customer.name.length <= 40)).toBe(true);
    expect(allProducts.every((product) => product.name.length <= 40)).toBe(true);
    expect(allCustomers.some((customer) => customer.isArchived)).toBe(true);
    expect(allCustomers.some((customer) => (customer.outstandingBalance ?? 0) < 0)).toBe(true);
    expect(allProducts.some((product) => product.isDisabled)).toBe(true);
    expect(allProducts.some((product) => product.isDeleted)).toBe(true);
    expect(allSaleItems.some((item) => item.productId === null)).toBe(true);
    expect([...allSaleItems, ...allEstimateItems].some((item) => item.quantity % 1000 !== 0)).toBe(
      true
    );
    expect(ledgerTypes).toEqual(new Set(Object.values(LEDGER_ENTRY_TYPE)));

    for (const customer of db.select().from(customers).all()) {
      const ledgerBalance = db
        .select({ value: sql<number>`COALESCE(SUM(amount_due - amount_paid), 0)` })
        .from(customerLedger)
        .where(eq(customerLedger.customerId, customer.id))
        .get()?.value;
      expect(customer.outstandingBalance).toBe(ledgerBalance);
    }

    expect(sqlite.pragma("foreign_key_check")).toEqual([]);
    expect(sqlite.pragma("integrity_check", { simple: true })).toBe("ok");
  });
});
