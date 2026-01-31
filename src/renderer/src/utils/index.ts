import type { LineItem } from "@/store/lineItemsStore";
import {
  TRANSACTION_TYPE,
  UPDATE_QTY_ACTION,
  type TransactionType,
  type UpdateQtyAction
} from "@shared/types";
import { convertToPaisa } from "@shared/utils/utils";

type NormalizedLineItem = Omit<LineItem, "price" | "quantity"> & {
  price: number;
  quantity: number;
};

export const updateCheckedQuantity = (
  action: UpdateQtyAction,
  totalQty: number,
  checkedQty: number
) => {
  let updatedQty = checkedQty ?? 0;
  const remainder = +(totalQty % 1).toFixed(2);

  if (action === UPDATE_QTY_ACTION.INCREMENT) {
    const nextQty = updatedQty + 1;

    if (nextQty > totalQty) {
      const adjusted = updatedQty + remainder;
      updatedQty = adjusted <= totalQty ? adjusted : totalQty;
    } else {
      updatedQty = nextQty;
    }
  }

  if (action === UPDATE_QTY_ACTION.DECREMENT) {
    const nextQty = updatedQty - 1;
    const currentFrac = +(updatedQty % 1).toFixed(2);

    if (currentFrac !== 0 && updatedQty === totalQty) {
      updatedQty = Math.floor(updatedQty);
    } else {
      updatedQty = Math.max(0, nextQty);
    }
  }

  return Math.min(Math.max(updatedQty, 0), totalQty);
};

export const getCheckStatusColor = (checkedQty: number, quantity: number) => {
  let bgColor = "bg-background";
  if (checkedQty === quantity && quantity > 0) {
    bgColor = "bg-success/25";
  } else if (checkedQty > 0 && checkedQty < quantity) {
    bgColor = "bg-[oklch(0.8618_0.2317_65.9)]/20";
  }
  return bgColor;
};

export const toSentenceCase = (word: string) => {
  return word.charAt(0).toUpperCase() + word.slice(1);
};

export const filterValidLineItems = (items: LineItem[]) => {
  return items.filter(
    (item) =>
      item.productSnapshot.trim().length > 0 &&
      parseFloat(item.price) > 0 &&
      parseFloat(item.quantity) > 0 &&
      item.totalPrice > 0
  );
};

/**
 * Normalize an array of LineItem for API payloads.
 *
 * Filters out invalid items, converts each item's `price` to paisa (integer)
 * and parses `quantity` to a number.
 *
 * Note: this function does not add or modify `rowId` (intended for payload
 * construction, not for zustand actions that require `rowId` injection).
 *
 * @param lineItems - The line items to validate and normalize
 * @returns An array of line items with `price` in paisa and `quantity` as a number
 */
export function normalizeLineItems(lineItems: LineItem[]): NormalizedLineItem[] {
  const filteredLineitems = filterValidLineItems(lineItems);

  return filteredLineitems.map((item) => ({
    ...item,
    price: convertToPaisa(parseFloat(item.price || "0")),
    quantity: parseFloat(item.quantity || "0")
  }));
}

/**
 * Normalize a list of original LineItem objects for comparison by converting price to paisa and quantity to numbers.
 *
 * Invalid or empty items are removed. This function does not add row identifiers (`rowId`), so it is not suitable for workflows that require row IDs.
 *
 * @param lineItems - The original line items to normalize
 * @returns An array of line items with `price` converted to paisa (number) and `quantity` converted to a numeric value
 */
export function normalizeOriginalLineItems(lineItems: LineItem[]) {
  const filteredLineitems = filterValidLineItems(lineItems);

  return filteredLineitems.map((item) => ({
    ...item,
    price: convertToPaisa(parseFloat(item.price || "0")),
    quantity: parseFloat(item.quantity || "0")
  }));
}

/** Strip off `id` & `rowId` fields in an array of objects for comparision */
export function stripLineItems(originalLineItems: any[], currentLineItems: any[]) {
  /* eslint-disable */
  const stripedOriginal = originalLineItems.map(({ id, rowId, isInventoryItem, ...rest }) => rest);
  const stripedCurrent = currentLineItems.map(({ id, rowId, isInventoryItem, ...rest }) => rest);
  /* eslint-enable */

  return {
    originalCleaned: stripedOriginal,
    currentCleaned: stripedCurrent
  };
}

export function buildTransactionPayload({
  billingType,
  billingId,
  isAutoSave,
  transactionNo,
  customerId,
  items,
  createdAt
}: {
  billingType: TransactionType;
  billingId: string | null;
  isAutoSave: boolean;
  transactionNo: number | null;
  customerId: string | null;
  items: NormalizedLineItem[];
  createdAt: string;
}) {
  return {
    billingType: billingType,
    id: billingId,
    payload: {
      isAutoSave: isAutoSave,
      data: {
        transactionNo: transactionNo,
        transactionType: billingType,
        customerId,
        isPaid: billingType === TRANSACTION_TYPE.SALE,
        items,
        createdAt
      }
    }
  };
}