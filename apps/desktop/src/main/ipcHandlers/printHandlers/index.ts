import { ipcMain } from "electron/main";
import type { ApiResponse, RawPrintResult, RawReceiptData } from "../../../shared/types";
import { buildEscPosReceipt, buildEscPosTestReceipt } from "./escpos";
import { sendRawToWindowsPrinter } from "./windowsRawPrinter";

function errorResponse(error: unknown): ApiResponse<RawPrintResult> {
  console.error("Raw print failed:", error);
  return {
    status: "error",
    error: {
      message: error instanceof Error ? error.message : "Raw print failed."
    }
  };
}

async function printPayload(
  printerName: string,
  payload: Buffer
): Promise<ApiResponse<RawPrintResult>> {
  try {
    const bytesWritten = await sendRawToWindowsPrinter(printerName, payload);
    return { status: "success", data: { bytesWritten } };
  } catch (error) {
    return errorResponse(error);
  }
}

export function printHandlers() {
  ipcMain.handle("printer:raw-test", (_event, printerName: string) =>
    printPayload(printerName, buildEscPosTestReceipt())
  );

  ipcMain.handle("printer:raw-receipt", (_event, printerName: string, receipt: RawReceiptData) =>
    printPayload(printerName, buildEscPosReceipt(receipt))
  );
}
