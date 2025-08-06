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
  updateLineItems: (itemId: string, field: string, value: string | number) => void;
  addLineItem: () => void;
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

  addLineItem: () =>
    set((state) => ({
      lineItems: [...state.lineItems, initialLineItem()]
    })),

  updateLineItems: (itemId, field, value) =>
    set((state) => {
      const updatedLineItem = state.lineItems.map((item) => {
        if (itemId !== item.id) return item;
        const updatedItem = {
          ...item,
          [field]: value
        };
        return {
          updatedItem
        };
      });

      return {
        ...state,
        lineItems: updatedLineItem
      };
    }),

  deleteLineItem: (itemId) =>
    set((state) => {
      const updatedLineItems = state.lineItems.filter((item) => item.id !== itemId);
      return {
        ...state,
        lineItems: updatedLineItems
      };
    })
}));
