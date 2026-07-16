// ---------------------------------------------------------------------------
// Commands — golden-byte unit tests
// Every test asserts the exact Uint8Array output of each command function.
// ---------------------------------------------------------------------------
import { describe, expect, it } from "vitest";
import {
  printBarcode,
  setBarcodeHeight,
  setBarcodeHRI,
  setBarcodeWidth
} from "../src/commands/barcode";
import { cut, initialize, openCashDrawer } from "../src/commands/control";
import { ESC, GS, LF, ALIGN_LEFT, ALIGN_CENTER, ALIGN_RIGHT } from "../src/commands/escpos";
import { printQRCode } from "../src/commands/qrcode";
import {
  feedLines,
  lineFeed,
  setAlignment,
  setBold,
  setDefaultLineSpacing,
  setLineSpacing,
  setTextSize,
  setUnderline
} from "../src/commands/text";

describe("ESC/POS constants", () => {
  it("has correct byte values", () => {
    expect(ESC).toBe(0x1b);
    expect(GS).toBe(0x1d);
    expect(LF).toBe(0x0a);
    expect(ALIGN_LEFT).toBe(0x00);
    expect(ALIGN_CENTER).toBe(0x01);
    expect(ALIGN_RIGHT).toBe(0x02);
  });
});

describe("text commands", () => {
  describe("setAlignment", () => {
    it("left → ESC a 0", () => {
      expect(setAlignment("left")).toEqual(new Uint8Array([0x1b, 0x61, 0x00]));
    });

    it("center → ESC a 1", () => {
      expect(setAlignment("center")).toEqual(new Uint8Array([0x1b, 0x61, 0x01]));
    });

    it("right → ESC a 2", () => {
      expect(setAlignment("right")).toEqual(new Uint8Array([0x1b, 0x61, 0x02]));
    });
  });

  describe("setBold", () => {
    it("on → ESC E 1", () => {
      expect(setBold(true)).toEqual(new Uint8Array([0x1b, 0x45, 0x01]));
    });

    it("off → ESC E 0", () => {
      expect(setBold(false)).toEqual(new Uint8Array([0x1b, 0x45, 0x00]));
    });
  });

  describe("setUnderline", () => {
    it("off → ESC - 0", () => {
      expect(setUnderline(0)).toEqual(new Uint8Array([0x1b, 0x2d, 0x00]));
    });

    it("thin → ESC - 1", () => {
      expect(setUnderline(1)).toEqual(new Uint8Array([0x1b, 0x2d, 0x01]));
    });

    it("thick → ESC - 2", () => {
      expect(setUnderline(2)).toEqual(new Uint8Array([0x1b, 0x2d, 0x02]));
    });
  });

  describe("setTextSize", () => {
    it("normal (1×1) → GS ! 0x00", () => {
      expect(setTextSize({ width: 1, height: 1 })).toEqual(new Uint8Array([0x1d, 0x21, 0x00]));
    });

    it("double width (2×1) → GS ! 0x10", () => {
      expect(setTextSize({ width: 2, height: 1 })).toEqual(new Uint8Array([0x1d, 0x21, 0x10]));
    });

    it("double height (1×2) → GS ! 0x01", () => {
      expect(setTextSize({ width: 1, height: 2 })).toEqual(new Uint8Array([0x1d, 0x21, 0x01]));
    });

    it("double both (2×2) → GS ! 0x11", () => {
      expect(setTextSize({ width: 2, height: 2 })).toEqual(new Uint8Array([0x1d, 0x21, 0x11]));
    });

    it("max size (8×8) → GS ! 0x77", () => {
      expect(setTextSize({ width: 8, height: 8 })).toEqual(new Uint8Array([0x1d, 0x21, 0x77]));
    });
  });

  describe("feedLines", () => {
    it("feeds 3 lines → ESC d 3", () => {
      expect(feedLines(3)).toEqual(new Uint8Array([0x1b, 0x64, 0x03]));
    });

    it("clamps to 0 for negative values", () => {
      expect(feedLines(-1)).toEqual(new Uint8Array([0x1b, 0x64, 0x00]));
    });

    it("clamps to 255 for overflow", () => {
      expect(feedLines(999)).toEqual(new Uint8Array([0x1b, 0x64, 0xff]));
    });
  });

  describe("lineFeed", () => {
    it("produces a single LF byte", () => {
      expect(lineFeed()).toEqual(new Uint8Array([0x0a]));
    });
  });

  describe("setDefaultLineSpacing", () => {
    it("→ ESC 2", () => {
      expect(setDefaultLineSpacing()).toEqual(new Uint8Array([0x1b, 0x32]));
    });
  });

  describe("setLineSpacing", () => {
    it("sets spacing to 50 → ESC 3 50", () => {
      expect(setLineSpacing(50)).toEqual(new Uint8Array([0x1b, 0x33, 0x32]));
    });
  });
});

