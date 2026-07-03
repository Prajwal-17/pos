import { and, isNull } from "drizzle-orm";
import { db } from "../../db/db";
import { productHistory } from "../../db/schema";

export const cleanProductHistory = async () => {
  console.log("Starting cleanup of product history with all null prices...");

  try {
    const result = db
      .delete(productHistory)
      .where(
        and(
          isNull(productHistory.oldPrice),
          isNull(productHistory.newPrice),
          isNull(productHistory.oldMrp),
          isNull(productHistory.newMrp),
          isNull(productHistory.oldPurchasePrice),
          isNull(productHistory.newPurchasePrice)
        )
      )
      .run();

    console.log(`Deleted ${result.changes} product history rows with all null prices.`);
  } catch (error) {
    console.error("Error cleaning product history:", error);
  }
};
