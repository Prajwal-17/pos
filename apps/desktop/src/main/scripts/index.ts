import { recalculateTotalQuantitySold } from "./release-v4/recalculateTotalQuantitySold";
import { updateCheckedQtyToMilliUnits } from "./release-v4/updateCheckedQtyToMilliUnits";
import { updateProductSnapshot } from "./release-v4/updateProductSnpashot";
import { updatePurchasePrice } from "./release-v4/updatePurchasePrice";
// import { updateQuantityToMilliUnits } from "./release-v4/updateQuantityToMilliUnits";
// import { updateTotalQuantityToMilliUnits } from "./release-v4/updateTotalQuantityToMilliUnits";

export async function dbScripts() {
  // db scripts for above v4.0.0
  await updateProductSnapshot(); // update product snapshot using product object
  await updatePurchasePrice(); // recalculate purchase price of saleItems & estimateItems and update
  // await updateQuantityToMilliUnits();
  // await updateTotalQuantityToMilliUnits();
  await updateCheckedQtyToMilliUnits();
  await recalculateTotalQuantitySold();
}
