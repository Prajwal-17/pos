import { sql } from "drizzle-orm";
import { sqliteTable } from "drizzle-orm/sqlite-core";
import * as t from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: t.text("id").primaryKey(),
  name: t.text("name").notNull(),
  password: t.text("password").notNull(),
  createdAt: t.int("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: t.int("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
})
