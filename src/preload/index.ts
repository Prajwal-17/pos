import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
import type {
  EstimatePayload,
  EstimatesApi,
  ProductsApi,
  SalePayload,
  SalesApi
} from "../shared/types";

const productsApi: ProductsApi = {
  getAllProducts: () => ipcRenderer.invoke("productsApi:getAllProducts"),
  search: (query, page, limit) => ipcRenderer.invoke("productsApi:search", query, page, limit)
};

const salesApi: SalesApi = {
  getNextInvoiceNo: () => ipcRenderer.invoke("salesApi:getNextInvoiceNo"),
  save: (payload: SalePayload) => ipcRenderer.invoke("salesApi:save", payload)
};
const estimatesApi: EstimatesApi = {
  getNextEstimateNo: () => ipcRenderer.invoke("estimatesApi:getNextEstimateNo"),
  save: (payload: EstimatePayload) => ipcRenderer.invoke("estimatesApi:save", payload)
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electronAPI", electronAPI);
    contextBridge.exposeInMainWorld("productsApi", productsApi);
    contextBridge.exposeInMainWorld("salesApi", salesApi);
    contextBridge.exposeInMainWorld("estimatesAp", estimatesApi);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.productsApi = productsApi;
  // @ts-ignore (define in dts)
  window.salesApi = salesApi;
  // @ts-ignore (define in dts)
  window.estimatesApi = estimatesApi;
}
