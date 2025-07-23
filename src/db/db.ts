import { drizzle } from "drizzle-orm/better-sqlite3"
import * as schema from "./schema.ts"
import Database from "better-sqlite3"
import path from "node:path"

const dbPath = path.join(__dirname, "..", "..", "sqlite.db")

const sqlite = new Database(dbPath)

export const db = drizzle(sqlite, { schema, logger: true })


