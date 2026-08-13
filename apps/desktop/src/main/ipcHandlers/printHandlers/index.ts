import { ipcMain } from "electron/main";
import { listPrinters, printLedger, printReceipt, printReceiptWithLedger } from "./printOperations";

export function printHandlers() {
  ipcMain.handle("printer:list", (event) => listPrinters(event.sender));
  ipcMain.handle("printer:raw-receipt", (_event, receipt: unknown) => printReceipt(receipt));
  ipcMain.handle("printer:raw-ledger", (_event, statement: unknown) => printLedger(statement));
  ipcMain.handle(
    "printer:raw-receipt-with-ledger",
    (_event, receipt: unknown, statement: unknown) => printReceiptWithLedger(receipt, statement)
  );
}
