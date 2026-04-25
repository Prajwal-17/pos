import type { Product, UnifiedTransactionItem } from "@shared/types";
import { convertToPaisa, convertToRupees, fromMilliUnits, toMilliUnits } from "@shared/utils/utils";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const SYNCSTATUS = {
  SAVING: "saving",
  IS_DIRTY: "is_dirty",
  SYNCED: "synced"
} as const;

export type SyncStatus = (typeof SYNCSTATUS)[keyof typeof SYNCSTATUS];

export type LineItem = {
  id: string | null; // saleItem.id | estimateItem.id
  rowId: string;
  productId: string | null;
  name: string;
  productSnapshot: string;
  weight: string | null;
  unit: string | null;
  mrp: number | null;
  price: string;
  quantity: string;
  totalPrice: number; // UI-only
  checkedQty: number;
  isInventoryItem: boolean;
  syncStatus: SyncStatus; // FE-only
  isDeleted: boolean; // delete item flag
};

type LineItemsStore = {
  isCountColumnVisible: boolean;
  setIsCountControlsVisible: () => void;
  lineItems: LineItem[] | [];
  setLineItems: (itemsArray: UnifiedTransactionItem[]) => void;
  addEmptyLineItem: (type?: "button") => void;
  addLineItem: (rowId: string, newItem: Product) => void;
  updateLineItem: (id: string, field: keyof LineItem, value: string | number) => void;
  updateLineItemId: (idMap: Map<string, string>) => void;
  deleteLineItem: (rowId: string) => void;
  purgeDeletedItems: (rowIds: Set<string>) => void;
  markItemAsSaving: (items: LineItem[]) => void;
  markItemAsSynced: (rowIds: Set<string>) => void;
  setAllChecked: (checked: boolean) => void;
  reset: () => void;
};

function normalizeLineItems(itemsArray: UnifiedTransactionItem[]) {
  if (!itemsArray || itemsArray.length === 0) {
    return [initialLineItem()];
  }

  const lineItemsArray: LineItem[] = itemsArray.map((item) => ({
    id: item.id,
    rowId: uuidv4(),
    productId: item.productId,
    name: item.name,
    productSnapshot: item.productSnapshot,
    weight: item.weight,
    unit: item.unit,
    mrp: item.mrp,
    price: item.price ? convertToRupees(Number(item.price)).toString() : "",
    quantity: fromMilliUnits(item.quantity).toString(),
    totalPrice: item.totalPrice,
    checkedQty: fromMilliUnits(item.checkedQty),
    isInventoryItem: item.productId ? true : false,
    syncStatus: SYNCSTATUS.SYNCED,
    isDeleted: false
  }));

  return [...lineItemsArray, initialLineItem()];
}

function initialLineItem() {
  const lineItem: LineItem = {
    id: null,
    rowId: uuidv4(),
    productId: null,
    name: "",
    productSnapshot: "",
    weight: null,
    unit: null,
    mrp: null,
    price: "",
    quantity: "",
    totalPrice: 0,
    checkedQty: 0,
    isInventoryItem: false,
    syncStatus: SYNCSTATUS.SYNCED,
    isDeleted: false
  };

  return lineItem;
}

const reCalculateLineItem = (item: LineItem): LineItem => {
  const priceInRupees = parseFloat(item.price) || 0;
  const qtyInUnits = parseFloat(item.quantity) || 0;
  const priceInPaisa = convertToPaisa(priceInRupees);
  const qtyInMilli = toMilliUnits(qtyInUnits);
  const totalPrice = Math.round((priceInPaisa * qtyInMilli) / 1000);
  return {
    ...item,
    totalPrice: totalPrice
  };
};

