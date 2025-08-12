import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
import type { BillingApi, ProductsApi, SalePayload } from "../shared/types";

const productsApi: ProductsApi = {
  getAllProducts: () => ipcRenderer.invoke("productsApi:getAllProducts"),
  search: (query, page, limit) => ipcRenderer.invoke("productsApi:search", query, page, limit)
};

const billingApi: BillingApi = {
  getNextInvoiceNo: () => ipcRenderer.invoke("billingApi:getNextInvoiceNo"),
  save: (payload: SalePayload) => ipcRenderer.invoke("billingApi:save", payload)
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electronAPI", electronAPI);
    contextBridge.exposeInMainWorld("productsApi", productsApi);
    contextBridge.exposeInMainWorld("billingApi", billingApi);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.productsApi = productsApi;
}
