import { apiClient } from "@/lib/apiClient";
import { useBillingStore } from "@/store/billingStore";
import { useLineItemsStore, type LineItem } from "@/store/lineItemsStore";
import { filterDirtyLineItems, filterValidLineItems } from "@/utils";
import type { UpdateResponseItem } from "@shared/types";
import debounce from "lodash.debounce";

let isSyncing = false;

const syncLogic = async () => {
  // drop if still in still in flight
  if (isSyncing) return;

  const { lineItems, markItemAsSaving, markItemAsSynced, updateLineItemId } =
    useLineItemsStore.getState();
  const { billingId, billingType } = useBillingStore.getState();

  const validLineItems = filterValidLineItems(lineItems);
  const dirtyItems = filterDirtyLineItems(validLineItems);

  if (dirtyItems.length === 0 || !billingId) return;

  isSyncing = true;
  markItemAsSaving(dirtyItems);

  try {
    const response = await apiClient.post(`/api/${billingType}s/${billingId}/save`, dirtyItems);

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
