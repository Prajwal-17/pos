import { eq, sql, sum } from "drizzle-orm";
import { db } from "../db/db";
import { estimateItems, products, saleItems } from "../db/schema";

export async function calculateTotalQuantityofProducts() {
  try {
    const transaction = db.transaction((tx) => {
      const saleResults = tx
        .select({
          productId: saleItems.productId,
          quantityAgg: sum(saleItems.quantity).mapWith(Number)
        })
        .from(saleItems)
        .groupBy(saleItems.productId)
        .all();

      const estimateResults = tx
        .select({
          productId: estimateItems.productId,
          quantityAgg: sum(estimateItems.quantity).mapWith(Number)
        })
        .from(estimateItems)
        .groupBy(estimateItems.productId)
        .all();

      for (const sale of saleResults) {
        // ignore null id
        if (sale.productId) {
          tx.update(products)
            .set({ totalQuantitySold: sale.quantityAgg })
            .where(eq(products.id, sale.productId))
            .run();
        }
      }

      for (const est of estimateResults) {
        // ignore null id
        if (est.productId) {
          tx.update(products)
            .set({
              totalQuantitySold: sql`${products.totalQuantitySold} + ${est.quantityAgg}`
            })
            .where(eq(products.id, est.productId))
            .run();
        }
      }
      console.log("✅ Total quantities updated successfully");
    });
    console.log(transaction);
  } catch (error) {
    console.log(error);
  }
}
