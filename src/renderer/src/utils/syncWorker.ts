import { apiClient } from "@/lib/apiClient";
import { useBillingStore } from "@/store/billingStore";
import { useLineItemsStore } from "@/store/lineItemsStore";
import {
  buildTransactionPayload,
  filterDirtyLineItems,
  filterValidLineItems,
  normalizeLineItems
} from "@/utils";
import type { SyncResponse } from "@shared/types";
import debounce from "lodash.debounce";

let isSyncing = false;

const syncLogic = async () => {
  if (isSyncing) return;

  const { lineItems, markItemAsSaving, markItemAsSynced, updateLineItemId, purgeDeletedItems } =
    useLineItemsStore.getState();
  const { billingId, setBillingId, billingType, transactionNo, customerId, billingDate } =
    useBillingStore.getState();

  const validLineItems = filterValidLineItems(lineItems);
  const dirtyItems = filterDirtyLineItems(validLineItems);

  if (dirtyItems.length === 0) return;

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

  const isNewBill = !billingId;
  const endpoint = isNewBill
    ? `/api/${billingType}s/create`
    : `/api/${billingType}s/${billingId}/sync`;

  try {
    const response = (await apiClient.post(endpoint, payload)) as SyncResponse;

    if (isNewBill && response.billingId) {
      setBillingId(response.billingId);
    }

    const updateIdsMap: Map<string, string> = new Map(
      response.syncedItems.map((i) => [i.rowId, i.id])
    );
    const syncIds: Set<string> = new Set(response.syncedItems.map((i) => i.rowId));
    const purgeIds: Set<string> = new Set(response.deletedRowIds);

    updateLineItemId(updateIdsMap);
    markItemAsSynced(syncIds);
    purgeDeletedItems(purgeIds);
  } catch (error) {
    console.error("Sync error:", error); // here error
    // Note: You should ideally have a revertItemToDirty action here
    // to ensure failed items are retried in the next cycle.
  } finally {
    // this finally might trigger in continously loops -> if error occured
    // also keeps running if the page has exited
    // this all keeps triggering in a loop if isDeleted=true || isDirty
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
