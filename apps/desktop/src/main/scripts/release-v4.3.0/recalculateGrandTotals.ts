import { eq } from "drizzle-orm";
import { db } from "../../db/db";
import { estimateItems, estimates, saleItems, sales } from "../../db/schema";

export const recalculateGrandTotals = async () => {
  console.log("Starting recalculation of grand totals for sales and estimates...");

  try {
    const allSales = db.select({ id: sales.id }).from(sales).all();
    const allEstimated = db.select({ id: estimates.id }).from(estimates).all();

    const allSaleItems = db
      .select({ saleId: saleItems.saleId, totalPrice: saleItems.totalPrice })
      .from(saleItems)
      .all();

    const allEstimateItems = db
      .select({ estimateId: estimateItems.estimateId, totalPrice: estimateItems.totalPrice })
      .from(estimateItems)
      .all();

    const saleGrandTotalMap = new Map<string, number>();
    for (const item of allSaleItems) {
      const current = saleGrandTotalMap.get(item.saleId) || 0;
      saleGrandTotalMap.set(item.saleId, current + item.totalPrice);
    }

    const estimateGrandTotalMap = new Map<string, number>();
    for (const item of allEstimateItems) {
      const current = estimateGrandTotalMap.get(item.estimateId) || 0;
      estimateGrandTotalMap.set(item.estimateId, current + item.totalPrice);
    }

    let salesUpdated = 0;
    db.transaction((tx) => {
      for (const sale of allSales) {
        const calculated = saleGrandTotalMap.get(sale.id) || 0;
        tx.update(sales)
          .set({ grandTotal: calculated })
          .where(eq(sales.id, sale.id))
          .run();
        salesUpdated++;
      }
    });
    console.log(`Updated ${salesUpdated} sales grand totals.`);

    let estimatesUpdated = 0;
    db.transaction((tx) => {
      for (const estimate of allEstimated) {
        const calculated = estimateGrandTotalMap.get(estimate.id) || 0;
        tx.update(estimates)
          .set({ grandTotal: calculated })
          .where(eq(estimates.id, estimate.id))
          .run();
        estimatesUpdated++;
      }
    });
    console.log(`Updated ${estimatesUpdated} estimates grand totals.`);

    console.log("Grand totals recalculation completed successfully.");
  } catch (error) {
    console.error("Error recalculating grand totals:", error);
  }
};
