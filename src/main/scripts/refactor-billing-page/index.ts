import { eq } from "drizzle-orm";
import type { ProductsType } from "../../../shared/types";
import { formatToRupees } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { estimateItems, products, saleItems } from "../../db/schema";

const ignoredWeight = ["", "1ml", "1g", "none", "1pc", "1kg"];

function generateSnapshotName(product: ProductsType) {
  let name = product.name;

  // weight && mrp && weight+unit does not equal to ignoredWeights
  if (
    product.weight !== null &&
    product.unit !== null &&
    product.mrp &&
    !ignoredWeight.some((w) => `${product.weight}${product.unit}` === w)
  ) {
    name += ` ${product.weight}${product.unit}`;
    name += ` ${formatToRupees(product.mrp)}Rs`;
  }

  // weight && mrp && weight+unit equal to ignoredWeights
  if (
    product.weight !== null &&
    product.unit !== null &&
    product.mrp &&
    ignoredWeight.some((w) => `${product.weight}${product.unit}` === w)
  ) {
    if (product.mrp) {
      name += ` ${formatToRupees(product.mrp)}Rs`;
    }
  }

  // weight = null, unit = null && mrp
  if (product.weight === null && product.mrp) {
    name += ` ${formatToRupees(product.mrp)}Rs`;
  }

  // weight && mrp = null
  if (product.weight !== null && product.unit !== null && !product.mrp) {
    name += ` ${product.weight}${product.unit}`;
  }

  return name;
}

export async function updateProductSnapshot() {
  try {
    const existingProducts = db.select().from(products).all();

    const updatedProducts = existingProducts.map((item, index) => {
      return {
        ...item,
        productSnapshot: generateSnapshotName(item)
      };
    });

    const result = db.transaction((tx) => {
      for (const item of updatedProducts) {
        tx.update(products)
          .set({
            // ...item,
            productSnapshot: item.productSnapshot
          })
          .where(eq(products.id, item.id))
          .run();
      }
      return "Updated Products";
    });
    console.log(result);

    // fs.writeFile("./output.json", JSON.stringify(updatedProducts, null, 2), () => {
    //   console.log("done");
    // });

    // FIX: update product names
    const existingSaleItems = db.select().from(saleItems).all();

    const updatedSaleItems = existingSaleItems.map((saleItem, index) => {
      return {
        ...saleItem,
        productSnapshot: generateSnapshotName(saleItem as any)
      };
    });

    const result2 = db.transaction((tx) => {
      for (const saleItem of updatedSaleItems) {
        tx.update(saleItems)
          .set({
            // ...saleItem,
            productSnapshot: saleItem.productSnapshot
          })
          .where(eq(saleItems.id, saleItem.id))
          .run();
      }
      return "Updated sale items";
    });
    console.log(result2);

    // FIX: update product names
    const existingEstimateItems = db.select().from(estimateItems).all();

    const updatedEstimateItems = existingEstimateItems.map((estimateItem, index) => {
      return {
        ...estimateItem,
        productSnapshot: generateSnapshotName(estimateItem as any)
      };
    });

    const result3 = db.transaction((tx) => {
      for (const estimateItem of updatedEstimateItems) {
        tx.update(estimateItems)
          .set({
            productSnapshot: estimateItem.productSnapshot
          })
          .where(eq(estimateItems.id, estimateItem.id))
          .run();
      }
      return "Updated estimate items";
    });
    console.log(result3);
  } catch (error) {
    console.log(error);
  }
}
