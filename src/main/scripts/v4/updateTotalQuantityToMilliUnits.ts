import { eq } from "drizzle-orm";
import { db } from "../../db/db";
import { estimates, sales } from "../../db/schema";

const MILLI_MULTIPLIER = 1000;

export function toMilliUnits(value: number | string): number {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num) || !Number.isFinite(num)) return 0;
  return Math.round(num * MILLI_MULTIPLIER);
}

export const updateTotalQuantityToMilliUnits = async () => {
  console.log("Starting total quantity (milli-units) update for sales and estimates...");

  try {
    // 1. Update Sales
    const allSales = db
      .select({
        id: sales.id,
        totalQuantity: sales.totalQuantity,
      })
      .from(sales)
      .all();

    console.log(`Found ${allSales.length} sales.`);

    const salesResult = db.transaction((tx) => {
      let count = 0;
      for (const sale of allSales) {
        if (sale.totalQuantity !== null && sale.totalQuantity !== undefined) {
          const newQty = toMilliUnits(sale.totalQuantity);
          tx.update(sales)
            .set({ totalQuantity: newQty })
            .where(eq(sales.id, sale.id))
            .run();
          count++;
        }
      }
      return count;
    });
    console.log(`Updated ${salesResult} sales total quantity to milli-units.`);

    // 2. Update Estimates
    const allEstimates = db
      .select({
        id: estimates.id,
        totalQuantity: estimates.totalQuantity,
      })
      .from(estimates)
      .all();

    console.log(`Found ${allEstimates.length} estimates.`);

    const estimatesResult = db.transaction((tx) => {
      let count = 0;
      for (const estimate of allEstimates) {
        if (estimate.totalQuantity !== null && estimate.totalQuantity !== undefined) {
          const newQty = toMilliUnits(estimate.totalQuantity);
          tx.update(estimates)
            .set({ totalQuantity: newQty })
            .where(eq(estimates.id, estimate.id))
            .run();
          count++;
        }
      }
      return count;
    });
    console.log(`Updated ${estimatesResult} estimates total quantity to milli-units.`);

    console.log("Total quantity update completed successfully.");
  } catch (error) {
    console.error("Error updating total quantity:", error);
  }
};
