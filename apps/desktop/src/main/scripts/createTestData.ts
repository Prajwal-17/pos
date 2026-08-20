import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { coordinateDatabaseUpgrade, type UpgradeDatabase } from "../db/upgradeCoordinator";
import {
  seedTestData,
  TEST_DATA_SCALES,
  type TestDataScale,
  type TestDataSummary
} from "./testDataGenerator";

type CliOptions = {
  databasePath: string;
  migrationsFolder: string;
  scale: TestDataScale;
  seed: number;
  asOf: Date;
  reset: boolean;
};

const HELP = `Create a migrated QuickCart database filled with deterministic test data.

Usage:
  pnpm db:create:test-data [options]

Options:
  --database <path>   SQLite target (default: .local/quickcart-test.db)
  --scale <name>      small, standard, or large (default: standard)
  --seed <integer>    Faker seed (default: 20260820)
  --as-of <date>      Latest generated date, YYYY-MM-DD (default: today)
  --reset             Replace application data in a non-empty target
  --help              Show this help
`;

function valueAfter(args: string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value.`);
  return value;
}

function parseDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("--as-of must use YYYY-MM-DD format.");
  }
  const date = new Date(`${value}T23:59:59.999Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error("--as-of must be a real calendar date.");
  }
  return date;
}

function parseArgs(args: string[]): CliOptions | null {
  const defaultDate = new Date().toISOString().slice(0, 10);
  const options: CliOptions = {
    databasePath: path.resolve(process.cwd(), ".local/quickcart-test.db"),
    migrationsFolder: path.resolve(process.cwd(), "drizzle"),
    scale: "standard",
    seed: 20260820,
    asOf: parseDate(defaultDate),
    reset: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--") continue;
    if (arg === "--help") return null;
    if (arg === "--reset") {
      options.reset = true;
      continue;
    }
    if (arg === "--database") {
      options.databasePath = path.resolve(valueAfter(args, index, arg));
      index += 1;
      continue;
    }
    if (arg === "--scale") {
      const scale = valueAfter(args, index, arg);
      if (!(scale in TEST_DATA_SCALES)) {
        throw new Error("--scale must be small, standard, or large.");
      }
      options.scale = scale as TestDataScale;
      index += 1;
      continue;
    }
    if (arg === "--seed") {
      const seed = Number(valueAfter(args, index, arg));
      if (!Number.isSafeInteger(seed)) throw new Error("--seed must be an integer.");
      options.seed = seed;
      index += 1;
      continue;
    }
    if (arg === "--as-of") {
      options.asOf = parseDate(valueAfter(args, index, arg));
      index += 1;
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }

  return options;
}

function applicationRowCount(sqlite: Database.Database): number {
  const tables = sqlite
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = ? AND name NOT LIKE ? AND name NOT IN (?, ?)"
    )
    .all("table", "sqlite_%", "__drizzle_migrations", "app_data_migrations") as Array<{
    name: string;
  }>;

  return tables.reduce((total, table) => {
    const quotedName = table.name.replaceAll('"', '""');
    const row = sqlite.prepare('SELECT COUNT(*) AS value FROM "' + quotedName + '"').get() as {
      value: number;
    };
    return total + row.value;
  }, 0);
}

function existingApplicationRowCount(databasePath: string): number {
  if (!fs.existsSync(databasePath)) return 0;
  const sqlite = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    return applicationRowCount(sqlite);
  } finally {
    sqlite.close();
  }
}

function clearApplicationData(db: UpgradeDatabase): void {
  db.$client.transaction(() => {
    db.$client.exec(`
      DELETE FROM customer_ledger;
      DELETE FROM sale_items;
      DELETE FROM estimate_items;
      DELETE FROM product_history;
      DELETE FROM sales;
      DELETE FROM estimates;
      DELETE FROM products;
      DELETE FROM customers;
      DELETE FROM app_preferences;
      DELETE FROM store_profile;
      DELETE FROM app_instance;
    `);
  })();
}

function formatSummary(summary: TestDataSummary): string {
  return [
    `${summary.customers} customers`,
    `${summary.products} products`,
    `${summary.sales} sales / ${summary.saleItems} items`,
    `${summary.estimates} estimates / ${summary.estimateItems} items`,
    `${summary.ledgerEntries} ledger entries`,
    `${summary.productHistory} product history rows`
  ].join("\n  ");
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (!options) {
    console.info(HELP);
    return;
  }
  if (!fs.existsSync(options.migrationsFolder)) {
    throw new Error(`Migration directory not found: ${options.migrationsFolder}`);
  }

  const existingRowsBeforeMigration = existingApplicationRowCount(options.databasePath);
  if (existingRowsBeforeMigration > 0 && !options.reset) {
    throw new Error(
      `Refusing to replace non-empty database ${options.databasePath}. Re-run with --reset if this target is disposable.`
    );
  }

  const { db, sqlite } = await coordinateDatabaseUpgrade({
    databasePath: options.databasePath,
    migrationsFolder: options.migrationsFolder
  });

  try {
    const existingRows = applicationRowCount(sqlite);
    if (existingRows > 0 && !options.reset) {
      throw new Error(
        `Refusing to replace non-empty database ${options.databasePath}. Re-run with --reset if this target is disposable.`
      );
    }
    if (existingRows > 0) clearApplicationData(db);

    const summary = seedTestData(db, {
      ...TEST_DATA_SCALES[options.scale],
      seed: options.seed,
      asOf: options.asOf
    });
    const integrity = sqlite.pragma("integrity_check", { simple: true });
    const foreignKeyProblems = sqlite.pragma("foreign_key_check") as unknown[];
    if (integrity !== "ok" || foreignKeyProblems.length > 0) {
      throw new Error("Generated database did not pass SQLite integrity checks.");
    }

    console.info(`Created QuickCart ${options.scale} test database at:\n  ${options.databasePath}`);
    console.info(`\nGenerated:\n  ${formatSummary(summary)}`);
    console.info(`\nSeed: ${options.seed}\nAs of: ${options.asOf.toISOString().slice(0, 10)}`);
    if (options.databasePath === path.resolve(process.cwd(), ".local/quickcart-test.db")) {
      console.info("\nStart QuickCart with this database:\n  pnpm dev:test-data");
    }
  } finally {
    sqlite.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
