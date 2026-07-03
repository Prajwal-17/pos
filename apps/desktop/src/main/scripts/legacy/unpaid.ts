import { db } from "../db/db";
import { estimates } from "../db/schema";

export async function estimateUnpaid() {
  try {
    const result = db
      .update(estimates)
      .set({
        isPaid: false
      })
      .run();
    console.log("All estimates updated to unpaid", result);
  } catch (error) {
    console.log(error);
  }
}
