import { getRawPrinterName } from "@/features/printing/constants";
import { receiptElementToPng } from "@/features/printing/receiptToPng";
import { useBillingTabsStore } from "@/store/billing/billingTabsStore";
import { useReceiptRefStore } from "@/store/useReceiptRefStore";
import type { ApiResponse, ImagePrintResult } from "@shared/types";
import { useCallback } from "react";

const useImageReceiptPrint = () => {
  const printImageReceipt = useCallback(async (): Promise<ApiResponse<ImagePrintResult>> => {
    const activeTabId = useBillingTabsStore.getState().activeTabId;
    if (!activeTabId) {
      return { status: "error", error: { message: "No bill is ready to print." } };
    }

    const receiptRef = useReceiptRefStore.getState().getReceiptRef(activeTabId);
    if (!receiptRef?.current) {
      return {
        status: "error",
        error: { message: "Open the receipt preview before using image print." }
      };
    }

    const image = await receiptElementToPng(receiptRef.current);
    return window.rawPrintApi.printImage(getRawPrinterName(), image);
  }, []);

  return { printImageReceipt };
};

export default useImageReceiptPrint;
