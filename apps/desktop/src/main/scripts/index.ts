import { cleanProductHistory } from "./release-v4.3.0/cleanProductHistory";
import { recalculateGrandTotals } from "./release-v4.3.0/recalculateGrandTotals";
import { recalculateTotalQuantities } from "./release-v4.3.0/recalculateTotalQuantities";
import { recalculateTotalQuantitySold } from "./release-v4.3.0/recalculateTotalQuantitySold";
import { seedAppInstanceAndStoreProfile } from "./release-v4.3.0/seedAppInstanceAndStoreProfile";
import { setupTables } from "./release-v4.3.0/setupTables";
import { updateLastSoldAt } from "./release-v4.3.0/updateLastSoldAt";
import { updateProductSnapshot } from "./release-v4.3.0/updateProductSnpashot";
// import { updatePurchasePrice } from "./release-v4.3.0/updatePurchasePrice";
import { updateStoreId } from "./release-v4.3.0/updateStoreId";

export async function dbScripts() {
  // db scripts for above v4.3.0
  setupTables(); // create new tables & columns before running data migrations
  await seedAppInstanceAndStoreProfile(); // seed app_instance & store_profile
  await updateStoreId(); // populate storeId FK in customers, products, sales, estimates
  await updateProductSnapshot(); // recalculate product snapshot in products table
  // await updatePurchasePrice(); // recalculate purchase price of saleItems & estimateItems
  await recalculateTotalQuantitySold(); // recalculate products.totalQuantitySold
  await recalculateTotalQuantities(); // recalculate sales/estimates totalQuantity
  await recalculateGrandTotals(); // recalculate sales/estimates grandTotal
  await updateLastSoldAt(); // set products.lastSoldAt from sale/estimate items
  await cleanProductHistory(); // delete product_history rows where all prices are null
}
