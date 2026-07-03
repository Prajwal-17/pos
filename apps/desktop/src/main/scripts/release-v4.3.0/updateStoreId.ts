import { isNull } from "drizzle-orm";
import { db } from "../../db/db";
import { customers, estimates, products, sales, storeProfile } from "../../db/schema";

export const updateStoreId = async () => {
  console.log("Starting storeId update for existing records...");

  try {
    const store = db.select({ id: storeProfile.id }).from(storeProfile).get();
    if (!store) {
      console.log("No store profile found, skipping storeId update.");
      return;
    }

    const storeId = store.id;

    const customerResult = db
      .update(customers)
      .set({ storeId })
      .where(isNull(customers.storeId))
      .run();
    console.log(`Updated ${customerResult.changes} customers with storeId.`);

    const productResult = db
      .update(products)
      .set({ storeId })
      .where(isNull(products.storeId))
      .run();
    console.log(`Updated ${productResult.changes} products with storeId.`);

    const salesResult = db
      .update(sales)
      .set({ storeId })
      .where(isNull(sales.storeId))
      .run();
    console.log(`Updated ${salesResult.changes} sales with storeId.`);

    const estimatesResult = db
      .update(estimates)
      .set({ storeId })
      .where(isNull(estimates.storeId))
      .run();
    console.log(`Updated ${estimatesResult.changes} estimates with storeId.`);

    console.log("StoreId update completed successfully.");
  } catch (error) {
    console.error("Error updating storeId:", error);
  }
};
