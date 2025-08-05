import { ElectronAPI } from "@electron-toolkit/preload";

declare global {
  interface Window {
    electron: ElectronAPI;
    productsApi: ProductsApi;
  }
}

interface ProductsApi {
  getAllProducts: () => Promise<any>;
  search: (query: string) => Promise<any>;
}
