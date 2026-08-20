import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { LEDGER_ENTRY_TYPE, PAYMENT_MODE } from "../../shared/types";
import { generateProductSnapshot } from "../../shared/utils/productSnapshot";
import { paisaToRupees } from "../../shared/utils/utils";
import { CustomerRole } from "../db/enum";
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
  sales,
  storeProfile
} from "../db/schema";
import type * as schema from "../db/schema";
import { getDefaultConfig } from "../modules/preferences/preferences.defaults";

export type TestDataScale = "small" | "standard" | "large";

export type TestDataCounts = {
  customers: number;
  products: number;
  sales: number;
  estimates: number;
};

export type TestDataOptions = TestDataCounts & {
  seed: number;
  asOf: Date;
};

export type TestDataSummary = TestDataCounts & {
  saleItems: number;
  estimateItems: number;
  ledgerEntries: number;
  productHistory: number;
};

type SeedDatabase = BetterSQLite3Database<typeof schema>;
type ProductRow = typeof products.$inferSelect;
type CustomerRow = typeof customers.$inferSelect;

export const TEST_DATA_SCALES: Record<TestDataScale, TestDataCounts> = {
  small: { customers: 12, products: 30, sales: 36, estimates: 15 },
  standard: { customers: 48, products: 160, sales: 320, estimates: 120 },
  large: { customers: 150, products: 800, sales: 3000, estimates: 900 }
};

const STORE_ID = "default";
const QUANTITIES = [250, 500, 750, 1000, 1500, 2000, 3000, 5000, 10000];
const WEIGHTS = [
  { weight: "100", unit: "g" },
  { weight: "250", unit: "g" },
  { weight: "500", unit: "g" },
  { weight: "1", unit: "kg" },
  { weight: "200", unit: "ml" },
  { weight: "500", unit: "ml" },
  { weight: "1", unit: "L" },
  { weight: "1", unit: "pc" }
];

const fixedCustomers: Array<{
  name: string;
  customerType: CustomerRole;
  notes?: string;
}> = [
  { name: "DEFAULT", customerType: CustomerRole.CASH, notes: "Walk-in billing customer" },
  { name: "Aarav Stores", customerType: CustomerRole.ACCOUNT },
  { name: "Sunrise Hotel", customerType: CustomerRole.HOTEL },
  { name: "Meera Mart", customerType: CustomerRole.ACCOUNT },
  { name: "Green Cafe", customerType: CustomerRole.HOTEL },
  {
    name: "Ravi Traders",
    customerType: CustomerRole.ACCOUNT
  },
  { name: "Advance Customer", customerType: CustomerRole.ACCOUNT },
  { name: "Archived Shop", customerType: CustomerRole.ACCOUNT }
];

const fixedProducts: Array<{
  name: string;
  weight: string | null;
  unit: string | null;
  mrp: number;
  price: number;
  purchasePrice: number;
  isDisabled?: boolean;
  isDeleted?: boolean;
}> = [
  { name: "Amul Milk", weight: "1", unit: "L", mrp: 7200, price: 6800, purchasePrice: 6100 },
  {
    name: "Basmati Rice",
    weight: "5",
    unit: "kg",
    mrp: 109900,
    price: 97900,
    purchasePrice: 81500
  },
  {
    name: "Parle-G Biscuits",
    weight: "800",
    unit: "g",
    mrp: 9000,
    price: 8500,
    purchasePrice: 6900
  },
  {
    name: "Coriander",
    weight: null,
    unit: null,
    mrp: 4000,
    price: 3600,
    purchasePrice: 2400
  },
  {
    name: "Cooking Oil",
    weight: "1",
    unit: "L",
    mrp: 18900,
    price: 17600,
    purchasePrice: 15100,
    isDisabled: true
  },
  {
    name: "Gift Box",
    weight: "1",
    unit: "pc",
    mrp: 129900,
    price: 99900,
    purchasePrice: 76000,
    isDeleted: true
  },
  {
    name: "Saffron",
    weight: "1",
    unit: "g",
    mrp: 499900,
    price: 449900,
    purchasePrice: 375000
  },
  {
    name: "Shopping Bag",
    weight: "1",
    unit: "pc",
    mrp: 2500,
    price: 2000,
    purchasePrice: 1100
  }
];

