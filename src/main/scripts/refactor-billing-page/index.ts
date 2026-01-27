import { eq } from "drizzle-orm";
import { formatToRupees } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { estimateItems, products, saleItems } from "../../db/schema";

const ignoredWeight = ["", "1ml", "1g", "none", "1pc", "1kg"];

type SnapshotPayload = {
  name: string;
  weight: string | null;
  unit: string | null;
  mrp: number | null;
};

// update name & conver to rs

export const generateProductSnapshot = (item: SnapshotPayload) => {
  let name = item.name;

  // weight && mrp && weight+unit does not equal to ignoredWeights
  if (
    item.weight !== null &&
    item.mrp &&
    !ignoredWeight.some((w) => `${item.weight}${item.unit}` === w)
  ) {
    name += ` ${item.weight}${item.unit}`;
    if (item.mrp) {
      name += ` ${formatToRupees(item.mrp)}Rs`;
    }
  }

  // weight && mrp && weight+unit equal to ignoredWeights
  if (
    item.weight !== null &&
    item.mrp &&
    ignoredWeight.some((w) => `${item.weight}${item.unit}` === w)
  ) {
    if (item.mrp) {
      name += ` ${formatToRupees(item.mrp)} Rs`;
    }
  }

  // weight = null && mrp
  if (item.weight === null && item.mrp) {
    name += ` ${formatToRupees(item.mrp)}Rs`;
  }

  // weight && mrp = null
  if (item.weight !== null && !item.mrp) {
    name += ` ${item.weight}${item.unit}`;
  }

  return name;
};

export async function updateProductSnapshot() {
  try {
    const existingProducts = db.select().from(products).all();

    const updatedProducts = existingProducts.map((item, index) => {
      return {
        ...item,
        productSnapshot: generateProductSnapshot(item)
      };
    });

    const result = db.transaction((tx) => {
      for (const item of updatedProducts) {
        tx.update(products)
          .set({
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

    const updatedSaleItems = await Promise.all(
      existingSaleItems.map(async (saleItem, index) => {
        if (!saleItem.productId) {
          return {
            ...saleItem,
            productSnapshot: saleItem.name
          };
        }

        const product = db.select().from(products).where(eq(products.id, saleItem.productId)).get();

        return {
          ...saleItem,
          name: product?.name,
          productSnapshot: generateProductSnapshot({
            name: product.name,
            weight: saleItem.weight,
            unit: saleItem.unit,
            mrp: saleItem.mrp
          })
        };
      })
    );

    const result2 = db.transaction((tx) => {
      for (const saleItem of updatedSaleItems) {
        tx.update(saleItems)
          .set({
            name: saleItem.name,
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

    const updatedEstimateItems = await Promise.all(
      existingEstimateItems.map((estimateItem, index) => {
        if (!estimateItem.productId) {
          return {
            ...estimateItem,
            productSnapshot: estimateItem.name
          };
        }
        const product = db
          .select()
          .from(products)
          .where(eq(products.id, estimateItem.productId))
          .get();
        return {
          ...estimateItem,
          name: product?.name,
          productSnapshot: generateProductSnapshot({
            name: product.name,
            weight: estimateItem.weight,
            unit: estimateItem.unit,
            mrp: estimateItem.mrp
          })
        };
      })
    );

    const result3 = db.transaction((tx) => {
      for (const estimateItem of updatedEstimateItems) {
        tx.update(estimateItems)
          .set({
            name: estimateItem.name,
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
