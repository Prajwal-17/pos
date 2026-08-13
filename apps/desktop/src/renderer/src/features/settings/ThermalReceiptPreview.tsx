import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { apiClient } from "@/lib/apiClient";
import type {
  PrintingConfig,
  RawLedgerStatementData,
  RawReceiptData,
  StoreProfile
} from "@shared/types";
import {
  buildThermalUpiUri,
  fitThermalText,
  formatThermalReceiptDate,
  receiptDocumentLabel,
  thermalItemLines,
  thermalLedgerEntryLines,
  THERMAL_RECEIPT_ITEM_WIDTHS,
  THERMAL_RECEIPT_LINE_WIDTH,
  wrapThermalText
} from "@shared/utils/thermalReceipt";
import { paisaToRupeeString } from "@shared/utils/utils";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ChevronDown, Loader2, ReceiptText, Scissors } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useMemo, useState } from "react";
import { buildThermalPreviewLedger, buildThermalPreviewReceipt } from "./thermalReceiptPreviewData";

type PreviewDocumentType = RawReceiptData["transactionType"] | "ledger";

function ReceiptLine({
  children,
  align = "left",
  bold = false,
  className = ""
}: {
  children?: string;
  align?: "left" | "center";
  bold?: boolean;
  className?: string;
}) {
  return (
    <div
      className={[
        "font-mono text-[clamp(9px,2.75cqw,12px)] leading-[1.65] tracking-[0.015em] whitespace-pre tabular-nums",
        align === "center" ? "text-center" : "text-left",
        bold ? "font-bold" : "font-medium",
        className
      ].join(" ")}
    >
      {children || "\u00a0"}
    </div>
  );
}

export function ThermalReceiptPaper({ receipt }: { receipt: RawReceiptData }) {
  const documentLabel = receiptDocumentLabel(receipt);
  const documentNumber = receipt.transactionNo > 0 ? String(receipt.transactionNo) : "New";
  const separator = "-".repeat(THERMAL_RECEIPT_LINE_WIDTH);
  const widths = THERMAL_RECEIPT_ITEM_WIDTHS;
  const itemHeader = [
    fitThermalText("#", widths.index),
    fitThermalText("ITEM", widths.name),
    fitThermalText("QTY", widths.quantity, "right"),
    fitThermalText("RATE", widths.rate, "right"),
    fitThermalText("AMT", widths.amount, "right")
  ].join("");
  const subtotalLine = `${fitThermalText("Subtotal", 39)}${fitThermalText(
    paisaToRupeeString(receipt.subtotalPaisa),
    9,
    "right"
  )}`;
  const savingsLine =
    receipt.savingsPaisa != null && receipt.savingsPaisa > 0
      ? "YOU SAVED Rs." + paisaToRupeeString(receipt.savingsPaisa)
      : undefined;
  const totalLine = `${fitThermalText("TOTAL", 30)}${fitThermalText(
    `Rs.${paisaToRupeeString(receipt.totalPaisa)}`,
    18,
    "right"
  )}`;
  const upiUri = buildThermalUpiUri(receipt);

  return (
    <div
      className="border-invoice-border bg-invoice-bg text-invoice-text [container-type:inline-size] w-full max-w-[420px] border shadow-sm"
      data-testid="thermal-receipt-paper"
      role="group"
      aria-label={`80 millimetre ${receipt.transactionType} receipt preview`}
    >
      <div className="px-4 pt-5">
        {wrapThermalText(receipt.storeName.toUpperCase(), THERMAL_RECEIPT_LINE_WIDTH / 2).map(
          (storeNameLine, index) => (
            <div
              key={`${storeNameLine}-${index}`}
              className="font-mono text-[clamp(18px,5.5cqw,24px)] leading-[1.3] font-extrabold tracking-[0.01em] break-words"
            >
              <span className="block text-center">{storeNameLine}</span>
            </div>
          )
        )}

        {receipt.addressLines
          .flatMap((addressLine) => wrapThermalText(addressLine, THERMAL_RECEIPT_LINE_WIDTH))
          .map((addressLine, index) => (
            <ReceiptLine key={`${addressLine}-${index}`} align="center">
              {addressLine}
            </ReceiptLine>
          ))}
        {receipt.phone ? (
          <ReceiptLine align="center">{`Phone: ${receipt.phone}`}</ReceiptLine>
        ) : null}
        {receipt.transactionType === "sale" && receipt.gstin ? (
          <ReceiptLine align="center">{`GSTIN: ${receipt.gstin}`}</ReceiptLine>
        ) : null}

        <ReceiptLine>{separator}</ReceiptLine>
        <ReceiptLine>{documentLabel + ": " + documentNumber}</ReceiptLine>
        <ReceiptLine>{`Date: ${formatThermalReceiptDate(receipt.dateTime)}`}</ReceiptLine>
        {receipt.customerName ? (
          <ReceiptLine>{"Customer: " + receipt.customerName}</ReceiptLine>
        ) : null}
        <ReceiptLine>{separator}</ReceiptLine>
        <ReceiptLine bold>{itemHeader}</ReceiptLine>
        <ReceiptLine>{separator}</ReceiptLine>

        {receipt.items.flatMap((item, itemIndex) =>
          thermalItemLines(itemIndex + 1, item).map((itemLine, lineIndex) => (
            <ReceiptLine key={`${itemIndex}-${lineIndex}`}>{itemLine}</ReceiptLine>
          ))
        )}

        <ReceiptLine>{separator}</ReceiptLine>
        <ReceiptLine>{subtotalLine}</ReceiptLine>
        <div className="flex h-8 items-center">
          <ReceiptLine bold className="w-full origin-center scale-y-[2]">
            {totalLine}
          </ReceiptLine>
        </div>
        {savingsLine ? (
          <>
            <ReceiptLine />
            <ReceiptLine align="center" bold>
              {savingsLine}
            </ReceiptLine>
          </>
        ) : null}

        {upiUri ? (
          <>
            <ReceiptLine />
            <div className="flex justify-center py-1.5">
              <QRCodeSVG
                value={upiUri}
                level="M"
                boostLevel={false}
                marginSize={4}
                size={164}
                bgColor="#ffffff"
                fgColor="#000000"
                title="Sample UPI payment QR"
              />
            </div>
            <ReceiptLine align="center">Scan to pay</ReceiptLine>
            <ReceiptLine align="center">{receipt.upi?.payeeName}</ReceiptLine>
          </>
        ) : null}

        {receipt.footerMessage ? (
          <>
            <ReceiptLine />
            {wrapThermalText(receipt.footerMessage, THERMAL_RECEIPT_LINE_WIDTH).map(
              (footerLine, index) => (
                <ReceiptLine key={`${footerLine}-${index}`} align="center" bold>
                  {footerLine}
                </ReceiptLine>
              )
            )}
          </>
        ) : null}

        <div
          aria-label={`${receipt.extraFeedLines} extra feed line${receipt.extraFeedLines === 1 ? "" : "s"}`}
          data-testid="thermal-receipt-feed"
        >
          {Array.from({ length: receipt.extraFeedLines }, (_, index) => (
            <ReceiptLine key={index} />
          ))}
        </div>
      </div>

      {receipt.cutMode !== "none" ? (
        <div
          className="border-invoice-border relative h-4 border-t border-dashed"
          aria-label={`${receipt.cutMode} cut`}
          data-testid="thermal-receipt-cut"
        >
          <Scissors className="bg-invoice-bg text-invoice-text-muted absolute -top-2.5 left-4 size-4 pr-1" />
        </div>
      ) : null}
    </div>
  );
}

