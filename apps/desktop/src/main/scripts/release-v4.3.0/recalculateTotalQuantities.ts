import { eq } from "drizzle-orm";
import { db } from "../../db/db";
import { estimateItems, estimates, saleItems, sales } from "../../db/schema";

export const recalculateTotalQuantities = async () => {
  console.log("Starting recalculation of total quantities for sales and estimates...");

  try {
    const allSales = db.select({ id: sales.id }).from(sales).all();
    const allEstimated = db.select({ id: estimates.id }).from(estimates).all();

    const allSaleItems = db
      .select({ saleId: saleItems.saleId, quantity: saleItems.quantity })
      .from(saleItems)
      .all();

    const allEstimateItems = db
      .select({ estimateId: estimateItems.estimateId, quantity: estimateItems.quantity })
      .from(estimateItems)
      .all();

    const saleTotalQtyMap = new Map<string, number>();
    for (const item of allSaleItems) {
      const current = saleTotalQtyMap.get(item.saleId) || 0;
      saleTotalQtyMap.set(item.saleId, current + item.quantity);
    }

    const estimateTotalQtyMap = new Map<string, number>();
    for (const item of allEstimateItems) {
      const current = estimateTotalQtyMap.get(item.estimateId) || 0;
      estimateTotalQtyMap.set(item.estimateId, current + item.quantity);
    }

    let salesUpdated = 0;
    db.transaction((tx) => {
      for (const sale of allSales) {
        const calculated = saleTotalQtyMap.get(sale.id) || 0;
        tx.update(sales)
          .set({ totalQuantity: calculated })
          .where(eq(sales.id, sale.id))
          .run();
        salesUpdated++;
      }
    });
    console.log(`Updated ${salesUpdated} sales total quantities.`);

    let estimatesUpdated = 0;
    db.transaction((tx) => {
      for (const estimate of allEstimated) {
        const calculated = estimateTotalQtyMap.get(estimate.id) || 0;
        tx.update(estimates)
          .set({ totalQuantity: calculated })
          .where(eq(estimates.id, estimate.id))
          .run();
        estimatesUpdated++;
      }
    });
    console.log(`Updated ${estimatesUpdated} estimates total quantities.`);

    console.log("Total quantities recalculation completed successfully.");
  } catch (error) {
    console.error("Error recalculating total quantities:", error);
  }
};