function assertOptions(options: TestDataOptions): void {
  if (!Number.isInteger(options.seed)) throw new Error("Test-data seed must be an integer.");
  if (Number.isNaN(options.asOf.getTime())) throw new Error("Test-data as-of date is invalid.");

  for (const [label, value] of Object.entries({
    customers: options.customers,
    products: options.products,
    sales: options.sales,
    estimates: options.estimates
  })) {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`Test-data ${label} count must be a non-negative integer.`);
    }
  }

  if (options.customers < fixedCustomers.length) {
    throw new Error(`Test data requires at least ${fixedCustomers.length} customers.`);
  }
  if (options.products < fixedProducts.length) {
    throw new Error(`Test data requires at least ${fixedProducts.length} products.`);
  }
}

function randomTimestamp(asOf: Date, daysBack: number): string {
  const from = new Date(asOf);
  from.setUTCDate(from.getUTCDate() - daysBack);
  return faker.date.between({ from, to: asOf }).toISOString();
}

function recentTimestamp(asOf: Date, index: number): string {
  const date = new Date(asOf);
  date.setUTCHours(12, index % 60, 0, 0);
  date.setUTCDate(date.getUTCDate() - (index % 7));
  return date.toISOString();
}

function uniqueName(prefix: string, index: number): string {
  return `${prefix} ${String(index + 1).padStart(3, "0")}`;
}

function createCustomers(db: SeedDatabase, options: TestDataOptions): CustomerRow[] {
  const rows: Array<typeof customers.$inferInsert> = [];

  for (let index = 0; index < options.customers; index += 1) {
    const fixed = fixedCustomers[index];
    const isArchived = index === fixedCustomers.length - 1;
    const createdAt = randomTimestamp(options.asOf, 720);
    const customerType =
      fixed?.customerType ??
      faker.helpers.weightedArrayElement([
        { value: CustomerRole.CASH, weight: 5 },
        { value: CustomerRole.ACCOUNT, weight: 3 },
        { value: CustomerRole.HOTEL, weight: 2 }
      ]);

    rows.push({
      id: faker.string.uuid(),
      storeId: STORE_ID,
      name: fixed?.name ?? uniqueName(faker.person.firstName(), index),
      contact: index % 9 === 0 ? null : `9${faker.string.numeric(9)}`,
      customerType,
      notes: fixed?.notes ?? (index % 7 === 0 ? faker.lorem.sentence() : null),
      address:
        index % 6 === 0 ? null : `${faker.location.streetAddress()}, ${faker.location.city()}`,
      outstandingBalance: 0,
      isArchived,
      archivedAt: isArchived ? randomTimestamp(options.asOf, 45) : null,
      createdAt,
      updatedAt: createdAt
    });
  }

  db.insert(customers).values(rows).run();
  return db.select().from(customers).all();
}

function createProducts(db: SeedDatabase, options: TestDataOptions): ProductRow[] {
  const rows: Array<typeof products.$inferInsert> = [];

  for (let index = 0; index < options.products; index += 1) {
    const fixed = fixedProducts[index];
    const packageSize = fixed ?? faker.helpers.arrayElement(WEIGHTS);
    const mrp = fixed?.mrp ?? faker.number.int({ min: 1500, max: 250000 });
    const price =
      fixed?.price ??
      Math.round(mrp * faker.number.float({ min: 0.75, max: 0.98, fractionDigits: 2 }));
    const purchasePrice =
      fixed?.purchasePrice ??
      Math.round(price * faker.number.float({ min: 0.58, max: 0.88, fractionDigits: 2 }));
    const name =
      fixed?.name ??
      uniqueName(
        faker.helpers.arrayElement([
          "Rice",
          "Sugar",
          "Salt",
          "Flour",
          "Tea",
          "Coffee",
          "Milk",
          "Bread",
          "Biscuits",
          "Soap",
          "Shampoo",
          "Juice",
          "Noodles",
          "Spices",
          "Dal",
          "Oil"
        ]),
        index
      );
    const createdAt = randomTimestamp(options.asOf, 900);
    const productSnapshot = generateProductSnapshot({
      name,
      weight: packageSize.weight,
      unit: packageSize.unit,
      mrp: paisaToRupees(mrp)
    });

    rows.push({
      id: faker.string.uuid(),
      storeId: STORE_ID,
      name,
      imageUrl: null,
      productSnapshot,
      weight: packageSize.weight,
      unit: packageSize.unit,
      mrp,
      price,
      purchasePrice,
      totalQuantitySold: 0,
      isDisabled: fixed?.isDisabled ?? false,
      disabledAt: fixed?.isDisabled ? randomTimestamp(options.asOf, 20) : null,
      isDeleted: fixed?.isDeleted ?? false,
      deletedAt: fixed?.isDeleted ? randomTimestamp(options.asOf, 120) : null,
      lastSoldAt: null,
      createdAt,
      updatedAt: createdAt
    });
  }

  db.insert(products).values(rows).run();
  return db.select().from(products).all();
}

