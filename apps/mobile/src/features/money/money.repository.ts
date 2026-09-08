import type { SQLiteDatabase } from "expo-sqlite";
import { withLedgerTransaction } from "@/lib/db/money-database";

import { monthKey, shiftMonth, type LedgerMonth } from "@/lib/format/dates";
import type {
  DailyEntry,
  DailyEntryInput,
  DaySummary,
  LocalDate,
  OnlineChannel,
  OnlineReceipt,
  SupplierPayment
} from "@/features/money/money.types";

type DailyEntryRow = {
  entry_date: LocalDate;
  cash_paisa: number;
  created_at: string;
  updated_at: string;
};

type ReceiptRow = {
  channel_id: number;
  channel_name: string;
  amount_paisa: number;
  is_archived: number;
};

type PaymentRow = {
  id: number;
  payee: string;
  amount_paisa: number;
  note: string | null;
  position: number;
};

type SummaryRow = {
  entry_date: LocalDate;
  cash_paisa: number;
  online_paisa: number;
  paid_paisa: number;
};

type ChannelRow = {
  id: number;
  name: string;
  is_preset: number;
  is_archived: number;
};

export async function listMonthSummaries(
  db: SQLiteDatabase,
  month: LedgerMonth
): Promise<DaySummary[]> {
  const start = `${monthKey(month)}-01`;
  const end = `${monthKey(shiftMonth(month, 1))}-01`;
  const rows = await db.getAllAsync<SummaryRow>(
    `SELECT
       d.entry_date,
       d.cash_paisa,
       COALESCE((SELECT SUM(r.amount_paisa) FROM daily_online_receipts r
                 WHERE r.entry_date = d.entry_date), 0) AS online_paisa,
       COALESCE((SELECT SUM(p.amount_paisa) FROM supplier_payments p
                 WHERE p.entry_date = d.entry_date), 0) AS paid_paisa
     FROM daily_entries d
     WHERE d.entry_date >= ? AND d.entry_date < ?
     ORDER BY d.entry_date ASC`,
    start,
    end
  );

  return rows.map((row) => {
    const receivedPaisa = row.cash_paisa + row.online_paisa;
    return {
      date: row.entry_date,
      cashPaisa: row.cash_paisa,
      onlinePaisa: row.online_paisa,
      receivedPaisa,
      paidPaisa: row.paid_paisa,
      netPaisa: receivedPaisa - row.paid_paisa
    };
  });
}

export async function getDailyEntry(
  db: SQLiteDatabase,
  date: LocalDate
): Promise<DailyEntry | null> {
  const entry = await db.getFirstAsync<DailyEntryRow>(
    `SELECT entry_date, cash_paisa, created_at, updated_at
     FROM daily_entries WHERE entry_date = ?`,
    date
  );
  if (!entry) return null;

  const [receiptRows, paymentRows] = await Promise.all([
    db.getAllAsync<ReceiptRow>(
      `SELECT r.channel_id, c.name AS channel_name, r.amount_paisa, c.is_archived
       FROM daily_online_receipts r
       JOIN online_channels c ON c.id = r.channel_id
       WHERE r.entry_date = ?
       ORDER BY c.is_preset DESC, c.id ASC`,
      date
    ),
    db.getAllAsync<PaymentRow>(
      `SELECT id, payee, amount_paisa, note, position
       FROM supplier_payments
       WHERE entry_date = ?
       ORDER BY position ASC, id ASC`,
      date
    )
  ]);

  const onlineReceipts: OnlineReceipt[] = receiptRows.map((row) => ({
    channelId: row.channel_id,
    channelName: row.channel_name,
    amountPaisa: row.amount_paisa,
    isChannelArchived: Boolean(row.is_archived)
  }));
  const supplierPayments: SupplierPayment[] = paymentRows.map((row) => ({
    id: row.id,
    payee: row.payee,
    amountPaisa: row.amount_paisa,
    note: row.note,
    position: row.position
  }));

  return {
    date: entry.entry_date,
    cashPaisa: entry.cash_paisa,
    onlineReceipts,
    supplierPayments,
    createdAt: entry.created_at,
    updatedAt: entry.updated_at
  };
}

