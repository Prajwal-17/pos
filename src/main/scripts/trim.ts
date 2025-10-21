import { eq, sql } from "drizzle-orm";
import { db } from "../db/db";
import { customers, estimateItems, products, saleItems } from "../db/schema";

export async function trimProductSpaces() {
  try {
    const result = db
      .update(products)
      .set({
        name: sql`TRIM(${products.name})`
      })
      .run();
    console.log("Trimming product name successfull", result);
  } catch (error) {
    console.log(error);
  }
}

export async function trimCustomerNameSpaces() {
  try {
    const result = db
      .update(customers)
      .set({
        name: sql`TRIM(${customers.name})`
      })
      .run();

    const result2 = db
      .update(customers)
      .set({
        contact: null
      })
      .where(eq(customers.name, "DEFAULT"))
      .run();
    console.log("Trimming customer name successfull", result);
    console.log("Add null value for DEFAULT customer name", result2);
  } catch (error) {
    console.log(error);
  }
}

export async function trimSaleItemsNameSpaces() {
  try {
    const result = db
      .update(saleItems)
      .set({
        name: sql`TRIM(${saleItems.name})`
      })
      .run();
    console.log("Trimming saleItems name successfull", result);
  } catch (error) {
    console.log(error);
  }
}

export async function trimEstimateItemsNameSpaces() {
  try {
    const result = db
      .update(estimateItems)
      .set({
        name: sql`TRIM(${estimateItems.name})`
      })
      .run();
    console.log("Trimming saleItems name successfull", result);
  } catch (error) {
    console.log(error);
  }
}