function LedgerPaper({ statement }: { statement: RawLedgerStatementData }) {
  const separator = "-".repeat(THERMAL_RECEIPT_LINE_WIDTH);
  const totalAmountLine =
    fitThermalText("TOTAL AMOUNT", 32) +
    fitThermalText("Rs." + paisaToRupeeString(statement.closingBalancePaisa), 16, "right");

  return (
    <div
      className="border-invoice-border bg-invoice-bg text-invoice-text w-full max-w-[420px] border"
      data-testid="thermal-ledger-paper"
      role="group"
      aria-label="80 millimetre customer ledger preview"
    >
      <div className="px-5 pt-5">
        {wrapThermalText(statement.storeName.toUpperCase(), THERMAL_RECEIPT_LINE_WIDTH / 2).map(
          (storeNameLine, index) => (
            <div
              key={`${storeNameLine}-${index}`}
              className="font-mono text-2xl leading-8 font-bold tracking-normal break-words"
            >
              <span className="block text-center">{storeNameLine}</span>
            </div>
          )
        )}
        {statement.addressLines
          .flatMap((addressLine) => wrapThermalText(addressLine, THERMAL_RECEIPT_LINE_WIDTH))
          .map((addressLine, index) => (
            <ReceiptLine key={`${addressLine}-${index}`} align="center">
              {addressLine}
            </ReceiptLine>
          ))}
        {statement.phone ? (
          <ReceiptLine align="center">{`Phone: ${statement.phone}`}</ReceiptLine>
        ) : null}

        <ReceiptLine>{separator}</ReceiptLine>
        <ReceiptLine align="center" bold>
          ACCOUNTS
        </ReceiptLine>
        {wrapThermalText(`Customer: ${statement.customerName}`, THERMAL_RECEIPT_LINE_WIDTH).map(
          (customerLine, index) => (
            <ReceiptLine key={`${customerLine}-${index}`}>{customerLine}</ReceiptLine>
          )
        )}
        <ReceiptLine>{separator}</ReceiptLine>

        {statement.entries.flatMap((entry, entryIndex) =>
          thermalLedgerEntryLines(entry).map((entryLine, lineIndex) => (
            <ReceiptLine key={`${entryIndex}-${lineIndex}`}>{entryLine}</ReceiptLine>
          ))
        )}

        <ReceiptLine>{separator}</ReceiptLine>
        <ReceiptLine bold>{totalAmountLine}</ReceiptLine>

        {statement.footerMessage ? (
          <>
            <ReceiptLine />
            {wrapThermalText(statement.footerMessage, THERMAL_RECEIPT_LINE_WIDTH).map(
              (footerLine, index) => (
                <ReceiptLine key={`${footerLine}-${index}`} align="center" bold>
                  {footerLine}
                </ReceiptLine>
              )
            )}
          </>
        ) : null}

        <div
          aria-label={`${statement.extraFeedLines} extra feed line${statement.extraFeedLines === 1 ? "" : "s"}`}
          data-testid="thermal-ledger-feed"
        >
          {Array.from({ length: statement.extraFeedLines }, (_, index) => (
            <ReceiptLine key={index} />
          ))}
        </div>
      </div>

      {statement.cutMode !== "none" ? (
        <div
          className="border-invoice-border relative h-4 border-t border-dashed"
          aria-label={`${statement.cutMode} cut`}
          data-testid="thermal-ledger-cut"
        >
          <Scissors className="bg-invoice-bg text-invoice-text-muted absolute -top-2.5 left-4 size-4 pr-1" />
        </div>
      ) : null}
    </div>
  );
}

