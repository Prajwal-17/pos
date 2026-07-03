import dotenv from "dotenv";
import { initDb } from "../db/db";
import { dbScripts } from "./index";

dotenv.config();

async function run() {
  try {
    await initDb();
    console.log("Database initialized. Running migration scripts...\n");
    await dbScripts();
    console.log("\nAll migration scripts completed.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

run();
