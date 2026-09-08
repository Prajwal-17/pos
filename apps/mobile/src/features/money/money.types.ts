import type { LocalDate } from "@/lib/format/dates";
export type { LocalDate } from "@/lib/format/dates";

export interface OnlineChannel {
  id: number;
  name: string;
  isPreset: boolean;
  isArchived: boolean;
}

export interface OnlineReceipt {
  channelId: number;
  channelName: string;
  amountPaisa: number;
  isChannelArchived: boolean;
}

export interface SupplierPayment {
  id: number;
  payee: string;
  amountPaisa: number;
  note: string | null;
  position: number;
}

export interface DailyEntry {
  date: LocalDate;
  cashPaisa: number;
  onlineReceipts: OnlineReceipt[];
  supplierPayments: SupplierPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface OnlineReceiptInput {
  channelId: number;
  amountPaisa: number;
}

export interface SupplierPaymentInput {
  payee: string;
  amountPaisa: number;
  note?: string;
}

export interface DailyEntryInput {
  date: LocalDate;
  cashPaisa: number;
  onlineReceipts: OnlineReceiptInput[];
  supplierPayments: SupplierPaymentInput[];
}

export interface DaySummary {
  date: LocalDate;
  cashPaisa: number;
  onlinePaisa: number;
  receivedPaisa: number;
  paidPaisa: number;
  netPaisa: number;
}

export function summarizeEntry(entry: DailyEntry): DaySummary {
  const onlinePaisa = entry.onlineReceipts.reduce((total, row) => total + row.amountPaisa, 0);
  const paidPaisa = entry.supplierPayments.reduce(
    (total, payment) => total + payment.amountPaisa,
    0
  );
  const receivedPaisa = entry.cashPaisa + onlinePaisa;

  return {
    date: entry.date,
    cashPaisa: entry.cashPaisa,
    onlinePaisa,
    receivedPaisa,
    paidPaisa,
    netPaisa: receivedPaisa - paidPaisa
  };
}
