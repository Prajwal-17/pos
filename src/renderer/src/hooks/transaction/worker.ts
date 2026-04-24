import { apiClient } from "@/lib/apiClient";
import { useBillingStore } from "@/store/billingStore";
import { useLineItemsStore, type LineItem } from "@/store/lineItemsStore";
import {
  buildTransactionPayload,
  filterDirtyLineItems,
  filterValidLineItems,
  normalizeLineItems
} from "@/utils";
import type { UpdateResponseItem } from "@shared/types";
import debounce from "lodash.debounce";

let isSyncing = false;

const syncLogic = async () => {
  // drop if still in still in flight
  if (isSyncing) return;

  const { lineItems, markItemAsSaving, markItemAsSynced, updateLineItemId } =
    useLineItemsStore.getState();
  const { billingId, billingType, transactionNo, customerId, billingDate } =
    useBillingStore.getState();

  const validLineItems = filterValidLineItems(lineItems);
  const dirtyItems = filterDirtyLineItems(validLineItems);

  console.log("dirtyitems", dirtyItems);
  if (dirtyItems.length === 0 || !billingId) return;

  isSyncing = true;
  markItemAsSaving(dirtyItems);

  const normalizedItems = normalizeLineItems(dirtyItems); // here strip of the sync status
  const payload = buildTransactionPayload({
    billingType,
    transactionNo,
    customerId,
    items: normalizedItems,
    createdAt: billingDate ? billingDate.toISOString() : new Date().toISOString()
  });
  console.log("payload", payload);

  try {
    const response = await apiClient.post(`/api/${billingType}s/${billingId}/save`, payload);
    console.log("api response", response);

    markItemAsSynced(response as LineItem[]);
    updateLineItemId(response as UpdateResponseItem[]);
  } catch (error) {
    console.error("Sync error:", error);
    // Note: You should ideally have a revertItemToDirty action here
    // to ensure failed items are retried in the next cycle.
  } finally {
    isSyncing = false;

    const freshState = useLineItemsStore.getState();
    const freshValid = filterValidLineItems(freshState.lineItems);
    const pendingItems = filterDirtyLineItems(freshValid);

    if (pendingItems.length > 0) {
      processSyncQueue();
    }
  }
};

export const processSyncQueue = debounce(syncLogic, 800);
