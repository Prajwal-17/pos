import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

type LineItems = {
  id: string;
  name: string;
  quantity: number;
  mrp: number;
  price: number;
  amount: number;
};
type BillingStoreType = {
  invoiceNo: string;
  setInvoiceNo: (newInvoiceNo: string) => void;
  customerName: string;
  setCustomerName: (newCustomerName: string) => void;
  customerContact: string;
  setCustomerContact: (newCustomerContact: string) => void;
  lineItems: LineItems[] | [];
  setLineItems: () => void;
  addEmptyLineItem: () => void;
  addLineItem: (index: number, newItem: LineItems) => void;
  updateLineItems: (itemId: string, field: string, value: string | number) => void;
  deleteLineItem: (itemId: string) => void;
};

function initialLineItem() {
  return { id: uuidv4(), name: "", quantity: 0, mrp: 0, price: 0, amount: 0 };
}

export const useBillingStore = create<BillingStoreType>((set) => ({
  invoiceNo: "",
  setInvoiceNo: (newInvoiceNo) => set(() => ({ invoiceNo: newInvoiceNo })),

  customerName: "",
  setCustomerName: (newCustomerName) => set(() => ({ customerName: newCustomerName })),

  customerContact: "",
  setCustomerContact: (newCustomerContact) => set({ customerContact: newCustomerContact }),

  lineItems: [initialLineItem()],

  setLineItems: () => set(() => ({})),

  // add empty row
  addEmptyLineItem: () =>
    set((state) => ({
      lineItems: [...state.lineItems, initialLineItem()]
    })),

  // add new item on selection
  addLineItem: (index, newItem) =>
    set((state) => {
      /**
       * always create a new array to update the existing state array, coz react/zustand does
       * shallow comparison hence the array reference remains the same, so creating new array creates new reference
       * where react/zustand notices change
       */
      const currLineItems = [...state.lineItems];

      const updatedItem = {
        ...newItem,
        amount: parseFloat((newItem.quantity * newItem.price).toFixed(2))
      };

      currLineItems[index] = { ...updatedItem };

      return {
        lineItems: currLineItems
      };
    }),

  // update on field change
  updateLineItems: (itemId, field, value) =>
    set((state) => {
      const updatedLineItems = state.lineItems.map((item) => {
        if (itemId !== item.id) return item;

        const updatedItem = {
          ...item,
          [field]: field === "quantity" || field === "price" ? Number(value) : value
        };

        if (["quantity", "price"].includes(field)) {
          return {
            ...updatedItem,
            amount: parseFloat((updatedItem.quantity * updatedItem.price).toFixed(2))
          };
        }
        return updatedItem;
      });

      return {
        lineItems: updatedLineItems
      };
    }),

  // delete a row
  deleteLineItem: (itemId) =>
    set((state) => {
      const updatedLineItems = state.lineItems.filter((item) => item.id !== itemId);
      return {
        lineItems: updatedLineItems
      };
    })
}));
