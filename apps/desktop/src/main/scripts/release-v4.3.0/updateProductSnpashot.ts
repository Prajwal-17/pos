import { eq } from "drizzle-orm";
import { generateProductSnapshot } from "../../../shared/utils/productSnapshot";
import { paisaToRupees } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { products } from "../../db/schema";

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
  } catch (error) {
    console.log(error);
  }
}