export async function saveDailyEntry(db: SQLiteDatabase, input: DailyEntryInput): Promise<void> {
  const now = new Date().toISOString();
  await withLedgerTransaction(db, async (transaction) => {
    await transaction.runAsync(
      `INSERT INTO daily_entries (entry_date, cash_paisa, created_at, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(entry_date) DO UPDATE SET
         cash_paisa = excluded.cash_paisa,
         updated_at = excluded.updated_at`,
      input.date,
      input.cashPaisa,
      now,
      now
    );

    await transaction.runAsync(
      "DELETE FROM daily_online_receipts WHERE entry_date = ?",
      input.date
    );
    await transaction.runAsync("DELETE FROM supplier_payments WHERE entry_date = ?", input.date);

    for (const receipt of input.onlineReceipts) {
      await transaction.runAsync(
        `INSERT INTO daily_online_receipts (entry_date, channel_id, amount_paisa)
         VALUES (?, ?, ?)`,
        input.date,
        receipt.channelId,
        receipt.amountPaisa
      );
    }

    for (const [position, payment] of input.supplierPayments.entries()) {
      await transaction.runAsync(
        `INSERT INTO supplier_payments (entry_date, payee, amount_paisa, note, position)
         VALUES (?, ?, ?, ?, ?)`,
        input.date,
        payment.payee,
        payment.amountPaisa,
        payment.note?.trim() || null,
        position
      );
    }
  });
}

export async function deleteDailyEntry(db: SQLiteDatabase, date: LocalDate): Promise<void> {
  await db.runAsync("DELETE FROM daily_entries WHERE entry_date = ?", date);
}

export async function listRecentVendorNames(db: SQLiteDatabase, search: string): Promise<string[]> {
  const rows = await db.getAllAsync<{ name: string }>(
    `SELECT trim(payee) AS name FROM supplier_payments
     WHERE id IN (
       SELECT MAX(id) FROM supplier_payments
       WHERE trim(payee) <> '' GROUP BY trim(payee) COLLATE NOCASE
     )
     AND instr(lower(trim(payee)), lower(?)) > 0
     ORDER BY id DESC LIMIT 6`,
    search.trim()
  );
  return rows.map((row) => row.name);
}

export async function listOnlineChannels(
  db: SQLiteDatabase,
  includeArchived = false
): Promise<OnlineChannel[]> {
  const rows = await db.getAllAsync<ChannelRow>(
    `SELECT id, name, is_preset, is_archived
     FROM online_channels
     ${includeArchived ? "" : "WHERE is_archived = 0"}
     ORDER BY is_preset DESC, CASE WHEN is_preset = 1 THEN id END ASC, name COLLATE NOCASE ASC`
  );

  return rows.map(mapChannel);
}

export async function createOnlineChannel(
  db: SQLiteDatabase,
  name: string
): Promise<OnlineChannel> {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Enter a channel name.");
  const now = new Date().toISOString();

  try {
    const result = await db.runAsync(
      `INSERT INTO online_channels (name, is_preset, is_archived, created_at, updated_at)
       VALUES (?, 0, 0, ?, ?)`,
      trimmedName,
      now,
      now
    );
    return { id: result.lastInsertRowId, name: trimmedName, isPreset: false, isArchived: false };
  } catch (error) {
    if (String(error).toLowerCase().includes("unique")) {
      throw new Error("A channel with this name already exists.");
    }
    throw error;
  }
}

export async function renameOnlineChannel(
  db: SQLiteDatabase,
  id: number,
  name: string
): Promise<void> {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Enter a channel name.");

  try {
    const result = await db.runAsync(
      `UPDATE online_channels SET name = ?, updated_at = ?
       WHERE id = ? AND is_preset = 0`,
      trimmedName,
      new Date().toISOString(),
      id
    );
    if (result.changes === 0) throw new Error("Preset channels cannot be renamed.");
  } catch (error) {
    if (String(error).toLowerCase().includes("unique")) {
      throw new Error("A channel with this name already exists.");
    }
    throw error;
  }
}

export async function setOnlineChannelArchived(
  db: SQLiteDatabase,
  id: number,
  archived: boolean
): Promise<void> {
  const result = await db.runAsync(
    `UPDATE online_channels SET is_archived = ?, updated_at = ?
     WHERE id = ? AND is_preset = 0`,
    archived ? 1 : 0,
    new Date().toISOString(),
    id
  );
  if (result.changes === 0) throw new Error("Preset channels cannot be archived.");
}

function mapChannel(row: ChannelRow): OnlineChannel {
  return {
    id: row.id,
    name: row.name,
    isPreset: Boolean(row.is_preset),
    isArchived: Boolean(row.is_archived)
  };
}