function createProductHistory(
  db: SeedDatabase,
  productRows: ProductRow[],
  options: TestDataOptions
): number {
  let count = 0;

  for (const [index, product] of productRows.entries()) {
    if (index % 4 !== 0) continue;
    const changes = index % 12 === 0 ? 2 : 1;

    for (let change = changes; change > 0; change -= 1) {
      const oldPrice = Math.max(100, product.price - (change + 1) * 250);
      const newPrice = Math.max(100, product.price - change * 250);
      const createdAt = randomTimestamp(options.asOf, 500);
      db.insert(productHistory)
        .values({
          id: faker.string.uuid(),
          productId: product.id,
          name: product.name,
          weight: product.weight,
          unit: product.unit,
          oldPrice,
          newPrice,
          oldMrp: product.mrp === null ? null : Math.max(100, product.mrp - (change + 1) * 250),
          newMrp: product.mrp === null ? null : Math.max(100, product.mrp - change * 250),
          oldPurchasePrice:
            product.purchasePrice === null
              ? null
              : Math.max(100, product.purchasePrice - (change + 1) * 150),
          newPurchasePrice:
            product.purchasePrice === null
              ? null
              : Math.max(100, product.purchasePrice - change * 150),
          createdAt,
          updatedAt: createdAt
        })
        .run();
      count += 1;
    }
  }

  return count;
}

function transactionProducts(productRows: ProductRow[]): ProductRow[] {
  return productRows.filter((product) => !product.isDeleted || product.name === "Gift Box");
}

