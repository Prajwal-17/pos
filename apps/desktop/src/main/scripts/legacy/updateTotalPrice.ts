import { sql } from "drizzle-orm";
import { db } from "../db/db";
import { estimateItems, saleItems } from "../db/schema";

export async function updateTotalPriceEstimates() {
  try {
    const EPSILON = 0.01;

    const result = db
      .select({
        id: estimateItems.id,
        total_price: estimateItems.totalPrice
      })
      .from(estimateItems)
      .where(
        sql`ABS(${estimateItems.totalPrice} - ROUND(${estimateItems.totalPrice})) > ${EPSILON}`
      )
      // .limit(40)
      .all();
    const result2 = db
      .update(estimateItems)
      .set({
        totalPrice: sql`${estimateItems.totalPrice} * 100`
      })
      .where(
        sql`ABS(${estimateItems.totalPrice} - ROUND(${estimateItems.totalPrice})) > ${EPSILON}`
      )
      .run();
    console.log("Estimate items have total price in decimals", result);
    console.log("Fix total price estimates", result2);
  } catch (error) {
    console.log(error);
  }
}

export async function updateTotalPriceSales() {
  try {
    const EPSILON = 0.01;

    const result = db
      .select({
        id: saleItems.id,
        total_price: saleItems.totalPrice
      })
      .from(saleItems)
      .where(sql`ABS(${saleItems.totalPrice} - ROUND(${saleItems.totalPrice})) > ${EPSILON}`)
      // .limit(40)
      .all();
    const result2 = db
      .update(saleItems)
      .set({
        totalPrice: sql`${saleItems.totalPrice} * 100`
      })
      .where(sql`ABS(${saleItems.totalPrice} - ROUND(${saleItems.totalPrice})) > ${EPSILON}`)
      .run();
    console.log("Sale items have total price in decimals", result);
    console.log("Fix total price sales", result2);
  } catch (error) {
    console.log(error);
  }
}
