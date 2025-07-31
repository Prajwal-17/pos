import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  password: text("password").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$onUpdate(() => sql`CURRENT_TIMESTAMP`)
});

export const customers = sqliteTable("customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  contact: text("contact").notNull(),
  customerType: text("customer_type").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$onUpdate(() => sql`CURRENT_TIMESTAMP`)
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  quantity: real("quantity").notNull(),
  mrp: real("mrp").notNull(),
  price: real("price").notNull(),
  //unit:text("unit").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$onUpdate(() => sql`CURRENT_TIMESTAMP`)
});

export const productHistory = sqliteTable("product_history", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  quantity: real("quantity"),
  //unit:text("unit").notNull(),
  productId: text("product_id")
    .references(() => products.id)
    .notNull(),
  oldPrice: real("old_price"),
  newPrice: real("new_price"),
  old_mrp: real("old_mrp"),
  new_mrp: real("new_mrp"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => sql`CURRENT_TIMESTAMP`)
});

export const sales = sqliteTable("sales", {
  id: text("id").primaryKey(),
  customerId: text("customer_id")
    .references(() => customers.id)
    .notNull(),
  customerName: text("customer_name").notNull(),
  total: real("total").notNull(),
  totalQuantity: real("total_quantity").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$onUpdate(() => sql`CURRENT_TIMESTAMP`)
});

export const saleItems = sqliteTable("sale_items", {
  id: text("id").primaryKey(),
  saleId: text("sale_id")
    .references(() => sales.id)
    .notNull(),
  productId: text("product_id")
    .references(() => products.id)
    .notNull(),
  name: text("name").notNull(),
  price: real("price").notNull(),
  quantity: real("quantity").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$onUpdate(() => sql`CURRENT_TIMESTAMP`)
});
