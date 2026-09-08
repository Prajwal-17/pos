import { formatRupee } from "@/lib/format/money";
import type { ProductRecord } from "./products.types";
export function productMeta(product: ProductRecord): string {
  return [
    [product.weight, product.unit].filter(Boolean).join(" "),
    product.mrp == null ? null : `MRP ${formatRupee(product.mrp)}`,
    product.isDeleted ? "Deleted" : product.isDisabled ? "Inactive" : null
  ]
    .filter(Boolean)
    .join(" · ");
}