function createSales(
  db: SeedDatabase,
  customerRows: CustomerRow[],
  productRows: ProductRow[],
  options: TestDataOptions,
  quantityByProduct: Map<string, number>,
  lastActivityByProduct: Map<string, string>,
  balanceByCustomer: Map<string, number>
): { items: number; ledgerEntries: number } {
  const billableCustomers = customerRows.filter((customer) => !customer.isArchived);
  const accountingCustomers = billableCustomers.filter(
    (customer) => customer.customerType !== CustomerRole.CASH
  );
  const availableProducts = transactionProducts(productRows);
  let itemCount = 0;
  let ledgerCount = 0;

  for (let index = 0; index < options.sales; index += 1) {
    const customer = accountingCustomers[index] ?? faker.helpers.arrayElement(billableCustomers);
    const createdAt =
      index < 14 ? recentTimestamp(options.asOf, index) : randomTimestamp(options.asOf, 540);
    const saleId = faker.string.uuid();
    const lineCount = index === 0 ? 8 : faker.number.int({ min: 1, max: 5 });
    let grandTotal = 0;
    let totalQuantity = 0;

    db.insert(sales)
      .values({
        id: saleId,
        storeId: STORE_ID,
        invoiceNo: 1001 + index,
        customerId: customer.id,
        grandTotal: 0,
        totalQuantity: 0,
        notes: index % 11 === 0 ? faker.lorem.sentence() : null,
        recordedAt: createdAt,
        createdAt,
        updatedAt: createdAt
      })
      .run();

    for (let position = 0; position < lineCount; position += 1) {
      const customItem = (index + position) % 17 === 0;
      const product = customItem ? null : faker.helpers.arrayElement(availableProducts);
      const quantity = faker.helpers.arrayElement(QUANTITIES);
      const price = product?.price ?? faker.number.int({ min: 1200, max: 85000 });
      const totalPrice = Math.round((price * quantity) / 1000);
      const name = product?.name ?? `Custom Counter Item ${index + 1}-${position + 1}`;
      const weight = product?.weight ?? null;
      const unit = product?.unit ?? null;
      const mrp = product?.mrp ?? Math.round(price * 1.1);
      const snapshot =
        product?.productSnapshot ??
        generateProductSnapshot({ name, weight, unit, mrp: paisaToRupees(mrp) });

      db.insert(saleItems)
        .values({
          id: faker.string.uuid(),
          saleId,
          productId: product?.id ?? null,
          name,
          productSnapshot: snapshot,
          mrp,
          price,
          purchasePrice: product?.purchasePrice ?? Math.round(price * 0.7),
          weight,
          unit,
          quantity,
          totalPrice,
          checkedQty: Math.floor(quantity / 1000),
          position,
          createdAt,
          updatedAt: createdAt
        })
        .run();

      if (product) {
        quantityByProduct.set(product.id, (quantityByProduct.get(product.id) ?? 0) + quantity);
        const previous = lastActivityByProduct.get(product.id);
        if (!previous || createdAt > previous) lastActivityByProduct.set(product.id, createdAt);
      }
      grandTotal += totalPrice;
      totalQuantity += quantity;
      itemCount += 1;
    }

    db.update(sales).set({ grandTotal, totalQuantity }).where(eq(sales.id, saleId)).run();

    const addToAccounting =
      customer.customerType !== CustomerRole.CASH &&
      (index < accountingCustomers.length || index % 3 === 0);
    if (addToAccounting && grandTotal > 0) {
      db.insert(customerLedger)
        .values({
          id: faker.string.uuid(),
          customerId: customer.id,
          storeId: STORE_ID,
          type: LEDGER_ENTRY_TYPE.SALE,
          saleId,
          amountDue: grandTotal,
          amountPaid: 0,
          notes: `Invoice #${1001 + index}`,
          createdAt,
          updatedAt: createdAt
        })
        .run();
      balanceByCustomer.set(customer.id, (balanceByCustomer.get(customer.id) ?? 0) + grandTotal);
      ledgerCount += 1;
    }
  }

  return { items: itemCount, ledgerEntries: ledgerCount };
}

function createEstimates(
  db: SeedDatabase,
  customerRows: CustomerRow[],
  productRows: ProductRow[],
  options: TestDataOptions,
  quantityByProduct: Map<string, number>,
  lastActivityByProduct: Map<string, string>
): number {
  const billableCustomers = customerRows.filter((customer) => !customer.isArchived);
  const availableProducts = transactionProducts(productRows);
  let itemCount = 0;

  for (let index = 0; index < options.estimates; index += 1) {
    const customer = faker.helpers.arrayElement(billableCustomers);
    const createdAt =
      index < 7 ? recentTimestamp(options.asOf, index) : randomTimestamp(options.asOf, 540);
    const estimateId = faker.string.uuid();
    const lineCount = index === 0 ? 7 : faker.number.int({ min: 1, max: 5 });
    let grandTotal = 0;
    let totalQuantity = 0;

    db.insert(estimates)
      .values({
        id: estimateId,
        storeId: STORE_ID,
        estimateNo: 5001 + index,
        customerId: customer.id,
        grandTotal: 0,
        totalQuantity: 0,
        notes: index % 9 === 0 ? "Quotation valid for seven days" : null,
        createdAt,
        updatedAt: createdAt
      })
      .run();

    for (let position = 0; position < lineCount; position += 1) {
      const customItem = (index + position) % 13 === 0;
      const product = customItem ? null : faker.helpers.arrayElement(availableProducts);
      const quantity = faker.helpers.arrayElement(QUANTITIES);
      const price = product?.price ?? faker.number.int({ min: 1500, max: 120000 });
      const totalPrice = Math.round((price * quantity) / 1000);
      const name = product?.name ?? `Special Order Item ${index + 1}-${position + 1}`;
      const weight = product?.weight ?? null;
      const unit = product?.unit ?? null;
      const mrp = product?.mrp ?? Math.round(price * 1.12);
      const snapshot =
        product?.productSnapshot ??
        generateProductSnapshot({ name, weight, unit, mrp: paisaToRupees(mrp) });

      db.insert(estimateItems)
        .values({
          id: faker.string.uuid(),
          estimateId,
          productId: product?.id ?? null,
          name,
          productSnapshot: snapshot,
          mrp,
          price,
          purchasePrice: product?.purchasePrice ?? Math.round(price * 0.7),
          weight,
          unit,
          quantity,
          totalPrice,
          checkedQty: Math.floor(quantity / 1000),
          position,
          createdAt,
          updatedAt: createdAt
        })
        .run();

      if (product) {
        quantityByProduct.set(product.id, (quantityByProduct.get(product.id) ?? 0) + quantity);
        const previous = lastActivityByProduct.get(product.id);
        if (!previous || createdAt > previous) lastActivityByProduct.set(product.id, createdAt);
      }
      grandTotal += totalPrice;
      totalQuantity += quantity;
      itemCount += 1;
    }

    db.update(estimates)
      .set({ grandTotal, totalQuantity })
      .where(eq(estimates.id, estimateId))
      .run();
  }

  return itemCount;
}

