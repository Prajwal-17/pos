import { ipcMain } from "electron/main";
import type {
  ApiResponse,
  ImagePrintResult,
  RawPrintResult,
  RawReceiptData,
  ReceiptImageData
} from "../../../shared/types";
import { buildEscPosReceipt, buildEscPosTestReceipt } from "./escpos";
import { printReceiptImageOnWindows } from "./windowsImagePrinter";
import { sendRawToWindowsPrinter } from "./windowsRawPrinter";

function errorResponse<T>(error: unknown): ApiResponse<T> {
  console.error("Printer operation failed:", error);
  return {
    status: "error",
    error: {
      message: error instanceof Error ? error.message : "Printer operation failed."
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

async function printImage(
  printerName: string,
  image: ReceiptImageData
): Promise<ApiResponse<ImagePrintResult>> {
  try {
    const result = await printReceiptImageOnWindows(printerName, image);
    return { status: "success", data: result };
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

  ipcMain.handle("printer:image-receipt", (_event, printerName: string, image: ReceiptImageData) =>
    printImage(printerName, image)
  );
}
