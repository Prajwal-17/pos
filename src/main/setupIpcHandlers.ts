import { ipcMain } from "electron";
import { db } from "./db/db";
import { products, saleItems, sales } from "./db/schema";
import { desc, like } from "drizzle-orm";
import type { ApiResponse, ProductsType } from "../shared/types";

export function setupIpcHandlers() {
  ipcMain.handle("productsApi:getAllProducts", async (): Promise<ApiResponse<ProductsType[]>> => {
    try {
      const allProducts = await db.select().from(products);
      return { status: "success", data: allProducts };
    } catch (error) {
      console.log(error);
      return { status: "error", error: { message: "Could not fetch Products" } };
    }
  });

  ipcMain.handle(
    "productsApi:search",
    async (
      _event,
      query: string,
      page: number,
      limit: number
    ): Promise<ApiResponse<ProductsType[]>> => {
      try {
        if (query === "") return { status: "success", data: [] };
        console.log(page, limit);
        const offset = (page - 1) * limit;
        const searchResult = await db
          .select()
          .from(products)
          .where(like(products.name, `%${query}%`))
          .limit(limit)
          .offset(offset);

        return { status: "success", data: searchResult };
      } catch (error) {
        console.log(error);
        return { status: "error", error: { message: "Could not search Products" } };
      }
    }
  );

  ipcMain.handle("billingApi:getNextInvoiceNo", async (): Promise<ApiResponse<number>> => {
    try {
      const lastInvoice = await db.select().from(sales).orderBy(desc(sales.createdAt)).limit(1);
      const lastInvoiceNo = lastInvoice[0]?.invoiceNo;
      let nextInvoiceNo = 1;

      if (lastInvoiceNo) {
        nextInvoiceNo = lastInvoiceNo + 1;
      }

      return { status: "success", data: nextInvoiceNo };
    } catch (error) {
      console.log(error);
      return { status: "error", error: { message: "Failed to retrieve next invoice number" } };
    }
  });

  ipcMain.handle("billingApi:save", async (_event, obj: any): Promise<ApiResponse<string>> => {
    try {
      // for better-sqlite3 inside a transaction asynchronous is not required, only used for standalone queries
      db.transaction((tx) => {
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

      return { status: "success", data: "Sale was saved successfully" };
    } catch (error) {
      console.error("Error in transaction:", error);
      return { status: "error", error: { message: "Error occured while saving." } };
    }
  });
}
