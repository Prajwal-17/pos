// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import type { PrintingConfig } from "@shared/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PrintingSection } from "./PrintingSection";

const { useAppPreferencesMock } = vi.hoisted(() => ({
  useAppPreferencesMock: vi.fn()
}));

vi.mock("@/features/preferences/useAppPreferences", () => ({
  useAppPreferences: () => useAppPreferencesMock()
}));

vi.mock("../ThermalReceiptPreview", () => ({
  ThermalReceiptPreview: () => <div data-testid="thermal-receipt-preview" />
}));

const printing: PrintingConfig = {
  printerName: "POS-80-Series",
  extraFeedLines: 4,
  cutMode: "partial",
  showAddress: true,
  showPhone: true,
  showGstinOnSales: true,
  showCustomerName: true,
  showSavings: true,
  savingsThresholdPaisa: 0,
  showLedgerPaymentMode: true,
  showLedgerNotes: true,
  footerMessage: "Thank you. Visit again.",
  upiId: "shop@bank",
  upiPayeeName: "QuickCart Store",
  printUpiQrOnSales: true,
  printUpiQrOnEstimates: false,
  includeAmountInUpiQr: true
};

function TestQueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {children}
    </QueryClientProvider>
  );
}

beforeEach(() => {
  useAppPreferencesMock.mockReturnValue({
    config: { printing },
    defaults: undefined,
    isLoading: false,
    isError: false,
    isDefaultsError: false,
    refetch: vi.fn(),
    refetchDefaults: vi.fn(),
    isFetching: false,
    updateConfig: vi.fn(),
    resetSection: vi.fn(),
    isUpdating: false,
    isResetting: false
  });

  Object.defineProperty(window, "rawPrintApi", {
    configurable: true,
    value: {
      listPrinters: vi.fn().mockResolvedValue({ status: "success", data: [] }),
      printReceipt: vi.fn(),
      printLedger: vi.fn(),
      printReceiptWithLedger: vi.fn()
    }
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("PrintingSection categories", () => {
  it("shows one settings category at a time", async () => {
    const user = userEvent.setup();
    render(<PrintingSection />, { wrapper: TestQueryProvider });

    const tabList = screen.getByRole("tablist", { name: "Printing settings categories" });
    expect(tabList).toHaveClass("w-fit");
    expect(tabList).not.toHaveClass("w-full");
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(screen.queryByRole("tab", { name: "Print format" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Customer ledger" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Printer" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("heading", { name: "Printer" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Paper cut" })).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Blank lines at end" })).toHaveTextContent(
      "4 lines"
    );
    expect(screen.getByRole("combobox", { name: "Cut type" })).toHaveTextContent("Partial cut");
    expect(screen.queryByRole("heading", { name: "Bill details" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Bills" }));
    expect(screen.getByRole("heading", { name: "Bill details" })).toBeVisible();
    expect(screen.getByRole("switch", { name: "Show customer name" })).toBeVisible();
    expect(screen.getByRole("switch", { name: "Show savings" })).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Minimum savings" })).toHaveTextContent("Always");
    expect(screen.queryByRole("heading", { name: "Printer" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "UPI QR" }));
    expect(screen.getByRole("heading", { name: "UPI QR" })).toBeVisible();
    expect(screen.getByLabelText("UPI ID")).toBeVisible();
  });
});
