import type { SQLiteDatabase } from "expo-sqlite";
import { Platform } from "react-native";

const DATABASE_VERSION = 1;

export async function withLedgerTransaction(
  db: SQLiteDatabase,
  task: (transaction: SQLiteDatabase) => Promise<void>
): Promise<void> {
  // Expo's exclusive connection is native-only. Web uses the provider connection;
  // the entry screen prevents edits/navigation until this transaction finishes.
  if (Platform.OS === "web") await db.withTransactionAsync(() => task(db));
  else await db.withExclusiveTransactionAsync(task);
}

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  const result = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion > DATABASE_VERSION) {
    throw new Error("This database was created by a newer version of Relay.");
  }

  if (currentVersion < 1) {
    await withLedgerTransaction(db, async (transaction) => {
      await transaction.execAsync(`
        CREATE TABLE IF NOT EXISTS daily_entries (
          entry_date TEXT PRIMARY KEY NOT NULL,
          cash_paisa INTEGER NOT NULL DEFAULT 0 CHECK (cash_paisa >= 0),
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS online_channels (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL COLLATE NOCASE UNIQUE,
          is_preset INTEGER NOT NULL DEFAULT 0 CHECK (is_preset IN (0, 1)),
          is_archived INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0, 1)),
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS daily_online_receipts (
          entry_date TEXT NOT NULL REFERENCES daily_entries(entry_date) ON DELETE CASCADE,
          channel_id INTEGER NOT NULL REFERENCES online_channels(id) ON DELETE RESTRICT,
          amount_paisa INTEGER NOT NULL CHECK (amount_paisa > 0),
          PRIMARY KEY (entry_date, channel_id)
        );

        CREATE TABLE IF NOT EXISTS supplier_payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          entry_date TEXT NOT NULL REFERENCES daily_entries(entry_date) ON DELETE CASCADE,
          payee TEXT NOT NULL,
          amount_paisa INTEGER NOT NULL CHECK (amount_paisa > 0),
          note TEXT,
          position INTEGER NOT NULL DEFAULT 0
        );

        CREATE INDEX IF NOT EXISTS supplier_payments_entry_date_idx
          ON supplier_payments(entry_date, position);
      `);

      const now = new Date().toISOString();
      for (const channel of ["Paytm", "PhonePe", "Google Pay", "Other"]) {
        await transaction.runAsync(
          `INSERT OR IGNORE INTO online_channels
            (name, is_preset, is_archived, created_at, updated_at)
           VALUES (?, 1, 0, ?, ?)`,
          channel,
          now,
          now
        );
      }

      await transaction.execAsync("PRAGMA user_version = 1;");
    });
  }
}
