/*
THESIS: A printer capability bench where every physical behavior can be isolated, run, and recorded; it refuses a single opaque test receipt.
OWN-WORLD: QuickCart's compact ledger surfaces, framed sections, restrained brand blue, and tabular diagnostic values.
STORY: Choose the exact Windows queue, run one command or bitmap transport, compare the paper, and retain the result in a session log.
FIRST VIEWPORT: Device strip first, capability matrix on the left, configurable workbench on the right, with one full-diagnostic action always visible.
FORM: Capability matrix, ranked structure 6, surface seed 9c4db809.
*/
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_RAW_PRINTER_NAME,
  RAW_PRINTER_NAME_STORAGE_KEY
} from "@/features/printing/constants";
import {
  imageFileToReceiptPng,
  receiptElementToPng,
  receiptImageToMonochromeRaster
} from "@/features/printing/receiptToPng";
import { cn } from "@/lib/utils";
import type {
  EscPosPlaygroundJob,
  EscPosPresetId,
  EscPosTextOptions,
  ImagePrintResult,
  RawPrintResult,
  ReceiptImageData,
  SystemPrinterInfo
} from "@shared/types";
import {
  AlignHorizontalDistributeCenter,
  Barcode,
  Braces,
  CheckCircle2,
  CircleOff,
  Clock3,
  FileImage,
  Image as ImageIcon,
  Languages,
  Loader2,
  Printer,
  QrCode,
  RefreshCw,
  RotateCcw,
  Ruler,
  Scissors,
  SlidersHorizontal,
  Sparkles,
  TextCursorInput,
  Trash2,
  Type,
  Upload,
  WrapText,
  XCircle
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import toast from "react-hot-toast";

type CapabilityTest = {
  id: string;
  preset: EscPosPresetId;
  icon: LucideIcon;
  title: string;
  description: string;
  expected: string;
};

type JobLog = {
  id: number;
  testId: string;
  label: string;
  status: "queued" | "failed";
  detail: string;
  durationMs: number;
  createdAt: Date;
};

type CutMode = "none" | "full" | "partial";
type BitmapTransport = "driver" | "gs-v-0" | "esc-star" | "gs-l";

const capabilityTests: CapabilityTest[] = [
  {
    id: "font-styles",
    preset: "font-styles",
    icon: Type,
    title: "Device fonts and styles",
    description: "Font A/B, emphasized, double-strike, underline, reverse and upside-down text.",
    expected: "Every label should be distinct and readable."
  },
  {
    id: "alignment",
    preset: "alignment",
    icon: AlignHorizontalDistributeCenter,
    title: "Alignment",
    description: "Firmware left, center and right justification across the printable width.",
    expected: "L and R land near the two printable edges."
  },
  {
    id: "character-size",
    preset: "character-size",
    icon: Ruler,
    title: "Character size",
    description: "Normal, double-height, double-width, 2×2 and 3×3 device characters.",
    expected: "Each sample grows without clipping."
  },
  {
    id: "spacing",
    preset: "spacing",
    icon: SlidersHorizontal,
    title: "Line and character spacing",
    description: "Tight, default and loose line pitch plus extra character spacing.",
    expected: "Pitch changes are visible and reset at the end."
  },
  {
    id: "wrapping",
    preset: "wrapping",
    icon: WrapText,
    title: "48-column layout",
    description: "Word wrapping, full-width rule and aligned item/quantity/amount columns.",
    expected: "No line exceeds the 48-column grid."
  },
  {
    id: "codepage",
    preset: "codepage",
    icon: Languages,
    title: "Codepage byte chart",
    description:
      "Extended bytes 80–FF under ESC t tables 0, 16, 17 and 18; this is not Unicode shaping.",
    expected: "Identify supported currency glyphs; use Bitmap lab for Kannada."
  },
  {
    id: "native-qr",
    preset: "native-qr",
    icon: QrCode,
    title: "Native QR",
    description: "Firmware-generated QR with a sample UPI intent payload.",
    expected: "The code scans and preserves the complete payload."
  },
  {
    id: "code128",
    preset: "code128",
    icon: Barcode,
    title: "Code 128",
    description: "Code Set B barcode with human-readable text below the bars.",
    expected: "QC-00042 scans without manual correction."
  },
  {
    id: "feed-cut",
    preset: "feed-cut",
    icon: Scissors,
    title: "Feed and partial cut",
    description: "Four firmware feed lines followed by the configured partial-cut command.",
    expected: "The final text clears the cutter before cutting."
  }
];

const bitmapTransports: Array<{
  value: BitmapTransport;
  label: string;
  command: string;
  description: string;
}> = [
  {
    value: "driver",
    label: "Windows driver",
    command: "GDI PNG",
    description: "System.Drawing sends a 576px PNG; a second RAW job feeds and cuts."
  },
  {
    value: "gs-v-0",
    label: "Raw GS v 0",
    command: "1D 76 30",
    description: "Legacy row-major raster command, divided into 256-row chunks."
  },
  {
    value: "esc-star",
    label: "Raw ESC * 33",
    command: "1B 2A 21",
    description: "Legacy 24-dot double-density column bands."
  },
  {
    value: "gs-l",
    label: "Raw GS ( L",
    command: "1D 28 4C",
    description: "Newer buffered raster graphics command followed by Function 50 print."
  }
];

type TextComposerState = Omit<EscPosTextOptions, "feedLines" | "cut">;

const defaultTextOptions: TextComposerState = {
  text: "QuickCart custom text test. A deliberately long sentence verifies word wrapping at the selected device-font width.",
  font: "a",
  align: "left",
  bold: false,
  underline: 0 as 0 | 1 | 2,
  reverse: false,
  widthScale: 1,
  heightScale: 1,
  lineSpacing: null as number | null,
  characterSpacing: 0
};

function timestamp(value: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  }).format(value);
}

