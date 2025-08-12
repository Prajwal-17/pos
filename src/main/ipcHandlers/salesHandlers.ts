import { ipcMain } from "electron/main";
import type { ApiResponse, SalePayload } from "../../shared/types";
import { db } from "../db/db";
import { saleItems, sales } from "../db/schema";
import { desc, eq } from "drizzle-orm";

export function salesHandlers() {
  ipcMain.handle("salesApi:getNextInvoiceNo", async (): Promise<ApiResponse<number>> => {
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
    "salesApi:save",
    async (_event, saleObj: SalePayload): Promise<ApiResponse<string>> => {
      try {
        // for better-sqlite3 inside a transaction asynchronous is not required, only used for standalone queries
        db.transaction((tx) => {
          const invoiceNo = tx
            .select()
            .from(sales)
            .where(eq(sales.invoiceNo, Number(saleObj.invoiceNo)))
            .get();
          if (invoiceNo) {
            throw new Error("SaleExists");
          }
          const sale = tx
            .insert(sales)
            .values({
              invoiceNo: Number(saleObj.invoiceNo),
              customerName: "DEFAULT",
              grandTotal: saleObj.grandTotal,
              isPaid: true
            })
            .returning({ id: sales.id })
            .get();

          if (!sale || !sale.id) {
            throw new Error("Failed to create sale record.");
          }

          for (const item of saleObj.items) {
            if (item.name === "") return;
            tx.insert(saleItems)
              .values({
                saleId: sale.id,
                name: item.name,
                price: item.price,
                mrp: item.mrp,
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
