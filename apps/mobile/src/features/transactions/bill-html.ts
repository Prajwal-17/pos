import { formatRupee } from "@/lib/format/money";
import { quantity, recordDate } from "@/lib/format/records";
import type { Bill, StoreProfile } from "./transactions.types";

export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!
  );
}
export function billHtml(bill: Bill, store: StoreProfile): string {
  const text = escapeHtml;
  const title = `${bill.kind === "sale" ? "Sale" : "Estimate"} #${bill.transactionNo}`;
  const subtotal = bill.items.reduce((sum, item) => sum + item.totalPrice, 0);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${text(title)}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; } body { margin: 0; color: #20231f; background: white; font: 12px/1.45 Arial,sans-serif; }
    header { display: flex; justify-content: space-between; gap: 20px; border-bottom: 2px solid #283129; padding-bottom: 16px; }
    h1 { font-size: 22px; margin: 0 0 5px; } h2 { font-size: 16px; margin: 0 0 5px; } p { margin: 3px 0; }
    .muted { color: #4d544c; } .right { text-align: right; } .customer { margin: 18px 0; } .pre { white-space: pre-wrap; overflow-wrap: anywhere; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; } th { background: #e9ebe6; text-align: left; font-size: 11px; }
    td,th { padding: 8px 6px; border-bottom: 1px solid #d8d5cc; vertical-align: top; overflow-wrap: anywhere; } tr { break-inside: avoid; } thead { display: table-header-group; }
    .totals { margin: 18px 0 0 auto; width: 260px; max-width: 100%; break-inside: avoid; } .total { font-size: 17px; font-weight: bold; border-top: 2px solid #283129; }
    .notes { margin-top: 20px; break-inside: avoid; } .number { font-variant-numeric: tabular-nums; }
  </style></head><body>
  <header><div><h1>${text(store.storeName)}</h1><p>${text(store.addressLine1)}</p>${store.addressLine2 ? `<p>${text(store.addressLine2)}</p>` : ""}<p>${text([store.city, store.state, store.pincode].filter(Boolean).join(", "))}</p><p>${text(store.phone)}</p>${bill.kind === "sale" && store.gstin ? `<p>GSTIN ${text(store.gstin)}</p>` : ""}</div><div class="right"><h2>${text(title)}</h2><p>${text(recordDate(bill.createdAt, true))}</p></div></header>
  <section class="customer"><p class="muted">Customer</p><h2>${text(bill.customer.name)}</h2>${bill.customer.contact ? `<p>${text(bill.customer.contact)}</p>` : ""}${bill.customer.address ? `<p class="pre">${text(bill.customer.address)}</p>` : ""}</section>
  <table><thead><tr><th style="width:5%">#</th><th style="width:43%">Item</th><th class="right" style="width:12%">Qty</th><th class="right" style="width:19%">Rate</th><th class="right" style="width:21%">Amount</th></tr></thead><tbody>
  ${bill.items.map((item, index) => `<tr><td>${index + 1}</td><td>${text(item.productSnapshot)}</td><td class="right number">${text(quantity(item.quantity))}</td><td class="right number">${text(formatRupee(item.price))}</td><td class="right number">${text(formatRupee(item.totalPrice))}</td></tr>`).join("")}
  </tbody></table><table class="totals"><tbody><tr><td>Subtotal</td><td class="right number">${text(formatRupee(subtotal))}</td></tr><tr><td>Rounding</td><td class="right number">${text(formatRupee(bill.grandTotal - subtotal))}</td></tr><tr class="total"><td>Total</td><td class="right number">${text(formatRupee(bill.grandTotal))}</td></tr></tbody></table>
  ${bill.notes ? `<section class="notes"><p class="muted">Notes</p><p class="pre">${text(bill.notes)}</p></section>` : ""}
  </body></html>`;
}
