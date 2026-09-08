import type { Customer, UnifiedTransactionItem, StoreProfile } from "@desktop-shared/types";
import type { DateRange } from "@/lib/format/records";
export type TransactionKind = "sale" | "estimate";
export type TransactionSort = "newest" | "oldest" | "high" | "low";
export interface TransactionFilters {
  search: string;
  range: DateRange;
  sort: TransactionSort;
  customerId?: string;
}
export interface TransactionRow {
  id: string;
  customerId: string;
  customerName: string;
  transactionNo: number;
  createdAt: string;
  grandTotal: number;
  totalQuantity: number;
  notes: string | null;
  inLedger: number;
}
export interface Bill extends TransactionRow {
  kind: TransactionKind;
  recordedAt: string | null;
  customer: Pick<Customer, "id" | "name" | "contact" | "address">;
  items: UnifiedTransactionItem[];
}
export type { StoreProfile };
