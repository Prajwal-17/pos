import { contextBridge } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
import { ipcRenderer } from "electron/renderer";

const productsApi = {
  getAllProducts: () => ipcRenderer.invoke("productsApi:getAllProducts"),
  search: (query: string) => ipcRenderer.invoke("productsApi:search", query)
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electronAPI", electronAPI);
    contextBridge.exposeInMainWorld("productsApi", productsApi);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.productsApi = productsApi;
}
