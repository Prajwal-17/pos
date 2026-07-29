export const RAW_PRINTER_NAME_STORAGE_KEY = "quickcart-raw-printer-name";
export const DEFAULT_RAW_PRINTER_NAME = "POS-80-Series";

export function getRawPrinterName(): string {
  return (
    window.localStorage.getItem(RAW_PRINTER_NAME_STORAGE_KEY)?.trim() || DEFAULT_RAW_PRINTER_NAME
  );
}
