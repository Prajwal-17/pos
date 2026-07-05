import { db } from "../../db/db";

function columnExists(table: string, column: string): boolean {
  const sqlite = (db as any).$client;
  const columns = sqlite.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return columns.some((c) => c.name === column);
}

function tableExists(table: string): boolean {
  const sqlite = (db as any).$client;
  const result = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .get(table);
  return !!result;
}

export const setupTables = () => {
  console.log("Setting up new tables and columns for v4.3.0 migration...");

  const sqlite = (db as any).$client;

  // 1. Create app_instance table
  if (!tableExists("app_instance")) {
    sqlite.exec(`
      CREATE TABLE app_instance (
        id TEXT PRIMARY KEY,
        os TEXT,
        installed_at TEXT,
        created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))
      )
    `);
    console.log("Created table: app_instance");
  } else {
    console.log("Table already exists: app_instance");
  }

  // 2. Create store_profile table
  if (!tableExists("store_profile")) {
    sqlite.exec(`
      CREATE TABLE store_profile (
        id TEXT PRIMARY KEY,
        store_name TEXT NOT NULL,
        owner_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        address_line1 TEXT NOT NULL,
        address_line2 TEXT,
        country TEXT NOT NULL,
        state TEXT NOT NULL,
        pincode TEXT NOT NULL,
        city TEXT NOT NULL,
        gstin TEXT,
        created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))
      )
    `);
    console.log("Created table: store_profile");
  } else {
    console.log("Table already exists: store_profile");
  }

  // 3. Create app_preferences table
  if (!tableExists("app_preferences")) {
    sqlite.exec(`
      CREATE TABLE app_preferences (
        id TEXT PRIMARY KEY,
        store_id TEXT REFERENCES store_profile(id),
        config TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))
      )
    `);
    console.log("Created table: app_preferences");
  } else {
    console.log("Table already exists: app_preferences");
  }

  // 4. Add store_id column to customers
  if (!columnExists("customers", "store_id")) {
    sqlite.exec("ALTER TABLE customers ADD COLUMN store_id TEXT REFERENCES store_profile(id) ON DELETE CASCADE");
    console.log("Added column: customers.store_id");
  } else {
    console.log("Column already exists: customers.store_id");
  }

  // 5. Add store_id column to products
  if (!columnExists("products", "store_id")) {
    sqlite.exec("ALTER TABLE products ADD COLUMN store_id TEXT REFERENCES store_profile(id) ON DELETE CASCADE");
    console.log("Added column: products.store_id");
  } else {
    console.log("Column already exists: products.store_id");
  }

  // 6. Add image_url column to products
  if (!columnExists("products", "image_url")) {
    sqlite.exec("ALTER TABLE products ADD COLUMN image_url TEXT");
    console.log("Added column: products.image_url");
  } else {
    console.log("Column already exists: products.image_url");
  }

  // 7. Add last_sold_at column to products
  if (!columnExists("products", "last_sold_at")) {
    sqlite.exec("ALTER TABLE products ADD COLUMN last_sold_at TEXT");
    console.log("Added column: products.last_sold_at");
  } else {
    console.log("Column already exists: products.last_sold_at");
  }

  // 8. Add store_id column to sales
  if (!columnExists("sales", "store_id")) {
    sqlite.exec("ALTER TABLE sales ADD COLUMN store_id TEXT REFERENCES store_profile(id) ON DELETE CASCADE");
    console.log("Added column: sales.store_id");
  } else {
    console.log("Column already exists: sales.store_id");
  }

  // 9. Add store_id column to estimates
  if (!columnExists("estimates", "store_id")) {
    sqlite.exec("ALTER TABLE estimates ADD COLUMN store_id TEXT REFERENCES store_profile(id) ON DELETE CASCADE");
    console.log("Added column: estimates.store_id");
  } else {
    console.log("Column already exists: estimates.store_id");
  }

  console.log("Schema setup completed.\n");
};
