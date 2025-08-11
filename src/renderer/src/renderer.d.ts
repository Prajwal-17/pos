import type { ElectronAPI } from "@electron-toolkit/preload";
import type { BillingApi, ProductsApi } from "src/shared/types";

declare global {
  interface Window {
    electron: ElectronAPI;
    productsApi: ProductsApi;
    billingApi: BillingApi;
  }
}