function ThermalReceiptPreviewContent({ printing }: { printing: PrintingConfig }) {
  const [documentType, setDocumentType] = useState<PreviewDocumentType>("sale");
  const {
    data: profile,
    isError,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ["storeProfile"],
    queryFn: () => apiClient.get<StoreProfile>("/api/store-profile")
  });

  const receipt = useMemo(
    () =>
      documentType === "ledger"
        ? undefined
        : buildThermalPreviewReceipt(profile, printing, documentType),
    [documentType, printing, profile]
  );
  const ledger = useMemo(() => buildThermalPreviewLedger(profile, printing), [printing, profile]);
  const qrIsEnabled =
    documentType === "sale"
      ? printing.printUpiQrOnSales
      : documentType === "estimate"
        ? printing.printUpiQrOnEstimates
        : false;
  const qrNeedsDetails = qrIsEnabled && (!printing.upiId.trim() || !printing.upiPayeeName.trim());

  return (
    <>
      <div className="bg-muted/40 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
        <span className="text-foreground text-sm font-medium">Document</span>
        <Select
          value={documentType}
          onValueChange={(value) => setDocumentType(value as PreviewDocumentType)}
        >
          <SelectTrigger aria-label="Preview document" className="h-8 w-44 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sale">Sale bill</SelectItem>
            <SelectItem value="estimate">Estimate bill</SelectItem>
            <SelectItem value="ledger">Customer ledger</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-muted flex min-h-80 justify-center p-3 sm:p-4">
        <div className="w-full max-w-[420px]">
          {receipt ? <ThermalReceiptPaper receipt={receipt} /> : <LedgerPaper statement={ledger} />}
        </div>
      </div>

      {isError || qrNeedsDetails ? (
        <footer className="border-border space-y-2 border-t px-4 py-3">
          {isError ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-muted-foreground text-xs">Using sample shop details.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isFetching}
                onClick={() => void refetch()}
              >
                {isFetching ? <Loader2 className="animate-spin" /> : null}
                Try Store Profile again
              </Button>
            </div>
          ) : null}
          {qrNeedsDetails ? (
            <div className="border-gold-accent-border bg-gold-accent-soft text-gold-accent-foreground flex gap-2 rounded-(--radius-control) border px-3 py-2 text-xs">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <p>Add a UPI ID and payee name to show the QR.</p>
            </div>
          ) : null}
        </footer>
      ) : null}
    </>
  );
}

export function ThermalReceiptPreview({ printing }: { printing: PrintingConfig }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section
      className="border-frame bg-card overflow-hidden rounded-(--radius-panel) border"
      aria-labelledby="thermal-preview-title"
    >
      <button
        type="button"
        className="hover:bg-muted/60 focus-visible:ring-ring flex w-full items-center justify-between gap-4 px-4 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
        aria-expanded={isOpen}
        aria-controls="thermal-preview-content"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="bg-muted text-foreground flex size-8 shrink-0 items-center justify-center rounded-(--radius-control)">
            <ReceiptText className="size-4" aria-hidden="true" />
          </span>
          <span id="thermal-preview-title" className="text-foreground text-sm font-semibold">
            Print preview
          </span>
        </span>
        <span className="text-muted-foreground flex shrink-0 items-center gap-2 text-xs font-medium">
          {isOpen ? "Hide" : "Show"}
          <ChevronDown
            className={
              isOpen ? "size-4 rotate-180 transition-transform" : "size-4 transition-transform"
            }
            aria-hidden="true"
          />
        </span>
      </button>
      {isOpen ? (
        <div id="thermal-preview-content">
          <ThermalReceiptPreviewContent printing={printing} />
        </div>
      ) : null}
    </section>
  );
}
