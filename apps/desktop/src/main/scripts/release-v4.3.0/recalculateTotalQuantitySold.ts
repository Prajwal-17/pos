import { eq, isNotNull } from "drizzle-orm";
import { db } from "../../db/db";
import { estimateItems, products, saleItems } from "../../db/schema";

export const recalculateTotalQuantitySold = async () => {
  console.log("Starting recalculation of total quantity sold for products...");

  try {
    // 1. Fetch all products
    const allProducts = db.select().from(products).all();
    console.log(`Found ${allProducts.length} products.`);

    // 2. Fetch all sale items
    const allSaleItems = db
      .select({
        productId: saleItems.productId,
        quantity: saleItems.quantity
      })
      .from(saleItems)
      .where(isNotNull(saleItems.productId))
      .all();

    // 3. Fetch all estimate items
    const allEstimateItems = db
      .select({
        productId: estimateItems.productId,
        quantity: estimateItems.quantity
      })
      .from(estimateItems)
      .where(isNotNull(estimateItems.productId))
      .all();

    // 4. Calculate total sold per product
    const productSoldMap = new Map<string, number>();

    // Helper to add quantity to map
    const addToMap = (productId: string | null, quantity: number) => {
      if (!productId) return;
      const current = productSoldMap.get(productId) || 0;
      productSoldMap.set(productId, current + quantity);
    };

    allSaleItems.forEach((item) => addToMap(item.productId, item.quantity));
    allEstimateItems.forEach((item) => addToMap(item.productId, item.quantity));

    // 5. Update products if mismatched
    let updateCount = 0;

    db.transaction((tx) => {
      for (const product of allProducts) {
        const calculatedTotal = productSoldMap.get(product.id) || 0;
        const currentTotal = product.totalQuantitySold || 0;

        if (calculatedTotal !== currentTotal) {
          // console.log(
          //   `Product '${product.name}' (ID: ${product.id}): Mismatch! Old: ${currentTotal}, New: ${calculatedTotal}. Updating...`
          // );

          tx.update(products)
            .set({ totalQuantitySold: calculatedTotal })
            .where(eq(products.id, product.id))
            .run();

          updateCount++;
        }
      }
    });

    console.log(`Recalculation completed. Updated ${updateCount} products.`);
  } catch (error) {
    console.error("Error recalculating total quantity sold:", error);
  }
};