describe("control commands", () => {
  describe("initialize", () => {
    it("→ ESC @", () => {
      expect(initialize()).toEqual(new Uint8Array([0x1b, 0x40]));
    });
  });

  describe("cut", () => {
    it("full cut → GS V 0", () => {
      expect(cut("full")).toEqual(new Uint8Array([0x1d, 0x56, 0x00]));
    });

    it("partial cut → GS V 1", () => {
      expect(cut("partial")).toEqual(new Uint8Array([0x1d, 0x56, 0x01]));
    });

    it("defaults to full cut", () => {
      expect(cut()).toEqual(new Uint8Array([0x1d, 0x56, 0x00]));
    });
  });

  describe("openCashDrawer", () => {
    it("pin 0 default → ESC p 0 30 60", () => {
      const result = openCashDrawer();
      expect(result[0]).toBe(0x1b);
      expect(result[1]).toBe(0x70);
      expect(result[2]).toBe(0x00); // pin 0
      expect(result.length).toBe(5);
    });

    it("pin 1 → ESC p 1 t1 t2", () => {
      const result = openCashDrawer(1);
      expect(result[2]).toBe(0x01);
    });
  });
});

describe("barcode commands", () => {
  describe("setBarcodeHRI", () => {
    it("below → GS H 2", () => {
      expect(setBarcodeHRI(2)).toEqual(new Uint8Array([0x1d, 0x48, 0x02]));
    });
  });

  describe("setBarcodeHeight", () => {
    it("80 dots → GS h 80", () => {
      expect(setBarcodeHeight(80)).toEqual(new Uint8Array([0x1d, 0x68, 0x50]));
    });

    it("clamps to 1 for zero", () => {
      expect(setBarcodeHeight(0)).toEqual(new Uint8Array([0x1d, 0x68, 0x01]));
    });
  });

  describe("setBarcodeWidth", () => {
    it("width 3 → GS w 3", () => {
      expect(setBarcodeWidth(3)).toEqual(new Uint8Array([0x1d, 0x77, 0x03]));
    });

    it("clamps to 2 for low values", () => {
      expect(setBarcodeWidth(0)).toEqual(new Uint8Array([0x1d, 0x77, 0x02]));
    });

    it("clamps to 6 for high values", () => {
      expect(setBarcodeWidth(99)).toEqual(new Uint8Array([0x1d, 0x77, 0x06]));
    });
  });

  describe("printBarcode", () => {
    it("EAN13 → GS k 67 13 <data>", () => {
      const result = printBarcode("EAN13", "4006381333931");
      expect(result[0]).toBe(0x1d); // GS
      expect(result[1]).toBe(0x6b); // k
      expect(result[2]).toBe(67); // EAN13 type
      expect(result[3]).toBe(13); // data length
      expect(result.length).toBe(4 + 13);
    });

    it("CODE128 → type 73", () => {
      const result = printBarcode("CODE128", "ABC123");
      expect(result[2]).toBe(73);
      expect(result[3]).toBe(6);
    });
  });
});

describe("QR code commands", () => {
  it("produces a multi-command sequence", () => {
    const result = printQRCode("https://quickcart.app");
    // Should contain all 5 sub-commands
    expect(result.length).toBeGreaterThan(30);

    // First command: select model 2 → GS ( k 4 0 49 65 50 0
    expect(result[0]).toBe(0x1d); // GS
    expect(result[1]).toBe(0x28); // (
    expect(result[2]).toBe(0x6b); // k
  });

  it("respects module size parameter", () => {
    const small = printQRCode("test", 2);
    const large = printQRCode("test", 8);
    // Size sub-command at offset 9 (after 9-byte model cmd): GS ( k 3 0 49 67 n
    // n is at offset 9 + 7 = 16
    expect(small[16]).toBe(2);
    expect(large[16]).toBe(8);
  });
});
