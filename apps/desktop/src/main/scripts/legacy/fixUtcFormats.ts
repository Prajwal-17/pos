import { sql } from "drizzle-orm";
import { db } from "../db/db";
import { customers, estimateItems, estimates, products, saleItems, sales } from "../db/schema";

export async function fixUtcFormat() {
  try {
    const productsResult = await db
      .update(products)
      .set({
        deletedAt: sql`STRFTIME('%Y-%m-%dT%H:%M:%S.000Z', ${products.deletedAt})`,
        disabledAt: sql`STRFTIME('%Y-%m-%dT%H:%M:%S.000Z', ${products.disabledAt})`,
        createdAt: sql`STRFTIME('%Y-%m-%dT%H:%M:%S.000Z', ${products.createdAt})`,
        updatedAt: sql`STRFTIME('%Y-%m-%dT%H:%M:%S.000Z', ${products.updatedAt})`
      })
      .prepare()
      .execute();

    const customersResult = await db
      .update(customers)
      .set({
        createdAt: sql`STRFTIME('%Y-%m-%dT%H:%M:%S.000Z', ${customers.createdAt})`,
        updatedAt: sql`STRFTIME('%Y-%m-%dT%H:%M:%S.000Z', ${customers.updatedAt})`
      })
      .prepare()
      .execute();

    const salesResult = await db
      .update(sales)
      .set({
        createdAt: sql`STRFTIME('%Y-%m-%dT%H:%M:%S.000Z', ${sales.createdAt})`,
        updatedAt: sql`STRFTIME('%Y-%m-%dT%H:%M:%S.000Z', ${sales.updatedAt})`
      })
      .prepare()
      .execute();

    const estimatesResult = await db
      .update(estimates)
      .set({
        createdAt: sql`STRFTIME('%Y-%m-%dT%H:%M:%S.000Z', ${estimates.createdAt})`,
        updatedAt: sql`STRFTIME('%Y-%m-%dT%H:%M:%S.000Z', ${estimates.updatedAt})`
      })
      .prepare()
      .execute();

    const saleItemsResult = await db
      .update(saleItems)
      .set({
        createdAt: sql`STRFTIME('%Y-%m-%dT%H:%M:%S.000Z', ${saleItems.createdAt})`,
        updatedAt: sql`STRFTIME('%Y-%m-%dT%H:%M:%S.000Z', ${saleItems.updatedAt})`
      })
      .prepare()
      .execute();

    const estimateItemsResult = await db
      .update(estimateItems)
      .set({
        createdAt: sql`STRFTIME('%Y-%m-%dT%H:%M:%S.000Z', ${estimateItems.createdAt})`,
        updatedAt: sql`STRFTIME('%Y-%m-%dT%H:%M:%S.000Z', ${estimateItems.updatedAt})`
      })
      .prepare()
      .execute();

    console.log("productsResult:", productsResult);
    console.log("customersResult:", customersResult);
    console.log("salesResult:", salesResult);
    console.log("estimatesResult:", estimatesResult);
    console.log("saleItemsResult:", saleItemsResult);
    console.log("estimateItemsResult:", estimateItemsResult);
  } catch (error) {
    console.log(error);
  }
}
