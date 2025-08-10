import { ipcMain } from "electron";
import { db } from "./db/db";
import { products, saleItems, sales } from "./db/schema";
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
      const lastInvoiceNo = lastInvoice[0]?.invoiceNo;
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
      // for better-sqlite3 inside a transaction asynchronous is not required, only used for standalone queries
      db.transaction(async (tx) => {
        const sale = tx
          .insert(sales)
          .values({
            invoiceNo: Number(obj.invoiceNo),
            customerName: "DEFAULT",
            grandTotal: obj.grandTotal,
            isPaid: true
          })
          .returning({ id: sales.id })
          .get();

        if (!sale || !sale.id) {
          throw new Error("Failed to create sale record.");
        }

        for (const item of obj.items) {
          tx.insert(saleItems)
            .values({
              saleId: sale.id,
              name: item.name,
              // mrp:item.mrp ?? 24,
              price: item.price ?? 34,
              quantity: item.quantity ?? 34,
              totalPrice: item.totalPrice ?? 23
            })
            .run();
        }
      });

      return "success";
    } catch (error) {
      console.error("Error in transaction:", error);
      throw error;
    }
  });
}
