import { eq, isNotNull } from "drizzle-orm";
import { db } from "../../db/db";
import { estimateItems, products, saleItems } from "../../db/schema";

export const updatePurchasePrice = async () => {
  console.log("Starting purchase price update...");

  try {
    // 1. Update Sale Items
    const saleItemsToUpdate = db
      .select({
        id: saleItems.id,
        productId: saleItems.productId
      })
      .from(saleItems)
      .where(isNotNull(saleItems.purchasePrice))
      .all();

    console.log(`Found ${saleItemsToUpdate.length} sale items with purchase price.`);

    let saleItemsUpdated = 0;
    for (const item of saleItemsToUpdate) {
      if (item.productId) {
        const product = db
          .select({ purchasePrice: products.purchasePrice })
          .from(products)
          .where(eq(products.id, item.productId))
          .get();

        if (product && product.purchasePrice !== null) {
          db.update(saleItems)
            .set({ purchasePrice: product.purchasePrice })
            .where(eq(saleItems.id, item.id))
            .run();
          saleItemsUpdated++;
        }
      }
    }
    console.log(`Successfully updated ${saleItemsUpdated} sale items.`);

    // 2. Update Estimate Items
    const estimateItemsToUpdate = db
      .select({
        id: estimateItems.id,
        productId: estimateItems.productId
      })
      .from(estimateItems)
      .where(isNotNull(estimateItems.purchasePrice))
      .all();

    console.log(`Found ${estimateItemsToUpdate.length} estimate items with purchase price.`);

    let estimateItemsUpdated = 0;
    for (const item of estimateItemsToUpdate) {
      if (item.productId) {
        const product = db
          .select({ purchasePrice: products.purchasePrice })
          .from(products)
          .where(eq(products.id, item.productId))
          .get();

        if (product && product.purchasePrice !== null) {
          db.update(estimateItems)
            .set({ purchasePrice: product.purchasePrice })
            .where(eq(estimateItems.id, item.id))
            .run();
          estimateItemsUpdated++;
        }
      }
    }
    console.log(`Successfully updated ${estimateItemsUpdated} estimate items.`);

    console.log("Purchase price update completed successfully.");
  } catch (error) {
    console.error("Error updating purchase prices:", error);
  }
};
