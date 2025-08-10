import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  password: text("password").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).$onUpdate(() => sql`CURRENT_TIMESTAMP`)
});

export const customers = sqliteTable("customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  contact: text("contact").notNull(),
  customerType: text("customer_type"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).$onUpdate(() => sql`CURRENT_TIMESTAMP`)
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  weight: text("weight"),
  unit: text("unit"),
  mrp: real("mrp"),
  price: real("price").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).$onUpdate(() => sql`CURRENT_TIMESTAMP`)
});

export const productHistory = sqliteTable("product_history", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  weight: text("weight"),
  unit: text("unit"),
  productId: text("product_id")
    .references(() => products.id)
    .notNull(),
  oldPrice: real("old_price"),
  newPrice: real("new_price"),
  old_mrp: real("old_mrp"),
  new_mrp: real("new_mrp"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(CURRENT_TIMESTAMP)`)
});

export const sales = sqliteTable("sales", {
  id: text("id").primaryKey(),
  invoiceNumber: real("invoice_number").unique().notNull(),
  customerId: text("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(),
  grandTotal: real("grandTotal").notNull(),
  totalQuantity: real("total_quantity"),
  isPaid: integer("is_paid", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).$onUpdate(() => sql`CURRENT_TIMESTAMP`)
});

export const saleItems = sqliteTable("sale_items", {
  id: text("id").primaryKey(),
  saleId: text("sale_id")
    .references(() => sales.id)
    .notNull(),
  productId: text("product_id").references(() => products.id),
  name: text("name").notNull(),
  mrp: real("mrp"),
  price: real("price").notNull(),
  weight: text("weight"),
  unit: text("unit"),
  quantity: real("quantity").notNull(),
  totalPrice: real("total_price").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).$onUpdate(() => sql`CURRENT_TIMESTAMP`)
});
