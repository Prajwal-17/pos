import type { Product } from "@desktop-shared/types";
import type { DateRange } from "@/lib/format/records";
import type { TransactionKind } from "@/features/transactions/transactions.types";
export type ProductRecord = Product & { isDeleted: boolean; deletedAt: string | null };
export interface ProductFilters {
  search: string;
  status: "active" | "inactive" | "deleted" | "all";
  sort: "name" | "name_desc" | "price_low" | "price_high" | "mrp_low" | "mrp_high";
}
export interface PriceChange {
  id: string;
  name: string;
  weight: string | null;
  unit: string | null;
  oldPrice: number | null;
  newPrice: number | null;
  oldMrp: number | null;
  newMrp: number | null;
  oldPurchasePrice: number | null;
  newPurchasePrice: number | null;
  createdAt: string;
}
export interface ProductBill {
  id: string;
  billId: string;
  kind: TransactionKind;
  number: number;
  customerName: string;
  quantity: number;
  price: number;
  totalPrice: number;
  createdAt: string;
}
export interface ProductBillFilters {
  search: string;
  kind: "all" | TransactionKind;
  range: DateRange;
}
