import path from "node:path";
import fs from "fs";
import { app } from "electron";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { products } from "./schema";

//getPath returs os specific directory
const dbPath = path.join(app.getPath("userData"), "pos.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
console.log("dbpath", dbPath);

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema, logger: true });

// migrations are applied at startup only if there is a change
const migrationsFolder = app.isPackaged
  ? path.join(process.resourcesPath, "drizzle") // in prod
  : path.join(__dirname, "../../drizzle"); // in dev
console.log("folder", migrationsFolder);
migrate(db, { migrationsFolder });

export async function getAllItems(): Promise<any> {
  try {
    const items = await db.select().from(products);
    return items;
  } catch (error) {
    console.log(error);
  }
}
