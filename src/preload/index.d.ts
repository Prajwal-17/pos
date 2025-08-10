import { ElectronAPI } from "@electron-toolkit/preload";

declare global {
  interface Window {
    electron: ElectronAPI;
    productsApi: ProductsApi;
    billingApi: BillingApi;
  }
}

interface ProductsApi {
  getAllProducts: () => Promise<any>;
  search: (query: string) => Promise<any>;
}

interface BillingApi {
  getNextInvoiceNo: () => Promise<any>;
  save: (obj: any) => Promise<any>;
}

interface TypeBilling {
  invoiceNo: string;
  customerName: stringjjs;
  customerContact;
  items: lineItems;
  totalAmount;
}
