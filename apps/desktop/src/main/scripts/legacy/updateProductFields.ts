import { eq, isNull, or, sql } from "drizzle-orm";
import { db } from "../db/db";
import { estimateItems, products, saleItems } from "../db/schema";

export async function updateProductFields() {
  try {
    // 1️⃣ Set weight = null if empty
    const result1 = db
      .update(products)
      .set({ weight: null })
      .where(or(eq(products.weight, ""), isNull(products.weight)))
      .run();
    console.log("Updated empty weights to null", result1);

    // 2️⃣ Set mrp = null if empty or 0
    const result2 = db
      .update(products)
      .set({ mrp: null })
      .where(or(eq(products.mrp, 0), isNull(products.mrp)))
      .run();
    console.log("Updated zero/empty MRP to null", result2);

    // 3️⃣ Set unit = null if empty
    const result3 = db
      .update(products)
      .set({ unit: null })
      .where(or(eq(products.unit, ""), isNull(products.unit)))
      .run();
    console.log("Updated empty units to null", result3);

    // 4️⃣ Set unit = 'pc' if weight is present and unit is null or empty
    // const result4 = db
    //   .update(products)
    //   .set({ unit: "pc" })
    //   .where(
    //     sql`${products.weight} IS NOT NULL
    //      AND ${products.weight} != ''
    //      AND (${products.unit} IS NULL OR ${products.unit} = '')`
    //   )
    //   .run();
    // console.log("Set unit to 'pc' for items with weight", result4);
  } catch (error) {
    console.log(error);
  }
}

export async function updateProductFieldsInSales() {
  try {
    // 1️⃣ Set weight = null if empty
    const result1 = db
      .update(saleItems)
      .set({ weight: null })
      .where(or(eq(saleItems.weight, ""), isNull(saleItems.weight)))
      .run();
    console.log("Updated empty weights to null", result1);

    // 2️⃣ Set mrp = null if empty or 0
    const result2 = db
      .update(saleItems)
      .set({ mrp: null })
      .where(or(eq(saleItems.mrp, 0), isNull(saleItems.mrp)))
      .run();
    console.log("Updated zero/empty MRP to null", result2);

    // 3️⃣ Set unit = null if empty
    const result3 = db
      .update(saleItems)
      .set({ unit: null })
      .where(or(eq(saleItems.unit, ""), isNull(saleItems.unit)))
      .run();
    console.log("Updated empty units to null", result3);

    // 4️⃣ Set unit = 'pc' if weight is present and unit is null or empty
    const result4 = db
      .update(saleItems)
      .set({ unit: "pc" })
      .where(
        sql`${saleItems.weight} IS NOT NULL 
         AND ${saleItems.weight} != '' 
         AND (${saleItems.unit} IS NULL OR ${saleItems.unit} = '')`
      )
      .run();
    console.log("Set unit to 'pc' for items with weight", result4);
  } catch (error) {
    console.log(error);
  }
}

export async function updateProductFieldsInEstimates() {
  try {
    // 1️⃣ Set weight = null if empty
    const result1 = db
      .update(estimateItems)
      .set({ weight: null })
      .where(or(eq(estimateItems.weight, ""), isNull(estimateItems.weight)))
      .run();
    console.log("Updated empty weights to null", result1);

    // 2️⃣ Set mrp = null if empty or 0
    const result2 = db
      .update(estimateItems)
      .set({ mrp: null })
      .where(or(eq(estimateItems.mrp, 0), isNull(estimateItems.mrp)))
      .run();
    console.log("Updated zero/empty MRP to null", result2);

    // 3️⃣ Set unit = null if empty
    const result3 = db
      .update(estimateItems)
      .set({ unit: null })
      .where(or(eq(estimateItems.unit, ""), isNull(estimateItems.unit)))
      .run();
    console.log("Updated empty units to null", result3);

    // 4️⃣ Set unit = 'pc' if weight is present and unit is null or empty
    // const result4 = db
    //   .update(estimateItems)
    //   .set({ unit: "pc" })
    //   .where(
    //     sql`${estimateItems.weight} IS NOT NULL
    //      AND ${estimateItems.weight} != ''
    //      AND (${estimateItems.unit} IS NULL OR ${estimateItems.unit} = '')`
    //   )
    //   .run();
    // console.log("Set unit to 'pc' for items with weight", result4);
  } catch (error) {
    console.log(error);
  }
}
