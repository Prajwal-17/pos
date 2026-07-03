import { eq, sql } from "drizzle-orm";
import { db } from "../../db/db";
import { estimateItems, products, saleItems } from "../../db/schema";

export const updateLastSoldAt = async () => {
  console.log("Starting lastSoldAt update for products...");

  try {
    const allProducts = db.select({ id: products.id }).from(products).all();

    let updated = 0;
    db.transaction((tx) => {
      for (const product of allProducts) {
        const latestSaleItem = tx
          .select({ createdAt: saleItems.createdAt })
          .from(saleItems)
          .where(eq(saleItems.productId, product.id))
          .orderBy(sql`${saleItems.createdAt} DESC`)
          .limit(1)
          .get();

        const latestEstimateItem = tx
          .select({ createdAt: estimateItems.createdAt })
          .from(estimateItems)
          .where(eq(estimateItems.productId, product.id))
          .orderBy(sql`${estimateItems.createdAt} DESC`)
          .limit(1)
          .get();

        let latestDate = null;
        if (latestSaleItem?.createdAt) {
          latestDate = new Date(latestSaleItem.createdAt);
        }
        if (latestEstimateItem?.createdAt) {
          const estimateDate = new Date(latestEstimateItem.createdAt);
          if (!latestDate || estimateDate > latestDate) {
            latestDate = estimateDate;
          }
        }

        if (latestDate) {
          tx.update(products)
            .set({ lastSoldAt: latestDate.toISOString() })
            .where(eq(products.id, product.id))
            .run();
          updated++;
        }
      }
    });

    console.log(`Updated ${updated} products with lastSoldAt.`);
  } catch (error) {
    console.error("Error updating lastSoldAt:", error);
  }
};