function BitmapSampleReceipt({ receiptRef }: { receiptRef: RefObject<HTMLDivElement | null> }) {
  return (
    <div
      ref={receiptRef}
      className="w-[72mm] bg-white px-[3mm] py-[3mm] text-black"
      style={{ fontFamily: '"Nirmala UI", "Tunga", Arial, sans-serif' }}
    >
      <div className="border-b border-black pb-2 text-center">
        <div className="text-2xl leading-tight font-bold">QUICKCART BITMAP LAB</div>
        <div className="mt-1 text-sm font-semibold">ಕ್ವಿಕ್‌ಕಾರ್ಟ್ ಮುದ್ರಣ ಪರೀಕ್ಷೆ</div>
        <div className="mt-1 text-xs">576 dots · 203 DPI · one-bit threshold</div>
      </div>

      <div className="grid grid-cols-2 gap-x-3 border-b border-black py-2 text-xs">
        <span>Invoice: TEST-0042</span>
        <span className="text-right">30/07/2026</span>
        <span>English + Kannada</span>
        <span className="text-right">Rs. 493.50</span>
      </div>

      <div className="py-2 text-xs leading-[1.35]">
        <div className="font-bold">Stroke and shaping samples</div>
        <div>Regular text: The quick brown fox 0123456789</div>
        <div className="font-semibold">Semibold text: TOTAL Rs. 493.50</div>
        <div className="text-base font-bold">ಧನ್ಯವಾದಗಳು · ಮತ್ತೆ ಬನ್ನಿ</div>
      </div>

      <div className="border-y border-dashed border-black py-2">
        <div className="mb-1 text-xs font-semibold">LINE WEIGHTS</div>
        <div className="h-px bg-black" />
        <div className="mt-1 h-0.5 bg-black" />
        <div className="mt-1 h-1 bg-black" />
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-x-3 border-b border-black py-2 text-xs">
        <span>Premium Basmati Rice × 2</span>
        <span className="font-semibold tabular-nums">290.00</span>
        <span>Coca-Cola 500ml × 3</span>
        <span className="font-semibold tabular-nums">120.00</span>
        <span>Margherita Pizza × 1</span>
        <span className="font-semibold tabular-nums">83.50</span>
      </div>

      <div className="flex items-end justify-between py-2">
        <div className="text-xs leading-tight">
          <div>Threshold target</div>
          <div>Solid black / white</div>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold">TOTAL</div>
          <div className="text-xl leading-none font-bold tabular-nums">Rs. 493.50</div>
        </div>
      </div>

      <div className="border-t border-black pt-2 text-center text-xs font-semibold">
        Thank you · ಧನ್ಯವಾದಗಳು
      </div>
    </div>
  );
}

