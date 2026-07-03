import { eq } from "drizzle-orm";
import { generateProductSnapshot } from "../../../shared/utils/productSnapshot";
import { paisaToRupees } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { estimateItems, products, saleItems } from "../../db/schema";

export async function updateProductSnapshot() {
  try {
    const existingProducts = db.select().from(products).all();

    const updatedProducts = existingProducts.map((item) => {
      return {
        ...item,
        productSnapshot: generateProductSnapshot({
          name: item.name,
          weight: item.weight,
          unit: item.unit,
          mrp: item.mrp ? paisaToRupees(item.mrp) : null
        })
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
      existingSaleItems.map(async (saleItem) => {
        if (!saleItem.productId) {
          return {
            ...saleItem,
            productSnapshot: saleItem.productSnapshot
          };
        }

        const product = db.select().from(products).where(eq(products.id, saleItem.productId)).get();
        const productName = product?.name || saleItem.name || "";

        return {
          ...saleItem,
          name: productName,
          productSnapshot: generateProductSnapshot({
            name: productName,
            weight: saleItem.weight,
            unit: saleItem.unit,
            mrp: saleItem.mrp ? paisaToRupees(saleItem.mrp) : null
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
      existingEstimateItems.map((estimateItem) => {
        if (!estimateItem.productId) {
          return {
            ...estimateItem,
            productSnapshot: estimateItem.productSnapshot
          };
        }
        const product = db
          .select()
          .from(products)
          .where(eq(products.id, estimateItem.productId))
          .get();
        const productName = product?.name || estimateItem.name || "";

        return {
          ...estimateItem,
          name: productName,
          productSnapshot: generateProductSnapshot({
            name: productName,
            weight: estimateItem.weight,
            unit: estimateItem.unit,
            mrp: estimateItem.mrp ? paisaToRupees(estimateItem.mrp) : null
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
