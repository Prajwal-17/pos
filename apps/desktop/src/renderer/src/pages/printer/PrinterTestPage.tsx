import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_RAW_PRINTER_NAME,
  RAW_PRINTER_NAME_STORAGE_KEY
} from "@/features/printing/constants";
import { Barcode, Loader2, Printer, QrCode, Scissors, WrapText } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

const checks = [
  { icon: WrapText, label: "Text styles and wrapping" },
  { icon: QrCode, label: "Native QR code" },
  { icon: Barcode, label: "Code 128 barcode" },
  { icon: Scissors, label: "Feed and auto cut" }
];

const PrinterTestPage = () => {
  const [printerName, setPrinterName] = useState(
    () => window.localStorage.getItem(RAW_PRINTER_NAME_STORAGE_KEY) ?? DEFAULT_RAW_PRINTER_NAME
  );
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    const normalizedName = printerName.trim();
    if (!normalizedName) {
      toast.error("Enter the printer name shown in Windows Settings.");
      return;
    }

    window.localStorage.setItem(RAW_PRINTER_NAME_STORAGE_KEY, normalizedName);
    setIsPrinting(true);
    try {
      const result = await window.rawPrintApi.printTest(normalizedName);
      if (result.status === "error") {
        toast.error(result.error.message);
        return;
      }
      toast.success(`Sent ${result.data.bytesWritten} raw bytes to ${normalizedName}`);
    } catch (error) {
      console.error("Raw printer test failed:", error);
      toast.error("Could not start the raw printer test.");
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <main className="bg-background h-full min-h-0 overflow-y-auto p-3">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
        <header>
          <h1 className="text-foreground text-xl font-semibold tracking-tight">
            Thermal printer test
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Send a standard 80mm ESC/POS receipt directly through the Windows print spooler.
          </p>
        </header>

        <section className="border-frame bg-card rounded-(--radius-panel) border">
          <div className="border-b-frame border-b p-3">
            <label htmlFor="raw-printer-name" className="text-foreground text-sm font-semibold">
              Windows printer name
            </label>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Copy the name exactly as it appears under Windows Settings → Printers & scanners.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Input
                id="raw-printer-name"
                value={printerName}
                onChange={(event) => setPrinterName(event.target.value)}
                placeholder="POS-80-Series"
                autoComplete="off"
              />
              <Button onClick={handlePrint} disabled={isPrinting} className="sm:min-w-40">
                {isPrinting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Printer className="size-4" />
                )}
                {isPrinting ? "Sending…" : "Print test receipt"}
              </Button>
            </div>
          </div>

          <div className="bg-border grid gap-px sm:grid-cols-2">
            {checks.map(({ icon: Icon, label }) => (
              <div key={label} className="bg-card flex min-h-11 items-center gap-2 px-3 py-2">
                <Icon className="text-muted-foreground size-4" />
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <p className="text-muted-foreground text-xs">
          Raw mode is Windows-only and prints ASCII text for maximum printer compatibility. The
          saved printer name is also used by the Raw print button on the billing page.
        </p>
      </div>
    </main>
  );
};

export default PrinterTestPage;
