import { ipcMain } from "electron";
import { db } from "./db/db";
import { products, sales } from "./db/schema";
import { desc, like } from "drizzle-orm";
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

  ipcMain.handle("billingApi:getNextInvoiceNo", async (): Promise<number | null> => {
    try {
      const lastInvoice = await db.select().from(sales).orderBy(desc(sales.createdAt)).limit(1);
      const lastInvoiceNo = lastInvoice[0]?.invoiceNumber;
      let nextInvoiceNo = 1;

      if (lastInvoiceNo) {
        nextInvoiceNo = lastInvoiceNo + 1;
      }

      return nextInvoiceNo;
    } catch (error) {
      console.log(error);
      return null;
    }
  });

  ipcMain.handle("billingApi:save", async (_event, obj: any): Promise<any> => {
    try {
      console.log("obj", obj);
      return "done";
    } catch (error) {
      console.log(error);
    }
  });
}
