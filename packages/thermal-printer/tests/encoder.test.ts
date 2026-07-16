// ---------------------------------------------------------------------------
// Text encoder tests — CP437 encoding and code-page switching
// ---------------------------------------------------------------------------
import { describe, expect, it } from "vitest";
import { encodeCP437, encodeUTF8, selectCodePage } from "../src/encoder/text-encoder";

describe("encodeCP437", () => {
  it("encodes ASCII characters unchanged", () => {
    const result = encodeCP437("Hello");
    expect(result).toEqual(new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]));
  });

  it("encodes digits correctly", () => {
    const result = encodeCP437("123");
    expect(result).toEqual(new Uint8Array([0x31, 0x32, 0x33]));
  });

  it("encodes space and punctuation", () => {
    const result = encodeCP437("A B!");
    expect(result).toEqual(new Uint8Array([0x41, 0x20, 0x42, 0x21]));
  });

  it("maps known CP437 characters", () => {
    // ü → 0x81
    const result = encodeCP437("ü");
    expect(result).toEqual(new Uint8Array([0x81]));
  });

  it("maps é → 0x82", () => {
    expect(encodeCP437("é")).toEqual(new Uint8Array([0x82]));
  });

  it("maps £ → 0x9c", () => {
    expect(encodeCP437("£")).toEqual(new Uint8Array([0x9c]));
  });

  it("maps ° → 0xf8", () => {
    expect(encodeCP437("°")).toEqual(new Uint8Array([0xf8]));
  });

  it("replaces unknown characters with ?", () => {
    // ₹ (Indian Rupee) is not in CP437
    const result = encodeCP437("₹");
    expect(result).toEqual(new Uint8Array([0x3f])); // '?'
  });

  it("handles mixed ASCII and special characters", () => {
    const result = encodeCP437("Rs.100");
    // All ASCII characters
    expect(result).toEqual(new Uint8Array([0x52, 0x73, 0x2e, 0x31, 0x30, 0x30]));
  });

  it("handles empty string", () => {
    expect(encodeCP437("")).toEqual(new Uint8Array([]));
  });

  it("replaces emoji/surrogate pairs with ?", () => {
    const result = encodeCP437("😀");
    expect(result).toEqual(new Uint8Array([0x3f]));
  });
});

describe("encodeUTF8", () => {
  it("encodes UTF-8 correctly", () => {
    const result = encodeUTF8("Hello");
    expect(result).toEqual(new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]));
  });

  it("encodes ₹ as multi-byte UTF-8", () => {
    const result = encodeUTF8("₹");
    // ₹ = U+20B9 → UTF-8: 0xE2 0x82 0xB9
    expect(result).toEqual(new Uint8Array([0xe2, 0x82, 0xb9]));
  });
});

describe("selectCodePage", () => {
  it("CP437 (page 0) → ESC t 0", () => {
    expect(selectCodePage(0)).toEqual(new Uint8Array([0x1b, 0x74, 0x00]));
  });

  it("CP850 (page 2) → ESC t 2", () => {
    expect(selectCodePage(2)).toEqual(new Uint8Array([0x1b, 0x74, 0x02]));
  });

  it("clamps to 0 for negative values", () => {
    expect(selectCodePage(-1)).toEqual(new Uint8Array([0x1b, 0x74, 0x00]));
  });

  it("clamps to 255 for overflow", () => {
    expect(selectCodePage(999)).toEqual(new Uint8Array([0x1b, 0x74, 0xff]));
  });
});
