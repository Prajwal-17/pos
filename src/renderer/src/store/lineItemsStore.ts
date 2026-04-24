import type { Product, UnifiedTransactionItem, UpdateResponseItem } from "@shared/types";
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
  purchasePrice: number | null;
  quantity: string;
  totalPrice: number;
  checkedQty: number;
  isInventoryItem: boolean;
  syncStatus: SyncStatus;
};

type LineItemsStore = {
  isCountColumnVisible: boolean;
  setIsCountControlsVisible: () => void;
  lineItems: LineItem[] | [];
  setLineItems: (itemsArray: UnifiedTransactionItem[]) => void;
  // originalLineItems: LineItem[] | [];
  // setOriginalLineItems: () => void;
  addEmptyLineItem: (type?: "button") => void;
  addLineItem: (rowId: string, newItem: Product) => void;
  updateLineItem: (id: string, field: keyof LineItem, value: string | number) => void;
  updateLineItemId: (responseItems: UpdateResponseItem[]) => void;
  deleteLineItem: (id: string) => void;
  markItemAsSaving: (items: LineItem[]) => void;
  markItemAsSynced: (items: LineItem[]) => void;
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
    purchasePrice: item.purchasePrice,
    quantity: fromMilliUnits(item.quantity).toString(),
    totalPrice: item.totalPrice,
    checkedQty: fromMilliUnits(item.checkedQty),
    isInventoryItem: item.productId ? true : false,
    syncStatus: SYNCSTATUS.SYNCED
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
    purchasePrice: null,
    quantity: "",
    totalPrice: 0,
    checkedQty: 0,
    isInventoryItem: false,
    syncStatus: SYNCSTATUS.SYNCED
  };

  return lineItem;
}

// function normalizeLineItems(itemsArray: UnifiedTransactionItem[]) {
//   if (!itemsArray || itemsArray.length === 0) {
//     return [initialLineItem()];
//   }

//   const lineItemsArray: LineItem[] = itemsArray.map((item) => ({
//     id: item.id,
//     rowId: uuidv4(),
//     productId: item.productId,
//     name: item.name,
//     productSnapshot: item.productSnapshot,
//     weight: item.weight,
//     unit: item.unit,
//     mrp: item.mrp,
//     price: item.price ? convertToRupees(Number(item.price)).toString() : "",
//     purchasePrice: item.purchasePrice,
//     quantity: fromMilliUnits(item.quantity).toString(),
//     totalPrice: item.totalPrice,
//     checkedQty: fromMilliUnits(item.checkedQty),
//     isInventoryItem: item.productId ? true : false
//   }));

//   return [...lineItemsArray, initialLineItem()];
// }

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

      // live state
      lineItems: [initialLineItem()],

      setLineItems: (itemsArray) =>
        set(
          () => ({
            lineItems: normalizeLineItems(itemsArray)
          }),
          false,
          "lineItems/setLineItems"
        ),

      // // recently saved result from DB
      // originalLineItems: [],
      // setOriginalLineItems: () =>
      //   set(
      //     (state) => ({
      //       originalLineItems: state.lineItems
      //     }),
      //     false,
      //     "lineItems/setOriginalLineItems"
      //   ),

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
              purchasePrice: newItem.purchasePrice,
              quantity: oldItemQuantity.toString(),
              totalPrice: parseFloat((oldItemQuantity * newItem.price).toFixed(2)),
              checkedQty: oldItemCheckedQty,
              isInventoryItem: true,
              syncStatus: SYNCSTATUS.IS_DIRTY
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
                  mrp: null,
                  purchasePrice: null
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

      /**
       * Update Internal Id's of LineItems array & update original LineItems
       */
      // updateInternalIds: (responseItems) =>
      //   set(
      //     (state) => {
      //       const updatedLineItems = state.lineItems.map((lineItem: LineItem) => {
      //         const current = responseItems.find((item) => item.rowId === lineItem.rowId);

      //         if (!current) return lineItem;
      //         if (current.id === lineItem.id) {
      //           return lineItem;
      //         }

      //         return {
      //           ...lineItem,
      //           id: current?.id
      //         };
      //       });

      //       return {
      //         lineItems: updatedLineItems,
      //         originalLineItems: filterValidLineItems(updatedLineItems)
      //       };
      //     },
      //     false,
      //     "lineItems/updateInternalIds"
      //   ),

      // delete a row
      deleteLineItem: (id) =>
        set(
          (state) => {
            const updatedLineItems = state.lineItems.filter((item) => item.rowId !== id);
            if (updatedLineItems.length === 0) {
              return {
                lineItems: [initialLineItem()]
              };
            }
            return {
              lineItems: updatedLineItems
            };
          },
          false,
          "lineItems/deleteLineItem"
        ),

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

      updateLineItemId: (responseItems) =>
        set((state) => {
          const newerIds = new Map(responseItems.map((i) => [i.rowId, i.id])); // map => <rowId, id(i.e saleItem.id || estimateItem.id)>

          state.lineItems.forEach((item) => {
            if (newerIds.has(item.rowId)) {
              item.id = newerIds.get(item.rowId)!; // type assertion - this value never be undefined
            }
          });
        }),

      markItemAsSaving: (items) =>
        set((state) => {
          const ids = new Set(items.map((i) => i.id));

          state.lineItems.forEach((item) => {
            if (ids.has(item.id)) {
              item.syncStatus = SYNCSTATUS.SAVING;
            }
          });
        }),

      markItemAsSynced: (items) =>
        set((state) => {
          const ids = new Set(items.map((i) => i.id));
          state.lineItems.forEach((item) => {
            if (ids.has(item.id)) {
              item.syncStatus = SYNCSTATUS.SYNCED;
            }
          });
        }),

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
