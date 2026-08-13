import { apiClient } from "@/lib/apiClient";
import { filterValidLineItems } from "@/utils/renderer.utils";
import type { BillingSessionData } from "@/features/billing/store/billingSession.types";
import { useBillingSessionStore } from "@/features/billing/store/billingSession.store";
import type {
  AppPreferencesResponse,
  PrintingConfig,
  RawReceiptData,
  StoreProfile
} from "@shared/types";
import { buildReceiptAddressLines, calculateThermalSavings } from "@shared/utils/thermalReceipt";
import { rupeesToPaisa } from "@shared/utils/utils";
import { useCallback } from "react";

type ReceiptBuildMode = "print" | "preview";

function createRawReceiptData(
  session: BillingSessionData,
  profile: StoreProfile,
  printing: PrintingConfig,
  mode: ReceiptBuildMode
): RawReceiptData {
  const isPrintJob = mode === "print";
  if (isPrintJob && !session.transactionNo) {
    throw new Error("The bill has not received a transaction number yet.");
  }

  const validItems = filterValidLineItems(session.lineItems).filter((item) => !item.isDeleted);
  if (isPrintJob && validItems.length === 0) {
    throw new Error("Add at least one valid item before printing.");
  }

  const printUpiQr =
    session.billingType === "sale" ? printing.printUpiQrOnSales : printing.printUpiQrOnEstimates;
  const upiIsReady = Boolean(printing.upiId.trim() && printing.upiPayeeName.trim());
  if (isPrintJob && printUpiQr && !upiIsReady) {
    throw new Error("Enter a UPI ID and payee name in Printing settings.");
  }

  const items = validItems.map((item) => ({
    name: item.productSnapshot,
    quantity: item.quantity,
    unitPricePaisa: rupeesToPaisa(Number(item.price)),
    totalPaisa: item.totalPrice,
    mrpPaisa: item.mrp ?? undefined
  }));
  const totalPaisa = items.reduce((sum, item) => sum + item.totalPaisa, 0);
  const savingsPaisa = calculateThermalSavings(items);

  return {
    storeName: profile.storeName,
    addressLines: printing.showAddress ? buildReceiptAddressLines(profile) : [],
    phone: printing.showPhone && profile.phone.trim() ? profile.phone.trim() : undefined,
    gstin:
      session.billingType === "sale" && printing.showGstinOnSales && profile.gstin?.trim()
        ? profile.gstin.trim()
        : undefined,
    transactionType: session.billingType,
    transactionNo: session.transactionNo ?? 0,
    customerName: printing.showCustomerName ? session.customerName.trim() || "Walk-in" : "",
    dateTime: session.billingDate.toISOString(),
    items,
    subtotalPaisa: totalPaisa,
    totalPaisa,
    savingsPaisa:
      printing.showSavings && savingsPaisa > 0 && savingsPaisa >= printing.savingsThresholdPaisa
        ? savingsPaisa
        : undefined,
    extraFeedLines: printing.extraFeedLines,
    cutMode: printing.cutMode,
    footerMessage: printing.footerMessage.trim() || undefined,
    upi:
      printUpiQr && upiIsReady
        ? {
            id: printing.upiId.trim(),
            payeeName: printing.upiPayeeName.trim(),
            includeAmount: printing.includeAmountInUpiQr
          }
        : undefined
  };
}

export function buildRawReceiptData(
  session: BillingSessionData,
  profile: StoreProfile,
  printing: PrintingConfig
): RawReceiptData {
  return createRawReceiptData(session, profile, printing, "print");
}

export function buildRawReceiptPreviewData(
  session: BillingSessionData,
  profile: StoreProfile,
  printing: PrintingConfig
): RawReceiptData {
  return createRawReceiptData(session, profile, printing, "preview");
}

const useRawReceiptPrint = () => {
  const prepareReceipt = useCallback(
    async (tabId: string): Promise<{ receipt: RawReceiptData }> => {
      const [profile, preferences] = await Promise.all([
        apiClient.get<StoreProfile>("/api/store-profile"),
        apiClient.get<AppPreferencesResponse>("/api/app-preferences")
      ]);

      const session = useBillingSessionStore.getState().sessions[tabId];
      if (!session) throw new Error("The synchronized billing session is no longer available.");

      return {
        receipt: buildRawReceiptData(session, profile, preferences.config.printing)
      };
    },
    []
  );

  const printReceipt = useCallback(
    async (tabId: string): Promise<{ bytesWritten: number }> => {
      const { receipt } = await prepareReceipt(tabId);
      const response = await window.rawPrintApi.printReceipt(receipt);
      if (response.status === "error") throw new Error(response.error.message);
      return response.data;
    },
    [prepareReceipt]
  );

  return { prepareReceipt, printReceipt };
};

export default useRawReceiptPrint;
