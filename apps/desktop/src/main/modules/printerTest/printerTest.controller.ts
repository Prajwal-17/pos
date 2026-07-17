// ---------------------------------------------------------------------------
// Printer Test Controller — generate receipt previews in various formats
// ---------------------------------------------------------------------------
import { Hono } from "hono";
import {
  ReceiptBuilder,
  printBarcode,
  printQRCode,
  setBarcodeHRI,
  setBarcodeHeight,
  setBarcodeWidth
} from "@quickcart/thermal-printer";

export const printerTestController = new Hono();

// ── Types ──────────────────────────────────────────────────────────────

interface TestReceiptRequest {
  /** "80mm" | "58mm" — paper width */
  paperSize?: "80mm" | "58mm";
  /** Text size multiplier for store name (1-4) */
  headerSize?: number;
  /** Include QR code at bottom */
  includeQR?: boolean;
  /** Include barcode */
  includeBarcode?: boolean;
  /** Number of dummy line items */
  itemCount?: number;
  /** Include store details (address, phone, GSTIN) */
  includeStoreDetails?: boolean;
  /** Include payment status line */
  includePaymentStatus?: boolean;
  /** Custom footer text */
  footerText?: string;
  /** Feed lines before cut */
  feedBeforeCut?: number;
  /** Bold item names */
  boldItems?: boolean;
  /** Use separator style: "dash" | "equal" | "dot" | "star" */
  separatorStyle?: "dash" | "equal" | "dot" | "star";
}

interface TestReceiptResponse {
  /** Format label for display */
  label: string;
  /** Total bytes generated */
  byteCount: number;
  /** Hex dump (first 512 bytes) */
  hexPreview: string;
  /** Decoded text preview (stripped of ESC/POS control codes) */
  textPreview: string;
  /** Paper size used */
  paperSize: string;
  /** Column count */
  columns: number;
}

// ── Dummy data ─────────────────────────────────────────────────────────

const DUMMY_ITEMS = [
  { name: "Amul Gold Milk 1L", quantity: 2, price: 7200 },
  { name: "Britannia Bread", quantity: 1, price: 4500 },
  { name: "Parle-G Biscuits", quantity: 3, price: 1000 },
  { name: "Tata Salt 1kg", quantity: 1, price: 2800 },
  { name: "Aashirvaad Atta 5kg", quantity: 1, price: 29500 },
  { name: "Surf Excel 1kg", quantity: 1, price: 22000 },
  { name: "Vim Dishwash Bar", quantity: 2, price: 3500 },
  { name: "Dettol Soap 125g", quantity: 4, price: 5500 },
  { name: "Red Label Tea 500g", quantity: 1, price: 27500 },
  { name: "Fortune Oil 1L", quantity: 1, price: 17000 }
];

function formatRupees(paisa: number): string {
  const rupees = paisa / 100;
  return `Rs.${rupees.toFixed(2)}`;
}

/**
 * Decode a Uint8Array into a human-readable text preview by
 * stripping ESC/POS control sequences and showing only printable text.
 */
function decodeTextPreview(bytes: Uint8Array): string {
  const lines: string[] = [];
  let currentLine = "";

  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i]!;

    // ESC (0x1B) — skip 2-byte commands, detect multi-byte
    if (b === 0x1b) {
      i++; // skip command byte
      const cmd = bytes[i];
      // ESC d n (feed lines) — add blank lines
      if (cmd === 0x64 && i + 1 < bytes.length) {
        i++;
        const n = bytes[i] ?? 0;
        for (let j = 0; j < n; j++) lines.push("");
      }
      continue;
    }

    // GS (0x1D) — skip GS commands
    if (b === 0x1d) {
      i++; // skip command byte
      const cmd = bytes[i];
      // GS ! n (text size)
      if (cmd === 0x21) {
        i++;
        continue;
      }
      // GS V m (cut)
      if (cmd === 0x56) {
        i++;
        lines.push("--- CUT ---");
        continue;
      }
      // GS ( k (QR code) — skip variable length
      if (cmd === 0x28) {
        i++; // 'k'
        if (i + 1 < bytes.length) {
          i++;
          const pL = bytes[i] ?? 0;
          i++;
          const pH = bytes[i] ?? 0;
          const len = pL + pH * 256;
          i += len; // skip data
        }
        continue;
      }
      // GS k (barcode) — skip
      if (cmd === 0x6b) {
        i++; // type
        if (i < bytes.length) {
          i++;
          const n = bytes[i] ?? 0;
          i += n; // skip barcode data
        }
        continue;
      }
      // Other GS commands (h, w, H) — skip 1 param
      if (cmd === 0x68 || cmd === 0x77 || cmd === 0x48) {
        i++;
        continue;
      }
      continue;
    }

    // LF (0x0A) — newline
    if (b === 0x0a) {
      lines.push(currentLine);
      currentLine = "";
      continue;
    }

    // CR — skip
    if (b === 0x0d) continue;

    // Printable ASCII
    if (b >= 0x20 && b <= 0x7e) {
      currentLine += String.fromCharCode(b);
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines.join("\n");
}

