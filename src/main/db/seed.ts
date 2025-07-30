import { db } from "./db";
import { seed } from "drizzle-seed";
import { users } from "./schema";

export async function main() {
  try {
    await seed(db as any, { users });
    console.log("Seeding completed!");
  } catch (error) {
    console.error("Seed my error:", error);
  }
}
