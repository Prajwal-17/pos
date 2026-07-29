import { getRawPrinterName } from "@/features/printing/constants";
import { apiClient } from "@/lib/apiClient";
import { useBillingSessionStore } from "@/store/billing/billingSessionStore";
import { useBillingTabsStore } from "@/store/billing/billingTabsStore";
import type { ApiResponse, RawPrintResult, RawReceiptData, StoreProfile } from "@shared/types";
import { TRANSACTION_TYPE } from "@shared/types";
import { rupeesToPaisa } from "@shared/utils/utils";
import { useCallback } from "react";

const useRawReceiptPrint = () => {
  const printRawReceipt = useCallback(async (): Promise<ApiResponse<RawPrintResult>> => {
    const activeTabId = useBillingTabsStore.getState().activeTabId;
    const session = activeTabId
      ? useBillingSessionStore.getState().sessions[activeTabId]
      : undefined;

    if (!session) {
      return { status: "error", error: { message: "No bill is ready to print." } };
    }

    const store = await apiClient.get<StoreProfile>("/api/store-profile");
    const items = session.lineItems
      .filter((item) => item.productSnapshot.trim() && !item.isDeleted)
      .map((item) => ({
        name: item.productSnapshot,
        quantity: item.quantity || "0",
        unitPricePaisa: rupeesToPaisa(Number(item.price || 0)),
        totalPaisa: item.totalPrice
      }));

    if (items.length === 0) {
      return { status: "error", error: { message: "Add at least one item before printing." } };
    }

    const totalPaisa = items.reduce((sum, item) => sum + item.totalPaisa, 0);
    const isSale = session.billingType === TRANSACTION_TYPE.SALE;
    const receipt: RawReceiptData = {
      storeName: store.storeName,
      addressLines: [
        store.addressLine1,
        store.addressLine2 ?? "",
        `${store.city}, ${store.state} ${store.pincode}`
      ].filter(Boolean),
      phone: store.phone,
      gstin: isSale ? (store.gstin ?? undefined) : undefined,
      transactionLabel: isSale ? "Invoice no" : "Estimate no",
      transactionNo: session.transactionNo?.toString() ?? "New",
      customerName:
        !session.customerName || session.customerName === "DEFAULT"
          ? "Walk-in"
          : session.customerName,
      dateTime: session.billingDate.toISOString(),
      items,
      subtotalPaisa: totalPaisa,
      totalPaisa,
      qrData: `QUICKCART|${isSale ? "SALE" : "ESTIMATE"}|${session.transactionNo ?? "NEW"}|${totalPaisa}`
    };

    return window.rawPrintApi.printReceipt(getRawPrinterName(), receipt);
  }, []);

  return { printRawReceipt };
};

export default useRawReceiptPrint;
