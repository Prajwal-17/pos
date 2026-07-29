import type { RawReceiptData } from "../../../shared/types";
import { paisaToRupeeString } from "../../../shared/utils/utils";

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
    if (candidate.length <= width) {
      current = candidate;
    } else {
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

function qrCode(payload: string): Buffer {
  const data = ascii(payload);
  const storeLength = data.length + 3;

  return Buffer.concat([
    bytes(GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00),
    bytes(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x06),
    bytes(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31),
    bytes(GS, 0x28, 0x6b, storeLength & 0xff, (storeLength >> 8) & 0xff, 0x31, 0x50, 0x30),
    data,
    bytes(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30)
  ]);
}

function code128(payload: string): Buffer {
  const data = ascii(`{B${payload}`);
  return Buffer.concat([
    bytes(GS, 0x48, 0x02),
    bytes(GS, 0x68, 0x3c),
    bytes(GS, 0x77, 0x02),
    bytes(GS, 0x6b, 0x49, data.length),
    data,
    bytes(0x0a)
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
    for (const wrappedLine of wrapText(addressLine, LINE_WIDTH)) {
      chunks.push(line(wrappedLine));
    }
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
    bytes(ESC, 0x64, 0x04),
    bytes(GS, 0x56, 0x01)
  );

  return Buffer.concat(chunks);
}

export function buildEscPosTestReceipt(): Buffer {
  const receipt = buildEscPosReceipt({
    storeName: "QuickCart Print Test",
    addressLines: ["80mm raw ESC/POS compatibility receipt", "Windows direct print mode"],
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
      },
      {
        name: "Margherita Pizza",
        quantity: "1",
        unitPricePaisa: 25000,
        totalPaisa: 25000
      }
    ],
    subtotalPaisa: 55000,
    totalPaisa: 55000,
    qrData: "QUICKCART-RAW-PRINT-TEST"
  });

  const barcode = code128("QC-00042");
  const cutCommand = Buffer.from([GS, 0x56, 0x01]);
  const cutIndex = receipt.lastIndexOf(cutCommand);
  return Buffer.concat([
    receipt.subarray(0, cutIndex),
    bytes(ESC, 0x61, 0x01),
    line("Code 128"),
    barcode,
    bytes(ESC, 0x64, 0x04),
    cutCommand
  ]);
}
