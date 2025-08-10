import { contextBridge } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
import { ipcRenderer } from "electron/renderer";

const productsApi = {
  getAllProducts: () => ipcRenderer.invoke("productsApi:getAllProducts"),
  search: (query: string) => ipcRenderer.invoke("productsApi:search", query)
};

const billingApi = {
  getNextInvoiceNo: () => ipcRenderer.invoke("billingApi:getNextInvoiceNo"),
  save: (obj: any) => ipcRenderer.invoke("billingApi:save", obj)
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
