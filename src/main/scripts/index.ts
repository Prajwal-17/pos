// import { fillCSV } from "./fillCSV";
import { fixUtcFormat } from "./fixUtcFormats";
import {
    trimCustomerNameSpaces,
    trimEstimateItemsNameSpaces,
    trimProductSpaces,
    trimSaleItemsNameSpaces
} from "./trim";
import { estimateUnpaid } from "./unpaid";
import {
    updateProductFields,
    updateProductFieldsInEstimates,
    updateProductFieldsInSales
} from "./updateProductFields";
import { updateTotalPriceEstimates, updateTotalPriceSales } from "./updateTotalPrice";

export async function dbScripts() {
  await trimProductSpaces();
  await trimCustomerNameSpaces();
  await trimSaleItemsNameSpaces();
  await trimEstimateItemsNameSpaces();
  // ----------------------------
  await estimateUnpaid();
  // ----------------------------
  await updateTotalPriceEstimates();
  await updateTotalPriceSales();
  // ----------------------------
  await updateProductFields();
  await updateProductFieldsInSales();
  await updateProductFieldsInEstimates();
  // ----------------------------
  await fixUtcFormat();
  // ----------------------------
  // -- deprecated --
  // await fillCSV();
}