const PrinterTestPage = () => {
  const [printerName, setPrinterName] = useState(
    () => window.localStorage.getItem(RAW_PRINTER_NAME_STORAGE_KEY) ?? DEFAULT_RAW_PRINTER_NAME
  );
  const [printers, setPrinters] = useState<SystemPrinterInfo[]>([]);
  const [printerError, setPrinterError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeJob, setActiveJob] = useState<string | null>(null);
  const [logs, setLogs] = useState<JobLog[]>([]);
  const logIdRef = useRef(0);

  const [feedLines, setFeedLines] = useState(4);
  const [cutMode, setCutMode] = useState<CutMode>("partial");
  const [textOptions, setTextOptions] = useState(defaultTextOptions);
  const [qrPayload, setQrPayload] = useState(
    "upi://pay?pa=quickcart@upi&pn=QuickCart&am=493.50&cu=INR&tn=TEST-0042"
  );
  const [qrSize, setQrSize] = useState(6);
  const [qrCorrection, setQrCorrection] = useState<"l" | "m" | "q" | "h">("m");
  const [barcodePayload, setBarcodePayload] = useState("QC-00042");
  const [barcodeWidth, setBarcodeWidth] = useState(2);
  const [barcodeHeight, setBarcodeHeight] = useState(72);

  const bitmapReceiptRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [bitmapSource, setBitmapSource] = useState<"sample" | "upload">("sample");
  const [bitmapFile, setBitmapFile] = useState<File | null>(null);
  const [bitmapTransport, setBitmapTransport] = useState<BitmapTransport>("driver");
  const [threshold, setThreshold] = useState(210);
  const [preparedImage, setPreparedImage] = useState<ReceiptImageData | null>(null);
  const [preparedThreshold, setPreparedThreshold] = useState<number | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);

  const selectedPrinter = useMemo(
    () => printers.find((printer) => printer.name === printerName),
    [printerName, printers]
  );

  const latestStatus = useMemo(() => {
    const statuses = new Map<string, JobLog["status"]>();
    for (const log of logs) {
      if (!statuses.has(log.testId)) statuses.set(log.testId, log.status);
    }
    return statuses;
  }, [logs]);

  const appendLog = useCallback((entry: Omit<JobLog, "id" | "createdAt">) => {
    logIdRef.current += 1;
    setLogs((current) =>
      [{ ...entry, id: logIdRef.current, createdAt: new Date() }, ...current].slice(0, 30)
    );
  }, []);

  const refreshPrinters = useCallback(async () => {
    setIsRefreshing(true);
    setPrinterError(null);
    try {
      const result = await window.rawPrintApi.listPrinters();
      if (result.status === "error") {
        setPrinterError(result.error.message);
        return;
      }

      setPrinters(result.data);
      const savedName = window.localStorage.getItem(RAW_PRINTER_NAME_STORAGE_KEY)?.trim();
      const savedExists = savedName && result.data.some((printer) => printer.name === savedName);
      if (!savedExists) {
        const preferred = result.data.find((printer) =>
          /pos|thermal|receipt|everycom/i.test(printer.name)
        );
        if (preferred) setPrinterName(preferred.name);
      }
    } catch (error) {
      setPrinterError(error instanceof Error ? error.message : "Could not enumerate printers.");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refreshPrinters();
  }, [refreshPrinters]);

  useEffect(() => {
    if (printerName.trim()) {
      window.localStorage.setItem(RAW_PRINTER_NAME_STORAGE_KEY, printerName.trim());
    }
  }, [printerName]);

  const normalizedPrinterName = () => {
    const normalized = printerName.trim();
    if (!normalized) throw new Error("Enter or select the Windows printer name first.");
    return normalized;
  };

  const runRawJob = async (testId: string, label: string, job: EscPosPlaygroundJob) => {
    const startedAt = performance.now();
    setActiveJob(testId);
    try {
      const result = await window.rawPrintApi.printPlayground(normalizedPrinterName(), job);
      const durationMs = Math.round(performance.now() - startedAt);
      if (result.status === "error") {
        appendLog({
          testId,
          label,
          status: "failed",
          detail: result.error.message,
          durationMs
        });
        toast.error(result.error.message);
        return;
      }

      appendLog({
        testId,
        label,
        status: "queued",
        detail: `${result.data.bytesWritten.toLocaleString("en-IN")} RAW bytes accepted by Windows`,
        durationMs
      });
      toast.success(`${label} queued`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not start the print test.";
      appendLog({
        testId,
        label,
        status: "failed",
        detail: message,
        durationMs: Math.round(performance.now() - startedAt)
      });
      toast.error(message);
    } finally {
      setActiveJob(null);
    }
  };

  const prepareBitmap = async (): Promise<ReceiptImageData> => {
    setIsPreparing(true);
    try {
      const image =
        bitmapSource === "upload"
          ? bitmapFile
            ? await imageFileToReceiptPng(bitmapFile, { threshold })
            : (() => {
                throw new Error("Choose an image file before preparing the bitmap.");
              })()
          : bitmapReceiptRef.current
            ? await receiptElementToPng(bitmapReceiptRef.current, { threshold })
            : (() => {
                throw new Error("The sample receipt is not ready.");
              })();
      setPreparedImage(image);
      setPreparedThreshold(threshold);
      toast.success(`Prepared ${image.width} × ${image.height} monochrome bitmap`);
      return image;
    } finally {
      setIsPreparing(false);
    }
  };

  const printBitmap = async () => {
    const testId = `bitmap-${bitmapTransport}`;
    const transport = bitmapTransports.find((item) => item.value === bitmapTransport)!;
    const startedAt = performance.now();
    setActiveJob(testId);

    try {
      const image =
        preparedImage && preparedThreshold === threshold ? preparedImage : await prepareBitmap();
      let result:
        | { status: "success"; data: RawPrintResult | ImagePrintResult }
        | { status: "error"; error: { message: string } };
      let detail: string;

      if (bitmapTransport === "driver") {
        result = await window.rawPrintApi.printImage(normalizedPrinterName(), image);
        detail = `${image.width} × ${image.height} PNG submitted through the Windows driver`;
      } else {
        const raster = await receiptImageToMonochromeRaster(image);
        result = await window.rawPrintApi.printPlayground(normalizedPrinterName(), {
          kind: "raster",
          command: bitmapTransport,
          image: raster,
          feedLines,
          cut: cutMode
        });
        detail = `${raster.width} × ${raster.height}, ${raster.stride.toLocaleString("en-IN")} bytes per row`;
      }

      const durationMs = Math.round(performance.now() - startedAt);
      if (result.status === "error") {
        appendLog({
          testId,
          label: transport.label,
          status: "failed",
          detail: result.error.message,
          durationMs
        });
        toast.error(result.error.message);
        return;
      }

      appendLog({
        testId,
        label: transport.label,
        status: "queued",
        detail,
        durationMs
      });
      toast.success(`${transport.label} bitmap queued`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bitmap printing failed.";
      appendLog({
        testId,
        label: transport.label,
        status: "failed",
        detail: message,
        durationMs: Math.round(performance.now() - startedAt)
      });
      toast.error(message);
    } finally {
      setActiveJob(null);
    }
  };

  const handleImageFile = (file: File | undefined) => {
    if (!file) return;
    setBitmapFile(file);
    setBitmapSource("upload");
    setPreparedImage(null);
    setPreparedThreshold(null);
  };

  const resetBitmap = () => {
    setBitmapSource("sample");
    setBitmapFile(null);
    setPreparedImage(null);
    setPreparedThreshold(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <main className="bg-background h-full min-h-0 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-3 p-3">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-page-title text-foreground">Printing playground</h1>
              <Badge variant="outline" className="border-warning text-warning">
                Prototype only
              </Badge>
              <Badge variant="secondary">Everycom 80mm</Badge>
            </div>
            <p className="text-muted-foreground mt-1 max-w-3xl text-sm">
              Isolate ESC/POS commands and bitmap transports before choosing the production receipt
              path. “Queued” means Windows accepted the job; inspect the paper to confirm support.
            </p>
          </div>
          <Button
            onClick={() =>
              void runRawJob("full-diagnostic", "Full diagnostic receipt", {
                kind: "preset",
                preset: "full-diagnostic"
              })
            }
            disabled={activeJob !== null}
            className="min-w-44"
          >
            {activeJob === "full-diagnostic" ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {activeJob === "full-diagnostic" ? "Sending…" : "Run full diagnostic"}
          </Button>
        </header>

        <section className="border-frame bg-card rounded-(--radius-panel) border">
          <div className="grid gap-3 p-3 min-[980px]:grid-cols-[minmax(18rem,1fr)_auto_minmax(16rem,0.6fr)] min-[980px]:items-end">
            <div className="min-w-0">
              <Label htmlFor="printer-name">Windows printer queue</Label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  id="printer-name"
                  list="system-printer-options"
                  value={printerName}
                  onChange={(event) => setPrinterName(event.target.value)}
                  placeholder={DEFAULT_RAW_PRINTER_NAME}
                  autoComplete="off"
                />
                <datalist id="system-printer-options">
                  {printers.map((printer) => (
                    <option key={printer.name} value={printer.name}>
                      {printer.displayName}
                    </option>
                  ))}
                </datalist>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => void refreshPrinters()}
                  disabled={isRefreshing}
                  aria-label="Refresh Windows printers"
                  title="Refresh Windows printers"
                >
                  <RefreshCw className={cn(isRefreshing && "animate-spin")} />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 min-[980px]:pb-1">
              <Badge variant={selectedPrinter ? "default" : "outline"}>
                {selectedPrinter ? <CheckCircle2 /> : <CircleOff />}
                {selectedPrinter ? "Queue found" : "Manual name"}
              </Badge>
            </div>

            <div className="min-w-0 min-[980px]:border-l min-[980px]:pl-3">
              <div className="text-xs font-semibold">Queue details</div>
              <div className="text-muted-foreground mt-1 truncate text-xs">
                {printerError
                  ? printerError
                  : selectedPrinter
                    ? selectedPrinter.description || selectedPrinter.displayName
                    : `${printers.length} Windows queue${printers.length === 1 ? "" : "s"} discovered`}
              </div>
            </div>
          </div>
        </section>

        <Tabs defaultValue="commands" className="min-h-0 gap-3">
          <TabsList>
            <TabsTrigger value="commands">
              <Braces /> Raw commands
            </TabsTrigger>
            <TabsTrigger value="bitmap">
              <ImageIcon /> Bitmap lab
            </TabsTrigger>
            <TabsTrigger value="history">
              <Clock3 /> Session log
              {logs.length > 0 && <span className="tabular-nums">({logs.length})</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="commands">
            <div className="grid items-start gap-3 min-[1180px]:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
              <section className="border-frame bg-card rounded-(--radius-panel) border">
                <div className="border-b-frame flex items-start justify-between gap-3 border-b p-3">
                  <div>
                    <h2 className="font-semibold">Capability matrix</h2>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      Run one narrow test at a time and mark the paper before changing settings.
                    </p>
                  </div>
                  <Badge variant="outline">9 isolated jobs</Badge>
                </div>

                <div className="divide-y">
                  {capabilityTests.map((test) => {
                    const Icon = test.icon;
                    const status = latestStatus.get(test.id);
                    const isActive = activeJob === test.id;
                    return (
                      <div
                        key={test.id}
                        className="grid gap-2 px-3 py-2.5 sm:grid-cols-[2rem_minmax(0,1fr)_auto] sm:items-center"
                      >
                        <div className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-(--radius-control)">
                          <Icon className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold">{test.title}</span>
                            {status === "queued" && (
                              <span className="text-success inline-flex items-center gap-1 text-xs">
                                <CheckCircle2 className="size-3.5" /> Queued
                              </span>
                            )}
                            {status === "failed" && (
                              <span className="text-destructive inline-flex items-center gap-1 text-xs">
                                <XCircle className="size-3.5" /> Failed
                              </span>
                            )}
                          </div>
                          <p className="text-muted-foreground mt-0.5 text-xs">{test.description}</p>
                          <p className="text-muted-foreground mt-1 text-xs">
                            Expected: {test.expected}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-self-start sm:justify-self-end"
                          disabled={activeJob !== null}
                          onClick={() =>
                            void runRawJob(test.id, test.title, {
                              kind: "preset",
                              preset: test.preset
                            })
                          }
                        >
                          {isActive ? <Loader2 className="animate-spin" /> : <Printer />}
                          {isActive ? "Sending…" : "Run"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="border-frame bg-card rounded-(--radius-panel) border min-[1180px]:sticky min-[1180px]:top-3">
                <div className="border-b-frame border-b p-3">
                  <h2 className="font-semibold">Custom job workbench</h2>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    Tune one payload without changing the predefined compatibility tests.
                  </p>
                </div>

                <Tabs defaultValue="text" className="gap-0">
                  <div className="border-b px-3 py-2">
                    <TabsList className="w-full">
                      <TabsTrigger value="text">Text</TabsTrigger>
                      <TabsTrigger value="qr">QR</TabsTrigger>
                      <TabsTrigger value="barcode">Barcode</TabsTrigger>
                      <TabsTrigger value="paper">Paper</TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="text" className="p-3">
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="custom-text">Text payload</Label>
                        <Textarea
                          id="custom-text"
                          value={textOptions.text}
                          onChange={(event) =>
                            setTextOptions((current) => ({ ...current, text: event.target.value }))
                          }
                          className="mt-1.5 min-h-24 resize-y"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Device font</Label>
                          <Select
                            value={textOptions.font}
                            onValueChange={(font: "a" | "b") =>
                              setTextOptions((current) => ({ ...current, font }))
                            }
                          >
                            <SelectTrigger className="mt-1.5 w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="a">Font A · 48 cols</SelectItem>
                              <SelectItem value="b">Font B · 64 cols</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Alignment</Label>
                          <Select
                            value={textOptions.align}
                            onValueChange={(align: "left" | "center" | "right") =>
                              setTextOptions((current) => ({ ...current, align }))
                            }
                          >
                            <SelectTrigger className="mt-1.5 w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="left">Left</SelectItem>
                              <SelectItem value="center">Center</SelectItem>
                              <SelectItem value="right">Right</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Width scale</Label>
                          <Select
                            value={String(textOptions.widthScale)}
                            onValueChange={(value) =>
                              setTextOptions((current) => ({
                                ...current,
                                widthScale: Number(value)
                              }))
                            }
                          >
                            <SelectTrigger className="mt-1.5 w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4].map((value) => (
                                <SelectItem key={value} value={String(value)}>
                                  {value}×
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Height scale</Label>
                          <Select
                            value={String(textOptions.heightScale)}
                            onValueChange={(value) =>
                              setTextOptions((current) => ({
                                ...current,
                                heightScale: Number(value)
                              }))
                            }
                          >
                            <SelectTrigger className="mt-1.5 w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4].map((value) => (
                                <SelectItem key={value} value={String(value)}>
                                  {value}×
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Underline</Label>
                          <Select
                            value={String(textOptions.underline)}
                            onValueChange={(value) =>
                              setTextOptions((current) => ({
                                ...current,
                                underline: Number(value) as 0 | 1 | 2
                              }))
                            }
                          >
                            <SelectTrigger className="mt-1.5 w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Off</SelectItem>
                              <SelectItem value="1">One dot</SelectItem>
                              <SelectItem value="2">Two dot</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="line-spacing">Line spacing</Label>
                          <Input
                            id="line-spacing"
                            type="number"
                            min={0}
                            max={255}
                            placeholder="Default"
                            value={textOptions.lineSpacing ?? ""}
                            onChange={(event) =>
                              setTextOptions((current) => ({
                                ...current,
                                lineSpacing:
                                  event.target.value === "" ? null : Number(event.target.value)
                              }))
                            }
                            className="mt-1.5"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <label className="border-border flex h-9 items-center justify-between rounded-(--radius-control) border px-3 text-sm">
                          Bold
                          <Switch
                            checked={textOptions.bold}
                            onCheckedChange={(bold) =>
                              setTextOptions((current) => ({ ...current, bold }))
                            }
                          />
                        </label>
                        <label className="border-border flex h-9 items-center justify-between rounded-(--radius-control) border px-3 text-sm">
                          Reverse
                          <Switch
                            checked={textOptions.reverse}
                            onCheckedChange={(reverse) =>
                              setTextOptions((current) => ({ ...current, reverse }))
                            }
                          />
                        </label>
                      </div>

                      <Button
                        className="w-full"
                        disabled={activeJob !== null || !textOptions.text.trim()}
                        onClick={() =>
                          void runRawJob("custom-text", "Custom text", {
                            kind: "text",
                            options: {
                              ...textOptions,
                              feedLines,
                              cut: cutMode
                            }
                          })
                        }
                      >
                        {activeJob === "custom-text" ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <TextCursorInput />
                        )}
                        {activeJob === "custom-text" ? "Sending…" : "Print custom text"}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="qr" className="p-3">
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="qr-payload">Bank / UPI QR payload</Label>
                        <Textarea
                          id="qr-payload"
                          value={qrPayload}
                          onChange={(event) => setQrPayload(event.target.value)}
                          className="mt-1.5 min-h-28 resize-y font-mono text-xs"
                        />
                        <p className="text-muted-foreground mt-1 text-xs">
                          Paste the exact payload for any shop scanner profile; this prototype keeps
                          it session-only.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Module size</Label>
                          <Select
                            value={String(qrSize)}
                            onValueChange={(value) => setQrSize(Number(value))}
                          >
                            <SelectTrigger className="mt-1.5 w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[3, 4, 5, 6, 7, 8].map((value) => (
                                <SelectItem key={value} value={String(value)}>
                                  {value} dots
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Error correction</Label>
                          <Select
                            value={qrCorrection}
                            onValueChange={(value: "l" | "m" | "q" | "h") => setQrCorrection(value)}
                          >
                            <SelectTrigger className="mt-1.5 w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="l">L · 7%</SelectItem>
                              <SelectItem value="m">M · 15%</SelectItem>
                              <SelectItem value="q">Q · 25%</SelectItem>
                              <SelectItem value="h">H · 30%</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button
                        className="w-full"
                        disabled={activeJob !== null || !qrPayload.trim()}
                        onClick={() =>
                          void runRawJob("custom-qr", "Custom native QR", {
                            kind: "qr",
                            payload: qrPayload,
                            moduleSize: qrSize,
                            errorCorrection: qrCorrection,
                            feedLines,
                            cut: cutMode
                          })
                        }
                      >
                        {activeJob === "custom-qr" ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <QrCode />
                        )}
                        {activeJob === "custom-qr" ? "Sending…" : "Print native QR"}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="barcode" className="p-3">
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="barcode-payload">Code 128 payload</Label>
                        <Input
                          id="barcode-payload"
                          value={barcodePayload}
                          onChange={(event) => setBarcodePayload(event.target.value)}
                          className="mt-1.5 font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Bar width</Label>
                          <Select
                            value={String(barcodeWidth)}
                            onValueChange={(value) => setBarcodeWidth(Number(value))}
                          >
                            <SelectTrigger className="mt-1.5 w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[2, 3, 4, 5, 6].map((value) => (
                                <SelectItem key={value} value={String(value)}>
                                  {value} dots
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="barcode-height">Height</Label>
                          <Input
                            id="barcode-height"
                            type="number"
                            min={1}
                            max={255}
                            value={barcodeHeight}
                            onChange={(event) => setBarcodeHeight(Number(event.target.value))}
                            className="mt-1.5"
                          />
                        </div>
                      </div>
                      <Button
                        className="w-full"
                        disabled={activeJob !== null || !barcodePayload.trim()}
                        onClick={() =>
                          void runRawJob("custom-barcode", "Custom Code 128", {
                            kind: "barcode",
                            payload: barcodePayload,
                            width: barcodeWidth,
                            height: barcodeHeight,
                            feedLines,
                            cut: cutMode
                          })
                        }
                      >
                        {activeJob === "custom-barcode" ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Barcode />
                        )}
                        {activeJob === "custom-barcode" ? "Sending…" : "Print Code 128"}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="paper" className="p-3">
                    <div className="space-y-3">
                      <div className="border-warning bg-muted rounded-(--radius-control) border p-3">
                        <div className="text-sm font-semibold">Mechanical paper test</div>
                        <p className="text-muted-foreground mt-1 text-xs">
                          This intentionally feeds and may cut paper. Confirm the cutter is clear.
                        </p>
                      </div>
                      <Button
                        className="w-full"
                        disabled={activeJob !== null}
                        onClick={() =>
                          void runRawJob("custom-paper", "Custom feed and cut", {
                            kind: "paper",
                            feedLines,
                            cut: cutMode
                          })
                        }
                      >
                        {activeJob === "custom-paper" ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Scissors />
                        )}
                        {activeJob === "custom-paper" ? "Sending…" : "Run paper test"}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="border-t-frame grid grid-cols-2 gap-2 border-t p-3">
                  <div>
                    <Label htmlFor="feed-lines">Feed lines</Label>
                    <Input
                      id="feed-lines"
                      type="number"
                      min={0}
                      max={20}
                      value={feedLines}
                      onChange={(event) => setFeedLines(Number(event.target.value))}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Cut after job</Label>
                    <Select value={cutMode} onValueChange={(value: CutMode) => setCutMode(value)}>
                      <SelectTrigger className="mt-1.5 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="partial">Partial cut</SelectItem>
                        <SelectItem value="full">Full cut</SelectItem>
                        <SelectItem value="none">No cut</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>
            </div>
          </TabsContent>

          <TabsContent value="bitmap">
            <div className="grid items-start gap-3 min-[1180px]:grid-cols-[minmax(22rem,0.8fr)_minmax(24rem,1.2fr)]">
              <section className="border-frame bg-card rounded-(--radius-panel) border">
                <div className="border-b-frame flex flex-wrap items-start justify-between gap-2 border-b p-3">
                  <div>
                    <h2 className="font-semibold">Monochrome source</h2>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      Render the bilingual sample or normalize an uploaded image to exactly 576
                      dots. This is the compatibility path for logos and Kannada text.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/bmp"
                      className="sr-only"
                      onChange={(event) => handleImageFile(event.target.files?.[0])}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload /> Choose image
                    </Button>
                    {bitmapSource === "upload" && (
                      <Button variant="ghost" size="sm" onClick={resetBitmap}>
                        <RotateCcw /> Sample
                      </Button>
                    )}
                  </div>
                </div>

                <div className="bg-muted flex max-h-[34rem] min-h-80 justify-center overflow-auto p-3">
                  {bitmapSource === "upload" && preparedImage ? (
                    <img
                      src={preparedImage.dataUrl}
                      alt="Prepared monochrome bitmap"
                      className="h-fit w-full max-w-[22rem] bg-white object-contain shadow-xs"
                    />
                  ) : bitmapSource === "upload" ? (
                    <div className="text-muted-foreground flex max-w-sm flex-col items-center justify-center gap-2 text-center text-sm">
                      <FileImage className="size-8" />
                      <span>{bitmapFile?.name ?? "Choose an image to begin."}</span>
                      <span className="text-xs">Prepare it to preview the one-bit output.</span>
                    </div>
                  ) : (
                    <div className="h-fit shadow-xs">
                      <BitmapSampleReceipt receiptRef={bitmapReceiptRef} />
                    </div>
                  )}
                </div>

                <div className="border-t-frame space-y-3 border-t p-3">
                  <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                    <Label htmlFor="threshold-slider">Threshold</Label>
                    <Slider
                      id="threshold-slider"
                      min={80}
                      max={245}
                      step={1}
                      value={[threshold]}
                      onValueChange={([value]) => {
                        setThreshold(value ?? 210);
                        setPreparedThreshold(null);
                      }}
                    />
                    <span className="w-8 text-right text-xs font-semibold tabular-nums">
                      {threshold}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={isPreparing}
                    onClick={() => void prepareBitmap()}
                  >
                    {isPreparing ? <Loader2 className="animate-spin" /> : <SlidersHorizontal />}
                    {isPreparing ? "Preparing…" : "Prepare 576-dot bitmap"}
                  </Button>
                </div>
              </section>

              <section className="border-frame bg-card rounded-(--radius-panel) border">
                <div className="border-b-frame border-b p-3">
                  <h2 className="font-semibold">Transport comparison</h2>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    Every option receives the same thresholded pixels so paper output can be
                    compared fairly.
                  </p>
                </div>

                <div className="divide-y">
                  {bitmapTransports.map((transport) => {
                    const isSelected = bitmapTransport === transport.value;
                    const status = latestStatus.get(`bitmap-${transport.value}`);
                    return (
                      <button
                        key={transport.value}
                        type="button"
                        onClick={() => setBitmapTransport(transport.value)}
                        className={cn(
                          "focus-visible:ring-ring grid w-full gap-2 px-3 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset sm:grid-cols-[1.25rem_minmax(0,1fr)_auto] sm:items-start",
                          isSelected && "bg-brand-soft"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 size-4 rounded-full border-2",
                            isSelected
                              ? "border-brand bg-brand ring-background ring-2"
                              : "border-border-strong"
                          )}
                        />
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold">{transport.label}</span>
                            <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
                              {transport.command}
                            </code>
                            {status === "queued" && (
                              <CheckCircle2 className="text-success size-4" />
                            )}
                            {status === "failed" && <XCircle className="text-destructive size-4" />}
                          </span>
                          <span className="text-muted-foreground mt-1 block text-xs">
                            {transport.description}
                          </span>
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {isSelected ? "Selected" : "Test"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="border-t-frame space-y-3 border-t p-3">
                  <div className="bg-muted grid grid-cols-3 gap-2 rounded-(--radius-control) px-3 py-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Prepared</div>
                      <div className="mt-0.5 font-semibold tabular-nums">
                        {preparedImage
                          ? `${preparedImage.width} × ${preparedImage.height}`
                          : "Not yet"}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Threshold</div>
                      <div className="mt-0.5 font-semibold tabular-nums">
                        {preparedThreshold ?? "Pending"}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Source</div>
                      <div className="mt-0.5 truncate font-semibold">
                        {bitmapSource === "sample"
                          ? "Bilingual sample"
                          : (bitmapFile?.name ?? "Upload")}
                      </div>
                    </div>
                  </div>

                  {bitmapTransport === "driver" && (
                    <p className="text-warning text-xs">
                      Driver mode always submits a separate four-line partial-cut RAW job after the
                      PNG.
                    </p>
                  )}

                  <Button
                    className="w-full"
                    disabled={activeJob !== null || isPreparing}
                    onClick={() => void printBitmap()}
                  >
                    {activeJob === `bitmap-${bitmapTransport}` || isPreparing ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <ImageIcon />
                    )}
                    {activeJob === `bitmap-${bitmapTransport}`
                      ? "Sending bitmap…"
                      : isPreparing
                        ? "Preparing…"
                        : `Print via ${bitmapTransports.find((item) => item.value === bitmapTransport)!.label}`}
                  </Button>
                </div>
              </section>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <section className="border-frame bg-card rounded-(--radius-panel) border">
              <div className="border-b-frame flex items-center justify-between gap-3 border-b p-3">
                <div>
                  <h2 className="font-semibold">Session print log</h2>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    This log is intentionally temporary and clears when the page reloads.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLogs([])}
                  disabled={logs.length === 0}
                >
                  <Trash2 /> Clear log
                </Button>
              </div>

              {logs.length === 0 ? (
                <div className="text-muted-foreground flex min-h-44 flex-col items-center justify-center gap-2 p-6 text-center">
                  <Clock3 className="size-7" />
                  <p className="text-sm font-medium">No print jobs in this session</p>
                  <p className="max-w-md text-xs">
                    Run one isolated command or bitmap transport to record its queue result.
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="grid gap-2 px-3 py-2.5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
                    >
                      {log.status === "queued" ? (
                        <CheckCircle2 className="text-success size-4" />
                      ) : (
                        <XCircle className="text-destructive size-4" />
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-semibold">{log.label}</div>
                        <div className="text-muted-foreground mt-0.5 text-xs">{log.detail}</div>
                      </div>
                      <div className="text-muted-foreground text-right text-xs tabular-nums">
                        <div>{timestamp(log.createdAt)}</div>
                        <div className="mt-0.5">{log.durationMs.toLocaleString("en-IN")} ms</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default PrinterTestPage;