function createManualLedgerEntries(
  db: SeedDatabase,
  customerRows: CustomerRow[],
  options: TestDataOptions,
  balanceByCustomer: Map<string, number>
): number {
  const accountingCustomers = customerRows.filter(
    (customer) => customer.customerType !== CustomerRole.CASH && !customer.isArchived
  );
  let count = 0;

  for (const [index, customer] of accountingCustomers.entries()) {
    const opening = index < 4 ? (index + 1) * 12500 : 0;
    if (opening > 0) {
      const createdAt = randomTimestamp(options.asOf, 700);
      db.insert(customerLedger)
        .values({
          id: faker.string.uuid(),
          customerId: customer.id,
          storeId: STORE_ID,
          type: LEDGER_ENTRY_TYPE.OPENING_BALANCE,
          amountDue: opening,
          amountPaid: 0,
          notes: "Opening balance imported from previous ledger",
          createdAt,
          updatedAt: createdAt
        })
        .run();
      balanceByCustomer.set(customer.id, (balanceByCustomer.get(customer.id) ?? 0) + opening);
      count += 1;
    }

    if (index % 2 === 0) {
      const quickSale = faker.number.int({ min: 2500, max: 45000 });
      const createdAt = randomTimestamp(options.asOf, 150);
      db.insert(customerLedger)
        .values({
          id: faker.string.uuid(),
          customerId: customer.id,
          storeId: STORE_ID,
          type: LEDGER_ENTRY_TYPE.QUICK_SALE,
          amountDue: quickSale,
          amountPaid: 0,
          notes: "Unbilled counter purchase",
          createdAt,
          updatedAt: createdAt
        })
        .run();
      balanceByCustomer.set(customer.id, (balanceByCustomer.get(customer.id) ?? 0) + quickSale);
      count += 1;
    }

    const currentBalance = balanceByCustomer.get(customer.id) ?? 0;
    if (currentBalance > 0) {
      const payment =
        index === 5
          ? currentBalance + 25000
          : Math.max(
              100,
              Math.round(
                currentBalance * faker.number.float({ min: 0.2, max: 0.9, fractionDigits: 2 })
              )
            );
      const createdAt = recentTimestamp(options.asOf, index + 1);
      db.insert(customerLedger)
        .values({
          id: faker.string.uuid(),
          customerId: customer.id,
          storeId: STORE_ID,
          type: LEDGER_ENTRY_TYPE.PAYMENT,
          amountDue: 0,
          amountPaid: payment,
          paymentMode: faker.helpers.arrayElement(Object.values(PAYMENT_MODE)),
          notes: index % 3 === 0 ? "Part payment received" : null,
          createdAt,
          updatedAt: createdAt
        })
        .run();
      balanceByCustomer.set(customer.id, currentBalance - payment);
      count += 1;
    }

    if (index % 4 === 0) {
      const adjustment = 500;
      const decreasesBalance = index % 8 === 0;
      const createdAt = recentTimestamp(options.asOf, index + 2);
      db.insert(customerLedger)
        .values({
          id: faker.string.uuid(),
          customerId: customer.id,
          storeId: STORE_ID,
          type: LEDGER_ENTRY_TYPE.ADJUSTMENT,
          amountDue: decreasesBalance ? 0 : adjustment,
          amountPaid: decreasesBalance ? adjustment : 0,
          notes: decreasesBalance ? "Rounding discount" : "Delivery charge correction",
          createdAt,
          updatedAt: createdAt
        })
        .run();
      balanceByCustomer.set(
        customer.id,
        (balanceByCustomer.get(customer.id) ?? 0) + (decreasesBalance ? -adjustment : adjustment)
      );
      count += 1;
    }
  }

  return count;
}

