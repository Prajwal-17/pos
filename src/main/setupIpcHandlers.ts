import { ipcMain } from "electron";
import { db } from "./db/db";
import { products } from "./db/schema";
import { like } from "drizzle-orm";
import type { ProductsType } from "./types";

export function setupIpcHandlers() {
  ipcMain.handle("productsApi:getAllProducts", async (): Promise<ProductsType[]> => {
    try {
      const result = await db.select().from(products);
      return result;
    } catch (error) {
      console.log(error);
      return [];
    }
  });

  ipcMain.handle("productsApi:search", async (_event, query: string): Promise<ProductsType[]> => {
    try {
      if (query === "") return [];
      const result = await db
        .select()
        .from(products)
        .where(like(products.name, `%${query}%`));

      return result;
    } catch (error) {
      console.log(error);
      return [];
    }
  });
}
