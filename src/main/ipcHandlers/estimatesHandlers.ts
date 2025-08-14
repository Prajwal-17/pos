import { ipcMain } from "electron/main";
import type { ApiResponse, EstimatePayload, EstimateType } from "../../shared/types";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/db";
import { estimateItems, estimates } from "../db/schema";

export function estimatesHandlers() {
  ipcMain.handle("estimatesApi:getNextEstimateNo", async (): Promise<ApiResponse<number>> => {
    try {
      const lastEstimate = await db
        .select()
        .from(estimates)
        .orderBy(desc(estimates.createdAt))
        .limit(1);
      const lastEstimateNo = lastEstimate[0].estimateNo;
      let nextEstimateNo = 1;

      if (lastEstimateNo) {
        nextEstimateNo = lastEstimateNo + 1;
      }

      return { status: "success", data: nextEstimateNo };
    } catch (error) {
      console.log(error);
      return { status: "error", error: { message: "Failed to retrieve next invoice number" } };
    }
  });

  ipcMain.handle("estimatesApi:getAllEstimates", async (): Promise<ApiResponse<EstimateType[]>> => {
    try {
      const estimatesArray = await db.select().from(estimates).orderBy(desc(estimates.createdAt));

      return { status: "success", data: estimatesArray };
    } catch (error) {
      console.log(error);
      return { status: "error", error: { message: "Failed to retrieve sales" } };
    }
  });

  ipcMain.handle(
    "estimatesApi:save",
    async (_event, estimateObj: EstimatePayload): Promise<ApiResponse<string>> => {
      try {
        // for better-sqlite3 inside a transaction asynchronous is not required, only used for standalone queries
        db.transaction((tx) => {
          const estimateNo = tx
            .select()
            .from(estimates)
            .where(eq(estimates.estimateNo, Number(estimateObj.invoiceNo)))
            .get();
          if (estimateNo) {
            throw new Error("EstimateExits");
          }
          const estimate = tx
            .insert(estimates)
            .values({
              estimateNo: Number(estimateObj.invoiceNo),
              customerName: "DEFAULT",
              grandTotal: estimateObj.grandTotal,
              isPaid: true
            })
            .returning({ id: estimates.id })
            .get();

          if (!estimate || !estimate.id) {
            throw new Error("Failed to create estimate record.");
          }

          for (const item of estimateObj.items) {
            if (item.name === "") return;
            tx.insert(estimateItems)
              .values({
                saleId: estimate.id,
                name: item.name,
                price: item.price,
                mrp: item.mrp || null,
                quantity: item.quantity,
                totalPrice: item.totalPrice
              })
              .run();
          }
        });

        return { status: "success", data: "Estimate was saved successfully" };
      } catch (error) {
        if (error instanceof Error && error.message === "EstimateExits") {
          return { status: "error", error: { message: "Estimate already exists" } };
        }
        console.error("Error in transaction:", error);
        return { status: "error", error: { message: "Error occured while saving." } };
      }
    }
  );
}
