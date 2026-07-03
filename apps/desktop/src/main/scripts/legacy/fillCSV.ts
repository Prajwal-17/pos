import csv from "csv-parser";
import fs from "node:fs";
import { db } from "../db/db";
import { products } from "../db/schema";

const readable = fs.createReadStream("/home/prajwal/Downloads/csv/products.csv", {
  encoding: "utf-8"
});

export async function fillCSV() {
  try {
    const result = await readable.pipe(csv()).forEach(async (product) => {
      db.insert(products)
        .values({
          id: product?.id,
          name: product.name,
          weight: product.weight ? product.weight : null,
          unit: product.unit ? product.unit : null,
          mrp: product.mrp ? product.mrp : null,
          price: product.price,
          purchasePrice: product.purchase_price ? product.purchase_price : null,
          totalQuantitySold: product.total_quantity_sold,
          isDisabled: product.disabled_at ? true : false,
          disabledAt: product.disabled_at ? product.disabled_at : null,
          isDeleted: product.delete ? true : false,
          deletedAt: product.deleted_at ? product.deleted_at : null,
          createdAt: product.created_at,
          updatedAt: product.updated_at
        })
        .run();
    });

    console.log("result", result);
  } catch (error) {
    console.log(error);
  }
}
