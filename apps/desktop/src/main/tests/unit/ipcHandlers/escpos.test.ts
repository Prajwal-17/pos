import { describe, expect, it } from "vitest";
import { buildEscPosTestReceipt, wrapText } from "../../../ipcHandlers/printHandlers/escpos";

describe("ESC/POS receipt builder", () => {
  it("wraps text without exceeding the requested width", () => {
    const lines = wrapText("Long product name that should wrap cleanly", 12);

    expect(lines.length).toBeGreaterThan(1);
    expect(lines.every((line) => line.length <= 12)).toBe(true);
    expect(lines.join(" ")).toBe("Long product name that should wrap cleanly");
  });

  it("includes native QR, barcode, feed, and cut commands in the test receipt", () => {
    const receipt = buildEscPosTestReceipt();

    expect(receipt.includes(Buffer.from([0x1d, 0x28, 0x6b]))).toBe(true);
    expect(receipt.includes(Buffer.from([0x1d, 0x6b, 0x49]))).toBe(true);
    expect(receipt.includes(Buffer.from([0x1b, 0x64, 0x04]))).toBe(true);
    expect(receipt.subarray(-3)).toEqual(Buffer.from([0x1d, 0x56, 0x01]));
  });
});