function updateAggregateCaches(
  db: SeedDatabase,
  productRows: ProductRow[],
  customerRows: CustomerRow[],
  quantityByProduct: Map<string, number>,
  lastActivityByProduct: Map<string, string>,
  balanceByCustomer: Map<string, number>
): void {
  for (const product of productRows) {
    db.update(products)
      .set({
        totalQuantitySold: quantityByProduct.get(product.id) ?? 0,
        lastSoldAt: lastActivityByProduct.get(product.id) ?? null
      })
      .where(eq(products.id, product.id))
      .run();
  }

  for (const customer of customerRows) {
    db.update(customers)
      .set({ outstandingBalance: balanceByCustomer.get(customer.id) ?? 0 })
      .where(eq(customers.id, customer.id))
      .run();
  }
}

export function seedTestData(db: SeedDatabase, options: TestDataOptions): TestDataSummary {
  assertOptions(options);
  faker.seed(options.seed);

  return db.transaction((tx) => {
    const installedAt = new Date(options.asOf);
    installedAt.setUTCDate(installedAt.getUTCDate() - 900);

    tx.insert(appInstance)
      .values({
        id: STORE_ID,
        os: process.platform,
        installedAt: installedAt.toISOString(),
        createdAt: installedAt.toISOString(),
        updatedAt: installedAt.toISOString()
      })
      .run();
    tx.insert(storeProfile)
      .values({
        id: STORE_ID,
        storeName: "QuickCart Test Supermarket",
        ownerName: "Test Store Owner",
        phone: "9876543210",
        email: "test-store@example.com",
        addressLine1: "42 Market Road",
        addressLine2: "Near Central Bus Stand",
        country: "India",
        state: "Karnataka",
        pincode: "560001",
        city: "Bengaluru",
        gstin: "29ABCDE1234F1Z5",
        createdAt: installedAt.toISOString(),
        updatedAt: options.asOf.toISOString()
      })
      .run();

    const customerRows = createCustomers(tx, options);
    const productRows = createProducts(tx, options);
    const defaultCustomer = customerRows.find((customer) => customer.name === "DEFAULT")!;
    const config = getDefaultConfig();
    config.billing.defaultCustomerId = defaultCustomer.id;
    tx.insert(appPreferences)
      .values({
        id: faker.string.uuid(),
        storeId: STORE_ID,
        config,
        createdAt: installedAt.toISOString(),
        updatedAt: options.asOf.toISOString()
      })
      .run();

    const historyCount = createProductHistory(tx, productRows, options);
    const quantityByProduct = new Map<string, number>();
    const lastActivityByProduct = new Map<string, string>();
    const balanceByCustomer = new Map<string, number>();
    const saleResult = createSales(
      tx,
      customerRows,
      productRows,
      options,
      quantityByProduct,
      lastActivityByProduct,
      balanceByCustomer
    );
    const estimateItemCount = createEstimates(
      tx,
      customerRows,
      productRows,
      options,
      quantityByProduct,
      lastActivityByProduct
    );
    const manualLedgerCount = createManualLedgerEntries(
      tx,
      customerRows,
      options,
      balanceByCustomer
    );
    updateAggregateCaches(
      tx,
      productRows,
      customerRows,
      quantityByProduct,
      lastActivityByProduct,
      balanceByCustomer
    );

    return {
      customers: options.customers,
      products: options.products,
      sales: options.sales,
      estimates: options.estimates,
      saleItems: saleResult.items,
      estimateItems: estimateItemCount,
      ledgerEntries: saleResult.ledgerEntries + manualLedgerCount,
      productHistory: historyCount
    };
  });
}