function toHexDump(bytes: Uint8Array, maxBytes = 512): string {
  const slice = bytes.slice(0, maxBytes);
  const hexLines: string[] = [];

  for (let i = 0; i < slice.length; i += 16) {
    const chunk = slice.slice(i, i + 16);
    const hex = Array.from(chunk)
      .map((b: number) => b.toString(16).padStart(2, "0"))
      .join(" ");
    const ascii = Array.from(chunk)
      .map((b: number) => (b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : "."))
      .join("");
    hexLines.push(`${i.toString(16).padStart(4, "0")}  ${hex.padEnd(48)}  |${ascii}|`);
  }

  if (bytes.length > maxBytes) {
    hexLines.push(`... (${bytes.length - maxBytes} more bytes)`);
  }

  return hexLines.join("\n");
}

// ── Receipt builder ────────────────────────────────────────────────────

function buildTestReceipt(opts: TestReceiptRequest): {
  bytes: Uint8Array;
  columns: number;
} {
  const columns = opts.paperSize === "58mm" ? 32 : 48;
  const headerSize = Math.max(1, Math.min(4, opts.headerSize ?? 2)) as 1 | 2 | 3 | 4;
  const itemCount = Math.max(1, Math.min(10, opts.itemCount ?? 5));
  const separator = {
    dash: "-",
    equal: "=",
    dot: ".",
    star: "*"
  }[opts.separatorStyle ?? "dash"];
  const feedBeforeCut = Math.max(1, Math.min(8, opts.feedBeforeCut ?? 3));
  const items = DUMMY_ITEMS.slice(0, itemCount);

  const builder = new ReceiptBuilder({ columns });

  builder.init();

  // Store header
  builder.center();
  builder.bold(true).size(headerSize, headerSize);
  builder.line("QuickCart Store");
  builder.normalSize().bold(false);

  if (opts.includeStoreDetails !== false) {
    builder.line("123 MG Road, Bengaluru");
    builder.line("Ph: 080-1234-5678");
    builder.line("GSTIN: 29AABCU9603R1ZM");
  }

  builder.hr(separator);
  builder.feed(1);

  // Transaction info
  builder.left();
  builder.row("Invoice #1042", "16 Jul 2026");
  builder.line("Customer: Rajesh Kumar");
  builder.hr(separator);

  // Column headers
  builder.bold(true);
  builder.columns3("Item", "Qty", "Amount");
  builder.bold(false);
  builder.hr(separator);

  // Items
  let grandTotal = 0;
  for (const item of items) {
    const total = item.price * item.quantity;
    grandTotal += total;
    if (opts.boldItems) builder.bold(true);
    builder.columns3(item.name, `x${item.quantity}`, formatRupees(total));
    if (opts.boldItems) builder.bold(false);
  }

  builder.hr(separator);

  // Total
  builder.bold(true);
  builder.row("TOTAL", formatRupees(grandTotal));
  builder.bold(false);

  // Payment status
  if (opts.includePaymentStatus !== false) {
    builder.feed(1);
    builder.center();
    builder.line("** PAID **");
  }

  // Barcode
  if (opts.includeBarcode) {
    builder.feed(1);
    builder.center();
    builder.raw(setBarcodeHRI(2)); // below barcode
    builder.raw(setBarcodeHeight(60));
    builder.raw(setBarcodeWidth(3));
    builder.raw(printBarcode("CODE128", "INV-1042-2026"));
    builder.feed(1);
  }

  // QR Code
  if (opts.includeQR) {
    builder.feed(1);
    builder.center();
    builder.raw(printQRCode("upi://pay?pa=store@upi&am=1200", 6, "M"));
    builder.feed(1);
  }

  // Footer
  builder.feed(1);
  builder.center();
  builder.line(opts.footerText ?? "Thank you for your purchase!");

  builder.feed(feedBeforeCut);
  builder.paperCut();

  return { bytes: builder.build(), columns };
}

