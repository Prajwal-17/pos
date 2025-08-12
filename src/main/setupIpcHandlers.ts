import { ipcMain } from "electron";
import { db } from "./db/db";
import { products, saleItems, sales } from "./db/schema";
import { desc, eq, like } from "drizzle-orm";
import type { ApiResponse, ProductsType, SalePayload } from "../shared/types";

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

  ipcMain.handle(
    "billingApi:save",
    async (_event, billObj: SalePayload): Promise<ApiResponse<string>> => {
      try {
        // for better-sqlite3 inside a transaction asynchronous is not required, only used for standalone queries
        db.transaction((tx) => {
          const invoiceNo = tx
            .select()
            .from(sales)
            .where(eq(sales.invoiceNo, Number(billObj.invoiceNo)))
            .get();
          if (invoiceNo) {
            throw new Error("SaleExists");
          }
          const sale = tx
            .insert(sales)
            .values({
              invoiceNo: Number(billObj.invoiceNo),
              customerName: "DEFAULT",
              grandTotal: billObj.grandTotal,
              isPaid: true
            })
            .returning({ id: sales.id })
            .get();

          if (!sale || !sale.id) {
            throw new Error("Failed to create sale record.");
          }

          for (const item of billObj.items) {
            if (item.name === "") return;
            tx.insert(saleItems)
              .values({
                saleId: sale.id,
                name: item.name,
                price: item.price,
                mrp: item.mrp || null,
                quantity: item.quantity,
                totalPrice: item.totalPrice
              })
              .run();
          }
        });

        return { status: "success", data: "Sale was saved successfully" };
      } catch (error) {
        if (error instanceof Error && error.message === "SaleExists") {
          return { status: "error", error: { message: "Sale already exists" } };
        }
        console.error("Error in transaction:", error);
        return { status: "error", error: { message: "Error occured while saving." } };
      }
    }
  );
}
