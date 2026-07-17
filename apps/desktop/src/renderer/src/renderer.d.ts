import type { DialogApi, ExportApi, PrinterApi, ProductsApi } from "src/shared/types";

declare global {
  interface Window {
    productsApi: ProductsApi;
    dialogApi: DialogApi;
    exportApi: ExportApi;
    printerApi: PrinterApi;
    env: {
      API_URL: string;
    };
  }
}