// ── Endpoints ──────────────────────────────────────────────────────────

/**
 * POST /api/printer-test/generate
 * Generate a single receipt with custom options.
 */
printerTestController.post("/generate", async (c) => {
  const body = (await c.req.json()) as TestReceiptRequest;
  const { bytes, columns } = buildTestReceipt(body);

  const response: TestReceiptResponse = {
    label: `${body.paperSize ?? "80mm"} receipt`,
    byteCount: bytes.length,
    hexPreview: toHexDump(bytes),
    textPreview: decodeTextPreview(bytes),
    paperSize: body.paperSize ?? "80mm",
    columns
  };

  return c.json({ status: "success", data: response });
});

/**
 * GET /api/printer-test/presets
 * Generate all preset receipt formats for comparison.
 */
printerTestController.get("/presets", async (c) => {
  const presets: Array<{ name: string; description: string; options: TestReceiptRequest }> = [
    {
      name: "80mm Standard",
      description: "Standard 80mm receipt with all details",
      options: {
        paperSize: "80mm",
        headerSize: 2,
        itemCount: 5,
        includeStoreDetails: true,
        includePaymentStatus: true,
        separatorStyle: "dash"
      }
    },
    {
      name: "58mm Compact",
      description: "Compact 58mm receipt (32 columns)",
      options: {
        paperSize: "58mm",
        headerSize: 1,
        itemCount: 3,
        includeStoreDetails: false,
        includePaymentStatus: true,
        separatorStyle: "dash"
      }
    },
    {
      name: "80mm + QR Code",
      description: "80mm with UPI QR code for payment",
      options: {
        paperSize: "80mm",
        headerSize: 2,
        itemCount: 4,
        includeQR: true,
        separatorStyle: "equal"
      }
    },
    {
      name: "80mm + Barcode",
      description: "80mm with CODE128 barcode for invoice tracking",
      options: {
        paperSize: "80mm",
        headerSize: 2,
        itemCount: 5,
        includeBarcode: true,
        separatorStyle: "dash"
      }
    },
    {
      name: "80mm Full (QR + Barcode)",
      description: "Everything: store details, barcode, QR, bold items",
      options: {
        paperSize: "80mm",
        headerSize: 3,
        itemCount: 8,
        includeQR: true,
        includeBarcode: true,
        boldItems: true,
        separatorStyle: "equal",
        footerText: "Visit again! www.quickcart.in"
      }
    },
    {
      name: "58mm Minimal",
      description: "Bare minimum receipt — no extras",
      options: {
        paperSize: "58mm",
        headerSize: 1,
        itemCount: 2,
        includeStoreDetails: false,
        includePaymentStatus: false,
        separatorStyle: "dot",
        feedBeforeCut: 2
      }
    },
    {
      name: "80mm Large Header",
      description: "80mm with 4x header text for branding",
      options: {
        paperSize: "80mm",
        headerSize: 4,
        itemCount: 5,
        includeStoreDetails: true,
        separatorStyle: "star",
        footerText: "** WHOLESALE ONLY **"
      }
    },
    {
      name: "80mm 10 Items",
      description: "Stress test with maximum items",
      options: {
        paperSize: "80mm",
        headerSize: 2,
        itemCount: 10,
        includeBarcode: true,
        boldItems: true,
        separatorStyle: "equal"
      }
    }
  ];

  const results = presets.map((preset) => {
    const { bytes, columns } = buildTestReceipt(preset.options);
    return {
      name: preset.name,
      description: preset.description,
      byteCount: bytes.length,
      hexPreview: toHexDump(bytes),
      textPreview: decodeTextPreview(bytes),
      paperSize: preset.options.paperSize ?? "80mm",
      columns,
      options: preset.options
    };
  });

  return c.json({ status: "success", data: results });
});
