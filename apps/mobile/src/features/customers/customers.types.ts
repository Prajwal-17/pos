import type {
  Customer,
  LedgerEntry,
  LedgerSummary,
  CustomerSummary,
  ActivityEvent
} from "@desktop-shared/types";
import type { DateRange } from "@/lib/format/records";
export type { Customer, LedgerEntry, LedgerSummary, CustomerSummary, ActivityEvent };
export interface CustomerFilters {
  search: string;
  type: "all" | "cash" | "account" | "hotel";
  balance: "all" | "due" | "advance" | "settled";
  archived: "active" | "archived" | "all";
  sort: "name" | "name_desc" | "balance" | "newest";
}
export interface LedgerFilters {
  search: string;
  type: string;
  range: DateRange;
  sort: "newest" | "oldest";
}
export interface CustomerWorkspace {
  customer: Customer;
  summary: CustomerSummary;
  ledger: LedgerSummary;
  activity: {
    id: string;
    kind: string;
    date: string;
    amount: number;
    documentId: string | null;
    documentNo: number | null;
    notes: string | null;
  }[];
}
