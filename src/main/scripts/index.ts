// import { fillCSV } from "./fillCSV";
// import { calculateTotalQuantityofProducts } from "./calculateTotalQuantityofProducts";
// import { fixUtcFormat } from "./fixUtcFormats";
// import {
//     trimCustomerNameSpaces,
//     trimEstimateItemsNameSpaces,
//     trimProductSpaces,
//     trimSaleItemsNameSpaces
// } from "./trim";
// import { estimateUnpaid } from "./unpaid";
// import {
//     updateProductFields,
//     updateProductFieldsInEstimates,
//     updateProductFieldsInSales
// } from "./updateProductFields";
// import { updateTotalPriceEstimates, updateTotalPriceSales } from "./updateTotalPrice";
// import { updateProductHistory } from "./productHistory";
import { updateProductSnapshot } from "./v4";
import { updatePurchasePrice } from "./v4/updatePurchasePrice";

export async function dbScripts() {
  // db scripts for above v4.0.0
  await updateProductSnapshot();
  await updatePurchasePrice();
  //
  // -- Used Scripts --
  // await trimProductSpaces();
  // await trimCustomerNameSpaces();
  // await trimSaleItemsNameSpaces();
  // await trimEstimateItemsNameSpaces();
  // // ----------------------------
  // await estimateUnpaid();
  // // ----------------------------
  // await updateTotalPriceEstimates();
  // await updateTotalPriceSales();
  // // ----------------------------
  // await updateProductFields();
  // await updateProductFieldsInSales();
  // await updateProductFieldsInEstimates();
  // // ----------------------------
  // await fixUtcFormat();
  // // ----------------------------
  // await calculateTotalQuantityofProducts();
  // // ----------------------------
  // await updateProductHistory();
  // -- deprecated --
  // await fillCSV();
}
