import { eq } from "drizzle-orm";
import { db } from "../../db/db";
import { estimateItems, saleItems } from "../../db/schema";

const MILLI_MULTIPLIER = 1000;

export function toMilliUnits(value: number | string): number {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num) || !Number.isFinite(num)) return 0;
  return Math.round(num * MILLI_MULTIPLIER);
}

export const updateCheckedQtyToMilliUnits = async () => {
  console.log("Starting checked quantity (milli-units) update...");

  try {
    // 1. Update Sale Items
    const allSaleItems = db
      .select({
        id: saleItems.id,
        checkedQty: saleItems.checkedQty,
      })
      .from(saleItems)
      .all();

    console.log(`Found ${allSaleItems.length} sale items.`);

    const saleItemsResult = db.transaction((tx) => {
      let count = 0;
      for (const item of allSaleItems) {
        if (item.checkedQty !== null && item.checkedQty !== undefined) {
          const newQty = toMilliUnits(item.checkedQty);
          tx.update(saleItems)
            .set({ checkedQty: newQty })
            .where(eq(saleItems.id, item.id))
            .run();
          count++;
        }
      }
      return count;
    });
    console.log(`Updated ${saleItemsResult} sale items checked quantity to milli-units.`);

    // 2. Update Estimate Items
    const allEstimateItems = db
      .select({
        id: estimateItems.id,
        checkedQty: estimateItems.checkedQty,
      })
      .from(estimateItems)
      .all();

    console.log(`Found ${allEstimateItems.length} estimate items.`);

    const estimateItemsResult = db.transaction((tx) => {
      let count = 0;
      for (const item of allEstimateItems) {
        if (item.checkedQty !== null && item.checkedQty !== undefined) {
          const newQty = toMilliUnits(item.checkedQty);
          tx.update(estimateItems)
            .set({ checkedQty: newQty })
            .where(eq(estimateItems.id, item.id))
            .run();
          count++;
        }
      }
      return count;
    });
    console.log(`Updated ${estimateItemsResult} estimate items checked quantity to milli-units.`);

    console.log("Checked quantity update completed successfully.");
  } catch (error) {
    console.error("Error updating checked quantity:", error);
  }
};
