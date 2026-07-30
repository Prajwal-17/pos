import type {
  EscPosPlaygroundJob,
  EscPosPresetId,
  EscPosTextOptions,
  RawReceiptData
} from "../../../shared/types";
import { paisaToRupeeString } from "../../../shared/utils/utils";
import { buildRasterCommand } from "./raster";

const ESC = 0x1b;
const GS = 0x1d;
const LINE_WIDTH = 48;

function bytes(...values: number[]): Buffer {
  return Buffer.from(values);
}

function ascii(value: string): Buffer {
  const safeValue = value
    .replaceAll("₹", "Rs.")
    .normalize("NFKD")
    .replace(/[^\x20-\x7e\n]/g, "?");
  return Buffer.from(safeValue, "ascii");
}

function line(value = ""): Buffer {
  return Buffer.concat([ascii(value), bytes(0x0a)]);
}

function boundedInteger(value: number, minimum: number, maximum: number, label: string): number {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${label} must be between ${minimum} and ${maximum}.`);
  }
  return value;
}

export function wrapText(value: string, width: number): string[] {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (word.length > width) {
      if (current) {
        lines.push(current);
        current = "";
      }
      for (let index = 0; index < word.length; index += width) {
        const part = word.slice(index, index + width);
        if (part.length === width) lines.push(part);
        else current = part;
      }
      continue;
    }

    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= width) current = candidate;
    else {
      lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function fit(value: string, width: number, align: "left" | "right" = "left"): string {
  const clipped = value.slice(0, width);
  return align === "right" ? clipped.padStart(width) : clipped.padEnd(width);
}

function itemLines(index: number, item: RawReceiptData["items"][number]): string[] {
  const nameLines = wrapText(item.name, 22);
  const rate = paisaToRupeeString(item.unitPricePaisa);
  const amount = paisaToRupeeString(item.totalPaisa);

  return nameLines.map((name, lineIndex) =>
    [
      fit(lineIndex === 0 ? `${index}.` : "", 3),
      fit(name, 22),
      fit(lineIndex === 0 ? item.quantity : "", 6, "right"),
      fit(lineIndex === 0 ? rate : "", 8, "right"),
      fit(lineIndex === 0 ? amount : "", 9, "right")
    ].join("")
  );
}

function qrCode(
  payload: string,
  moduleSize = 6,
  errorCorrection: "l" | "m" | "q" | "h" = "m"
): Buffer {
  const data = ascii(payload.trim());
  if (data.length === 0 || data.length > 7_089) {
    throw new Error("QR data must contain between 1 and 7,089 ASCII bytes.");
  }
  const size = boundedInteger(moduleSize, 1, 16, "QR module size");
  const correction = { l: 0x30, m: 0x31, q: 0x32, h: 0x33 }[errorCorrection];
  const storeLength = data.length + 3;

  return Buffer.concat([
    bytes(GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00),
    bytes(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, size),
    bytes(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, correction),
    bytes(GS, 0x28, 0x6b, storeLength & 0xff, (storeLength >> 8) & 0xff, 0x31, 0x50, 0x30),
    data,
    bytes(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30)
  ]);
}

function code128(payload: string, width = 2, height = 60): Buffer {
  const normalizedPayload = payload.trim();
  if (!normalizedPayload || normalizedPayload.length > 250) {
    throw new Error("Code 128 data must contain between 1 and 250 characters.");
  }
  const data = ascii(`{B${normalizedPayload}`);
  const barWidth = boundedInteger(width, 2, 6, "Barcode width");
  const barHeight = boundedInteger(height, 1, 255, "Barcode height");

  return Buffer.concat([
    bytes(GS, 0x48, 0x02),
    bytes(GS, 0x68, barHeight),
    bytes(GS, 0x77, barWidth),
    bytes(GS, 0x6b, 0x49, data.length),
    data,
    bytes(0x0a)
  ]);
}

function paperFinish(feedLines: number, cut: "none" | "full" | "partial"): Buffer {
  const feed = boundedInteger(feedLines, 0, 20, "Feed lines");
  const chunks: Buffer[] = [];
  if (feed > 0) chunks.push(bytes(ESC, 0x64, feed));
  if (cut === "full") chunks.push(bytes(GS, 0x56, 0x00));
  if (cut === "partial") chunks.push(bytes(GS, 0x56, 0x01));
  return Buffer.concat(chunks);
}

function title(value: string): Buffer {
  return Buffer.concat([
    bytes(ESC, 0x61, 0x01, ESC, 0x45, 0x01),
    line(value),
    bytes(ESC, 0x45, 0x00, ESC, 0x61, 0x00),
    line("-".repeat(LINE_WIDTH))
  ]);
}

export function buildEscPosReceipt(receipt: RawReceiptData): Buffer {
  const chunks: Buffer[] = [
    bytes(ESC, 0x40),
    bytes(ESC, 0x61, 0x01),
    bytes(ESC, 0x45, 0x01),
    bytes(GS, 0x21, 0x11)
  ];

  for (const storeNameLine of wrapText(receipt.storeName.toUpperCase(), LINE_WIDTH / 2)) {
    chunks.push(line(storeNameLine));
  }
  chunks.push(bytes(GS, 0x21, 0x00), bytes(ESC, 0x45, 0x00));

  for (const addressLine of receipt.addressLines) {
    for (const wrappedLine of wrapText(addressLine, LINE_WIDTH)) chunks.push(line(wrappedLine));
  }

  if (receipt.phone) chunks.push(line(`Phone: ${receipt.phone}`));
  if (receipt.gstin) chunks.push(line(`GSTIN: ${receipt.gstin}`));

  const date = new Date(receipt.dateTime);
  const dateText = Number.isNaN(date.getTime())
    ? receipt.dateTime
    : new Intl.DateTimeFormat("en-IN", {
        dateStyle: "short",
        timeStyle: "short",
        hour12: true
      }).format(date);

  chunks.push(
    bytes(ESC, 0x61, 0x00),
    line("-".repeat(LINE_WIDTH)),
    line(`${receipt.transactionLabel}: ${receipt.transactionNo}`),
    line(`Date: ${dateText}`),
    line(`Customer: ${receipt.customerName || "Walk-in"}`),
    line("-".repeat(LINE_WIDTH)),
    bytes(ESC, 0x45, 0x01),
    line(
      `${fit("#", 3)}${fit("ITEM", 22)}${fit("QTY", 6, "right")}${fit("RATE", 8, "right")}${fit("AMT", 9, "right")}`
    ),
    bytes(ESC, 0x45, 0x00),
    line("-".repeat(LINE_WIDTH))
  );

  receipt.items.forEach((item, index) => {
    for (const itemLine of itemLines(index + 1, item)) chunks.push(line(itemLine));
  });

  chunks.push(
    line("-".repeat(LINE_WIDTH)),
    line(`${fit("Subtotal", 39)}${fit(paisaToRupeeString(receipt.subtotalPaisa), 9, "right")}`),
    bytes(ESC, 0x45, 0x01),
    bytes(GS, 0x21, 0x01),
    line(`${fit("TOTAL", 30)}${fit(`Rs.${paisaToRupeeString(receipt.totalPaisa)}`, 18, "right")}`),
    bytes(GS, 0x21, 0x00),
    bytes(ESC, 0x45, 0x00)
  );

  if (receipt.qrData) {
    chunks.push(
      line(),
      bytes(ESC, 0x61, 0x01),
      qrCode(receipt.qrData),
      line(),
      line("Scan QR"),
      bytes(ESC, 0x61, 0x00)
    );
  }

  chunks.push(
    line(),
    bytes(ESC, 0x61, 0x01),
    bytes(ESC, 0x45, 0x01),
    line("Thank you. Visit again."),
    bytes(ESC, 0x45, 0x00),
    paperFinish(4, "partial")
  );

  return Buffer.concat(chunks);
}

function buildTextTest(options: EscPosTextOptions): Buffer {
  const widthScale = boundedInteger(options.widthScale, 1, 8, "Text width scale");
  const heightScale = boundedInteger(options.heightScale, 1, 8, "Text height scale");
  const characterSpacing = boundedInteger(options.characterSpacing, 0, 20, "Character spacing");
  const alignment = { left: 0, center: 1, right: 2 }[options.align];
  const font = options.font === "a" ? 0 : 1;
  const baseWidth = options.font === "a" ? 48 : 64;
  const printableWidth = Math.max(1, Math.floor(baseWidth / widthScale));
  const chunks: Buffer[] = [
    bytes(ESC, 0x40),
    bytes(ESC, 0x61, alignment),
    bytes(ESC, 0x4d, font),
    bytes(ESC, 0x45, options.bold ? 1 : 0),
    bytes(ESC, 0x2d, options.underline),
    bytes(GS, 0x42, options.reverse ? 1 : 0),
    bytes(GS, 0x21, ((widthScale - 1) << 4) | (heightScale - 1)),
    bytes(ESC, 0x20, characterSpacing)
  ];

  if (options.lineSpacing === null) chunks.push(bytes(ESC, 0x32));
  else chunks.push(bytes(ESC, 0x33, boundedInteger(options.lineSpacing, 0, 255, "Line spacing")));

  for (const paragraph of options.text.split("\n")) {
    for (const wrappedLine of wrapText(paragraph, printableWidth)) chunks.push(line(wrappedLine));
  }

  chunks.push(
    bytes(GS, 0x21, 0x00, GS, 0x42, 0x00, ESC, 0x2d, 0x00, ESC, 0x45, 0x00),
    bytes(ESC, 0x20, 0x00, ESC, 0x32, ESC, 0x61, 0x00),
    paperFinish(options.feedLines, options.cut)
  );
  return Buffer.concat(chunks);
}

function presetFontStyles(): Buffer {
  return Buffer.concat([
    bytes(ESC, 0x40),
    title("FONT + STYLE TEST"),
    line("Font A: 48-column device font"),
    bytes(ESC, 0x4d, 0x01),
    line("Font B: compact 64-column device font"),
    bytes(ESC, 0x4d, 0x00, ESC, 0x45, 0x01),
    line("Emphasized / bold"),
    bytes(ESC, 0x45, 0x00, ESC, 0x47, 0x01),
    line("Double-strike"),
    bytes(ESC, 0x47, 0x00, ESC, 0x2d, 0x01),
    line("Underline one-dot"),
    bytes(ESC, 0x2d, 0x02),
    line("Underline two-dot"),
    bytes(ESC, 0x2d, 0x00, GS, 0x42, 0x01),
    line(" REVERSE WHITE ON BLACK "),
    bytes(GS, 0x42, 0x00, ESC, 0x7b, 0x01),
    line("Upside-down text"),
    bytes(ESC, 0x7b, 0x00),
    paperFinish(4, "partial")
  ]);
}

function presetAlignment(): Buffer {
  return Buffer.concat([
    bytes(ESC, 0x40),
    title("ALIGNMENT TEST"),
    bytes(ESC, 0x61, 0x00),
    line("LEFT | starts at printable edge"),
    bytes(ESC, 0x61, 0x01),
    line("CENTER | centered by firmware"),
    bytes(ESC, 0x61, 0x02),
    line("RIGHT | ends at printable edge"),
    bytes(ESC, 0x61, 0x00),
    line("L" + ".".repeat(46) + "R"),
    paperFinish(4, "partial")
  ]);
}

function presetCharacterSize(): Buffer {
  const chunks: Buffer[] = [bytes(ESC, 0x40), title("CHARACTER SIZE TEST")];
  const samples: Array<[number, string]> = [
    [0x00, "1x1 normal"],
    [0x01, "1x2 double height"],
    [0x10, "2x1 double width"],
    [0x11, "2x2 double size"],
    [0x22, "3x3 size"]
  ];
  for (const [size, label] of samples) chunks.push(bytes(GS, 0x21, size), line(label));
  chunks.push(bytes(GS, 0x21, 0x00), paperFinish(4, "partial"));
  return Buffer.concat(chunks);
}

function presetSpacing(): Buffer {
  return Buffer.concat([
    bytes(ESC, 0x40),
    title("SPACING TEST"),
    bytes(ESC, 0x33, 18),
    line("18-dot tight line spacing"),
    line("Second tight line"),
    bytes(ESC, 0x32),
    line("Default line spacing"),
    line("Second default line"),
    bytes(ESC, 0x33, 40),
    line("40-dot loose line spacing"),
    line("Second loose line"),
    bytes(ESC, 0x32, ESC, 0x20, 2),
    line("Two-dot character spacing"),
    bytes(ESC, 0x20, 0),
    line("Normal character spacing"),
    paperFinish(4, "partial")
  ]);
}

function presetWrapping(): Buffer {
  const chunks: Buffer[] = [bytes(ESC, 0x40), title("WRAPPING + COLUMNS")];
  chunks.push(line("0....5....1....5....2....5....3....5....4....5..48"));
  for (const wrappedLine of wrapText(
    "A deliberately long product name wraps on word boundaries without crossing the 48-column receipt grid.",
    LINE_WIDTH
  )) {
    chunks.push(line(wrappedLine));
  }
  chunks.push(
    line("-".repeat(LINE_WIDTH)),
    line(`${fit("ITEM", 29)}${fit("QTY", 6, "right")}${fit("AMOUNT", 13, "right")}`),
    line(`${fit("Premium Basmati Rice", 29)}${fit("2", 6, "right")}${fit("290.00", 13, "right")}`),
    line(`${fit("Coca-Cola 500ml", 29)}${fit("3", 6, "right")}${fit("120.00", 13, "right")}`),
    line("-".repeat(LINE_WIDTH)),
    paperFinish(4, "partial")
  );
  return Buffer.concat(chunks);
}

function presetCodepage(): Buffer {
  const chunks: Buffer[] = [bytes(ESC, 0x40), title("CODEPAGE BYTE CHART")];
  for (const table of [0, 16, 17, 18]) {
    chunks.push(bytes(ESC, 0x74, table), line(`ESC t ${table} | bytes 80-FF`));
    for (let start = 0x80; start <= 0xf0; start += 16) {
      chunks.push(
        Buffer.from(Array.from({ length: 16 }, (_, index) => start + index)),
        bytes(0x0a)
      );
    }
    chunks.push(line());
  }
  chunks.push(bytes(ESC, 0x74, 0), paperFinish(4, "partial"));
  return Buffer.concat(chunks);
}

function presetQr(): Buffer {
  return Buffer.concat([
    bytes(ESC, 0x40),
    title("NATIVE QR TEST"),
    bytes(ESC, 0x61, 0x01),
    qrCode("upi://pay?pa=quickcart@upi&pn=QuickCart&am=123.45&cu=INR&tn=PRINT-TEST", 6, "m"),
    line(),
    line("Module 6 | ECC M | UPI sample"),
    paperFinish(4, "partial")
  ]);
}

function presetBarcode(): Buffer {
  return Buffer.concat([
    bytes(ESC, 0x40),
    title("CODE 128 TEST"),
    bytes(ESC, 0x61, 0x01),
    code128("QC-00042", 2, 72),
    line("QC-00042"),
    paperFinish(4, "partial")
  ]);
}

function presetFeedCut(): Buffer {
  return Buffer.concat([
    bytes(ESC, 0x40),
    title("FEED + CUT TEST"),
    line("Four feed lines should place this above the cutter."),
    paperFinish(4, "partial")
  ]);
}

function presetFullDiagnostic(): Buffer {
  const receipt = buildEscPosReceipt({
    storeName: "QuickCart Print Lab",
    addressLines: ["80mm / 576 dots / 203 DPI", "Windows RAW spooler diagnostic"],
    phone: "9999999999",
    gstin: "29ABCDE1234F1Z5",
    transactionLabel: "Test bill",
    transactionNo: "00042",
    customerName: "Walk-in customer",
    dateTime: new Date().toISOString(),
    items: [
      {
        name: "Long product name to verify clean text wrapping",
        quantity: "2",
        unitPricePaisa: 9000,
        totalPaisa: 18000
      },
      {
        name: "Coca-Cola 500ml",
        quantity: "3",
        unitPricePaisa: 4000,
        totalPaisa: 12000
      }
    ],
    subtotalPaisa: 30000,
    totalPaisa: 30000,
    qrData: "QUICKCART-RAW-PRINT-TEST"
  });

  const cutCommand = Buffer.from([GS, 0x56, 0x01]);
  const cutIndex = receipt.lastIndexOf(cutCommand);
  return Buffer.concat([
    receipt.subarray(0, cutIndex),
    bytes(ESC, 0x61, 0x01),
    line("Code 128"),
    code128("QC-00042"),
    paperFinish(4, "partial")
  ]);
}

export function buildEscPosPreset(preset: EscPosPresetId): Buffer {
  if (preset === "font-styles") return presetFontStyles();
  if (preset === "alignment") return presetAlignment();
  if (preset === "character-size") return presetCharacterSize();
  if (preset === "spacing") return presetSpacing();
  if (preset === "wrapping") return presetWrapping();
  if (preset === "codepage") return presetCodepage();
  if (preset === "native-qr") return presetQr();
  if (preset === "code128") return presetBarcode();
  if (preset === "feed-cut") return presetFeedCut();
  return presetFullDiagnostic();
}

export function buildEscPosPlaygroundJob(job: EscPosPlaygroundJob): Buffer {
  if (job.kind === "preset") return buildEscPosPreset(job.preset);
  if (job.kind === "text") return buildTextTest(job.options);
  if (job.kind === "qr") {
    return Buffer.concat([
      bytes(ESC, 0x40, ESC, 0x61, 0x01),
      qrCode(job.payload, job.moduleSize, job.errorCorrection),
      line(),
      paperFinish(job.feedLines, job.cut)
    ]);
  }
  if (job.kind === "barcode") {
    return Buffer.concat([
      bytes(ESC, 0x40, ESC, 0x61, 0x01),
      code128(job.payload, job.width, job.height),
      paperFinish(job.feedLines, job.cut)
    ]);
  }
  if (job.kind === "paper") {
    return Buffer.concat([
      bytes(ESC, 0x40),
      line("QuickCart paper feed and cut test"),
      paperFinish(job.feedLines, job.cut)
    ]);
  }

  return Buffer.concat([
    bytes(ESC, 0x40, ESC, 0x61, 0x01),
    buildRasterCommand(job.command, job.image),
    bytes(ESC, 0x61, 0x00),
    paperFinish(job.feedLines, job.cut)
  ]);
}

export function buildEscPosTestReceipt(): Buffer {
  return buildEscPosPreset("full-diagnostic"); // full diagnostic button in print test page
}
