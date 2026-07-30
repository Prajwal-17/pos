import { describe, expect, it } from "vitest";
import type { EscPosPresetId, MonochromeRasterData } from "../../../../shared/types";
import {
  buildEscPosPlaygroundJob,
  buildEscPosPreset,
  buildEscPosTestReceipt,
  wrapText
} from "../../../ipcHandlers/printHandlers/escpos";
import {
  buildEscStarRaster,
  buildGsLRaster,
  buildGsV0Raster,
  validateMonochromeRaster
} from "../../../ipcHandlers/printHandlers/raster";

const presetIds: EscPosPresetId[] = [
  "full-diagnostic",
  "font-styles",
  "alignment",
  "character-size",
  "spacing",
  "wrapping",
  "codepage",
  "native-qr",
  "code128",
  "feed-cut"
];

function raster(width: number, height: number, data: number[]): MonochromeRasterData {
  return {
    width,
    height,
    stride: Math.ceil(width / 8),
    dataBase64: Buffer.from(data).toString("base64")
  };
}

describe("ESC/POS receipt builder", () => {
  it("wraps text without exceeding the requested width", () => {
    const lines = wrapText("Long product name that should wrap cleanly", 12);

    expect(lines.length).toBeGreaterThan(1);
    expect(lines.every((line) => line.length <= 12)).toBe(true);
    expect(lines.join(" ")).toBe("Long product name that should wrap cleanly");
  });

  it("hard-wraps a single token that is wider than the receipt", () => {
    expect(wrapText("ABCDEFGHIJKLMNOP", 6)).toEqual(["ABCDEF", "GHIJKL", "MNOP"]);
  });

  it("builds every diagnostic preset as an initialized, cut RAW job", () => {
    for (const preset of presetIds) {
      const payload = buildEscPosPreset(preset);
      expect(payload.subarray(0, 2), preset).toEqual(Buffer.from([0x1b, 0x40]));
      expect(payload.subarray(-3), preset).toEqual(Buffer.from([0x1d, 0x56, 0x01]));
    }
  });

  it("includes native QR, barcode, feed, and cut commands in the full diagnostic", () => {
    const receipt = buildEscPosTestReceipt();

    expect(receipt.includes(Buffer.from([0x1d, 0x28, 0x6b]))).toBe(true);
    expect(receipt.includes(Buffer.from([0x1d, 0x6b, 0x49]))).toBe(true);
    expect(receipt.includes(Buffer.from([0x1b, 0x64, 0x04]))).toBe(true);
    expect(receipt.subarray(-3)).toEqual(Buffer.from([0x1d, 0x56, 0x01]));
  });

  it("composes selected device text styles and a full cut", () => {
    const payload = buildEscPosPlaygroundJob({
      kind: "text",
      options: {
        text: "A styled line that wraps safely",
        font: "b",
        align: "right",
        bold: true,
        underline: 2,
        reverse: true,
        widthScale: 2,
        heightScale: 3,
        lineSpacing: 18,
        characterSpacing: 2,
        feedLines: 2,
        cut: "full"
      }
    });

    expect(payload.includes(Buffer.from([0x1b, 0x4d, 0x01]))).toBe(true);
    expect(payload.includes(Buffer.from([0x1b, 0x61, 0x02]))).toBe(true);
    expect(payload.includes(Buffer.from([0x1b, 0x45, 0x01]))).toBe(true);
    expect(payload.includes(Buffer.from([0x1b, 0x2d, 0x02]))).toBe(true);
    expect(payload.includes(Buffer.from([0x1d, 0x42, 0x01]))).toBe(true);
    expect(payload.includes(Buffer.from([0x1d, 0x21, 0x12]))).toBe(true);
    expect(payload.includes(Buffer.from([0x1b, 0x33, 18]))).toBe(true);
    expect(payload.includes(Buffer.from([0x1b, 0x64, 0x02]))).toBe(true);
    expect(payload.subarray(-3)).toEqual(Buffer.from([0x1d, 0x56, 0x00]));
  });
});

describe("ESC/POS monochrome raster encoders", () => {
  it("validates width, stride, and packed data length", () => {
    expect(validateMonochromeRaster(raster(8, 2, [0x80, 0x01]))).toMatchObject({
      width: 8,
      height: 2,
      stride: 1
    });

    expect(() => validateMonochromeRaster({ ...raster(8, 2, [0x80, 0x01]), stride: 2 })).toThrow(
      "Raster stride must be 1 byte"
    );
    expect(() => validateMonochromeRaster(raster(8, 2, [0x80]))).toThrow(
      "Raster data must contain exactly 2 bytes"
    );
    expect(() => validateMonochromeRaster(raster(577, 1, new Array(73).fill(0)))).toThrow(
      "Raster width must be between 1 and 576 dots"
    );
  });

  it("encodes row-major graphics with GS v 0", () => {
    const payload = buildGsV0Raster(raster(8, 2, [0x80, 0x01]));

    expect(payload).toEqual(
      Buffer.from([0x1d, 0x76, 0x30, 0x00, 0x01, 0x00, 0x02, 0x00, 0x80, 0x01])
    );
  });

  it("transposes rows into 24-dot ESC * column bands", () => {
    const payload = buildEscStarRaster(raster(8, 2, [0x80, 0x01]));

    expect(payload.subarray(0, 8)).toEqual(
      Buffer.from([0x1b, 0x33, 24, 0x1b, 0x2a, 33, 0x08, 0x00])
    );
    expect(payload[8]).toBe(0x80);
    expect(payload[8 + 7 * 3]).toBe(0x40);
    expect(payload.subarray(-2)).toEqual(Buffer.from([0x1b, 0x32]));
  });

  it("stores and prints graphics with GS ( L Function 112 and Function 50", () => {
    const payload = buildGsLRaster(raster(8, 2, [0x80, 0x01]));

    expect(payload).toEqual(
      Buffer.from([
        0x1d, 0x28, 0x4c, 0x0c, 0x00, 0x30, 0x70, 0x30, 0x01, 0x01, 0x31, 0x08, 0x00, 0x02, 0x00,
        0x80, 0x01, 0x1d, 0x28, 0x4c, 0x02, 0x00, 0x30, 0x32
      ])
    );
  });
});
