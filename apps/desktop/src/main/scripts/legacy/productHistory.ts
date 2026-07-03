import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db/db";
import { productHistory, products } from "../db/schema";

export async function updateProductHistory() {
  try {
    // remove
    const removePrice = db
      .update(productHistory)
      .set({
        oldPrice: null,
        newPrice: null
      })
      .where(eq(productHistory.oldPrice, productHistory.newPrice))
      .returning({
        id: productHistory.id,
        name: productHistory.name
      })
      .run();

    const removeMrp = db
      .update(productHistory)
      .set({
        oldMrp: null,
        newMrp: null
      })
      .where(eq(productHistory.oldMrp, productHistory.newMrp))
      .returning({
        id: productHistory.id,
        name: productHistory.name
      })
      .run();

    const removePurchasePrice = db
      .update(productHistory)
      .set({
        oldPurchasePrice: null,
        newPurchasePrice: null
      })
      .where(eq(productHistory.oldPurchasePrice, productHistory.newPurchasePrice))
      .returning({
        id: productHistory.id,
        name: productHistory.name
      })
      .run();
    console.log("remove price", removePrice);
    console.log("remove mrp", removeMrp);
    console.log("remove removePurchasePrice", removePurchasePrice);

    // delete row
    const rowDeleteResult = db
      .delete(productHistory)
      .where(
        and(
          isNull(productHistory.oldPrice),
          isNull(productHistory.newPrice),
          isNull(productHistory.oldMrp),
          isNull(productHistory.newMrp),
          isNull(productHistory.oldPurchasePrice),
          isNull(productHistory.newPurchasePrice)
        )
      )
      .returning({ id: productHistory.id, name: productHistory.name })
      .run();
    console.log("row delete", rowDeleteResult);

    // initial values
    db.transaction((tx) => {
      const productsToSeed = tx
        .select({
          productId: products.id,
          name: products.name,
          weight: products.weight,
          unit: products.unit,
          price: products.price,
          mrp: products.mrp,
          purchasePrice: products.purchasePrice
        })
        .from(products)
        .leftJoin(productHistory, eq(products.id, productHistory.productId))
        .where(isNull(productHistory.id))
        .all();

      if (productsToSeed.length === 0) {
        console.log("No new products found requiring initial history records.");
        return;
      }

      console.log(`Found ${productsToSeed.length} products to seed history for.`);

      const historyRecords = productsToSeed.map((product) => ({
        productId: product.productId,
        name: product.name,
        weight: product.weight,
        unit: product.unit,
        oldPrice: null,
        newPrice: product.price,
        oldMrp: null,
        newMrp: product.mrp,
        oldPurchasePrice: null,
        newPurchasePrice: product.purchasePrice
      }));

      tx.insert(productHistory).values(historyRecords).run();

      console.log(`Successfully inserted ${historyRecords.length} initial history records.`);
    });

    console.log("Product history seeding complete.");
  } catch (error) {
    console.log(error);
  }
}