export const useLineItemsStore = create<LineItemsStore>()(
  devtools(
    immer((set) => ({
      isCountColumnVisible: false,
      setIsCountControlsVisible: () =>
        set(
          (state) => ({
            isCountColumnVisible: !state.isCountColumnVisible
          }),
          false,
          "lineItems/setIsCountControlsVisible"
        ),

      lineItems: [initialLineItem()],

      setLineItems: (itemsArray) =>
        set(
          () => ({
            lineItems: normalizeLineItems(itemsArray)
          }),
          false,
          "lineItems/setLineItems"
        ),

      // add empty row
      addEmptyLineItem: (type) =>
        set(
          (state) => {
            const length = state.lineItems.length;
            if (type !== "button" && state.lineItems[length - 1].name === "") {
              return state;
            }
            return {
              lineItems: [...state.lineItems, initialLineItem()]
            };
          },
          false,
          "lineItems/addEmptyLineItem"
        ),

      // add new item on selection
      addLineItem: (rowId, newItem) =>
        set(
          (state) => {
            /**
             * always create a new array to update the existing state array, coz react/zustand does
             * shallow comparison hence the array reference remains the same, so creating new array creates new reference
             * where react/zustand notices change
             */
            const currLineItems = [...state.lineItems];

            // get index of item at rowId
            const index = currLineItems.findIndex((item) => item.rowId === rowId);

            // existing line item at rowId
            const oldItem = currLineItems[index];
            const oldQtyNum = parseFloat(oldItem.quantity || "0");
            const oldItemQuantity = oldQtyNum >= 1 ? oldQtyNum : 1;
            const oldItemCheckedQty = oldItem.checkedQty > 1 ? oldItem.checkedQty : 0;

            const updatedItem: LineItem = {
              id: null,
              rowId: uuidv4(),
              productId: newItem.id,
              name: newItem.name,
              productSnapshot: newItem.productSnapshot,
              weight: newItem.weight,
              unit: newItem.unit,
              mrp: newItem.mrp,
              price: newItem.price ? convertToRupees(newItem.price).toString() : "",
              quantity: oldItemQuantity.toString(),
              totalPrice: parseFloat((oldItemQuantity * newItem.price).toFixed(2)),
              checkedQty: oldItemCheckedQty,
              isInventoryItem: true,
              syncStatus: SYNCSTATUS.IS_DIRTY,
              isDeleted: false
            };

            currLineItems[index] = { ...updatedItem };

            return {
              lineItems: currLineItems
            };
          },
          false,
          "lineItems/addLineItem"
        ),

      // update on field change
      updateLineItem: (rowId, field, value) =>
        set(
          (state) => {
            const updatedLineItems = state.lineItems.map((item: LineItem) => {
              if (rowId !== item.rowId) return item;

              let updatedItem = item;
              let finalValue: any;
              let isInventoryItem: boolean = item.isInventoryItem;
              if (field === "price" || field === "quantity") {
                finalValue = value;
                isInventoryItem = true;
              } else {
                finalValue = value;
              }

              if (field === "productSnapshot") {
                updatedItem = {
                  ...item,
                  productId: null,
                  name: "",
                  weight: null,
                  unit: null,
                  mrp: null
                };
                isInventoryItem = false;
              }

              const draftItem = {
                ...updatedItem,
                [field]: finalValue,
                isInventoryItem,
                syncStatus: SYNCSTATUS.IS_DIRTY
              };

              if (["quantity", "price"].includes(field)) {
                return reCalculateLineItem(draftItem);
              }
              return draftItem;
            });

            return {
              lineItems: updatedLineItems
            };
          },
          false,
          "lineItems/updateLineItem"
        ),

      // delete a row
      deleteLineItem: (rowId) =>
        set(
          (state) => {
            const itemToBeDeleted = state.lineItems.find((item) => item.rowId === rowId);
            if (itemToBeDeleted) {
              itemToBeDeleted.isDeleted = true;
            }
          },
          false,
          "lineItems/deleteLineItem"
        ),

      purgeDeletedItems: (rowIds) =>
        set((state) => {
          console.log("purge ids rowids", rowIds);
          state.lineItems = state.lineItems.filter((item) => !rowIds.has(item.rowId));
        }),

      setAllChecked: (checked) =>
        set(
          (state) => ({
            lineItems: state.lineItems.map((item: LineItem) => ({
              ...item,
              checkedQty: checked ? parseFloat(item.quantity || "0") : 0
            }))
          }),
          false,
          "lineItems/setAllChecked"
        ),

      updateLineItemId: (idMap) =>
        set(
          (state) => {
            // const newerIds = new Map(responseItems.map((i) => [i.rowId, i.id])); // map => <rowId, id(i.e saleItem.id || estimateItem.id)>

            state.lineItems.forEach((item) => {
              if (idMap.has(item.rowId)) {
                item.id = idMap.get(item.rowId)!; // type assertion - this value never be undefined
              }
            });
          },
          false,
          "lineItems/updateLineItemId"
        ),

      markItemAsSaving: (items) =>
        set(
          (state) => {
            const ids = new Set(items.map((i) => i.id));

            state.lineItems.forEach((item) => {
              if (ids.has(item.id)) {
                item.syncStatus = SYNCSTATUS.SAVING;
              }
            });
          },
          false,
          "lineItems/markItemsAsSaved"
        ),

      markItemAsSynced: (rowIds) =>
        set(
          (state) => {
            state.lineItems.forEach((item) => {
              if (rowIds.has(item.rowId)) {
                item.syncStatus = SYNCSTATUS.SYNCED;
              }
            });
          },
          false,
          "lineItems/markItemsAsSynced"
        ),

      reset: () =>
        set(
          () => ({
            isCountColumnVisible: false,
            lineItems: [initialLineItem()],
            originalLineItems: []
          }),
          false,
          "lineItems/reset"
        )
    })),
    { name: "line-items-store" }
  )
);
