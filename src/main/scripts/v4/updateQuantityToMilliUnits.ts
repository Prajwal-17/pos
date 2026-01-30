import { eq } from "drizzle-orm";
import { db } from "../../db/db";
import { estimateItems, saleItems } from "../../db/schema";

const MILLI_MULTIPLIER = 1000;

export function toMilliUnits(value: number | string): number {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num) || !Number.isFinite(num)) return 0;
  return Math.round(num * MILLI_MULTIPLIER);
}

export const updateQuantityToMilliUnits = async () => {
  console.log("Starting quantity (milli-units) update...");

  try {
    // 1. Update Sale Items
    const allSaleItems = db
      .select({
        id: saleItems.id,
        quantity: saleItems.quantity
      })
      .from(saleItems)
      .all();

    console.log(`Found ${allSaleItems.length} sale items.`);

    const saleItemsResult = db.transaction((tx) => {
      let count = 0;
      for (const item of allSaleItems) {
        if (item.quantity !== null && item.quantity !== undefined) {
          const newQty = toMilliUnits(item.quantity);
          tx.update(saleItems)
            .set({ quantity: newQty })
            .where(eq(saleItems.id, item.id))
            .run();
          count++;
        }
      }
      return count;
    });
    console.log(`Updated ${saleItemsResult} sale items to milli-units.`);

    // 2. Update Estimate Items
    const allEstimateItems = db
      .select({
        id: estimateItems.id,
        quantity: estimateItems.quantity
      })
      .from(estimateItems)
      .all();

    console.log(`Found ${allEstimateItems.length} estimate items.`);

    const estimateItemsResult = db.transaction((tx) => {
      let count = 0;
      for (const item of allEstimateItems) {
        if (item.quantity !== null && item.quantity !== undefined) {
          const newQty = toMilliUnits(item.quantity);
          tx.update(estimateItems)
            .set({ quantity: newQty })
            .where(eq(estimateItems.id, item.id))
            .run();
          count++;
        }
      }
      return count;
    });
    console.log(`Updated ${estimateItemsResult} estimate items to milli-units.`);

    console.log("Quantity update completed successfully.");
  } catch (error) {
    console.error("Error updating quantity:", error);
  }
};
