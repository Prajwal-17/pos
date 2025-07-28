import path from "node:path";
import fs from "fs"
import { app } from "electron";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema"
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

//getPath returs os specific directory
const dbPath = path.join(app.getPath("userData"), "pos.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true })
console.log("dbpath", dbPath)

const sqlite = new Database(dbPath)
export const db = drizzle(sqlite, { schema, logger: true })

migrate(db, { migrationsFolder: "./drizzle" })
