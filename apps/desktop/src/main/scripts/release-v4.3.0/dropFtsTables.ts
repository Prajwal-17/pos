import { db } from "../../db/db";

export const dropFtsTables = () => {
  console.log("Dropping FTS tables...");

  const sqlite = (db as any).$client;

  const ftsTables = [
    "products_fts",
    "products_fts_data",
    "products_fts_idx",
    "products_fts_docsize",
    "products_fts_config"
  ];

  for (const table of ftsTables) {
    sqlite.exec(`DROP TABLE IF EXISTS "${table}"`);
    console.log(`Dropped table: ${table}`);
  }

  console.log("FTS tables cleanup completed.");
};
