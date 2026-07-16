// ---------------------------------------------------------------------------
// Text encoder — converts strings to bytes for ESC/POS printers
//
// Most thermal printers don't understand UTF-8. They use legacy code pages
// (CP437 by default). This encoder converts Unicode strings to the
// appropriate byte sequences, with code-page switching support.
// ---------------------------------------------------------------------------
import { ESC } from "../commands/escpos.js";

/**
 * CP437 mapping for characters 0x80–0xFF.
 * Maps Unicode code points to their CP437 byte value.
 * Only includes characters that differ from ASCII (0x00–0x7F is identity).
 */
const CP437_MAP = new Map<number, number>([
  // Accented Latin
  [0x00c7, 0x80], // Ç
  [0x00fc, 0x81], // ü
  [0x00e9, 0x82], // é
  [0x00e2, 0x83], // â
  [0x00e4, 0x84], // ä
  [0x00e0, 0x85], // à
  [0x00e5, 0x86], // å
  [0x00e7, 0x87], // ç
  [0x00ea, 0x88], // ê
  [0x00eb, 0x89], // ë
  [0x00e8, 0x8a], // è
  [0x00ef, 0x8b], // ï
  [0x00ee, 0x8c], // î
  [0x00ec, 0x8d], // ì
  [0x00c4, 0x8e], // Ä
  [0x00c5, 0x8f], // Å
  [0x00c9, 0x90], // É
  [0x00e6, 0x91], // æ
  [0x00c6, 0x92], // Æ
  [0x00f4, 0x93], // ô
  [0x00f6, 0x94], // ö
  [0x00f2, 0x95], // ò
  [0x00fb, 0x96], // û
  [0x00f9, 0x97], // ù
  [0x00ff, 0x98], // ÿ
  [0x00d6, 0x99], // Ö
  [0x00dc, 0x9a], // Ü
  // Currency
  [0x00a2, 0x9b], // ¢
  [0x00a3, 0x9c], // £
  [0x00a5, 0x9d], // ¥
  // Math / symbols
  [0x00b2, 0xfd], // ²
  [0x00b7, 0xfa], // ·
  [0x00f1, 0xa4], // ñ
  [0x00d1, 0xa5], // Ñ
  [0x00bf, 0xa8], // ¿
  [0x00a1, 0xad], // ¡
  [0x00ab, 0xae], // «
  [0x00bb, 0xaf], // »
  [0x00b0, 0xf8], // °
  [0x00b1, 0xf1], // ±
  [0x00f7, 0xf6], // ÷
  [0x221a, 0xfb], // √
  [0x221e, 0xec], // ∞
  [0x2248, 0xf7], // ≈
  [0x2264, 0xf3], // ≤
  [0x2265, 0xf2], // ≥
  // Block elements (commonly used for receipt separators)
  [0x2588, 0xdb], // █
  [0x2584, 0xdc], // ▄
  [0x258c, 0xdd], // ▌
  [0x2590, 0xde], // ▐
  [0x2580, 0xdf] // ▀
]);

/** The byte used when a character can't be encoded in the target code page. */
const REPLACEMENT_BYTE = 0x3f; // '?'

/**
 * Encode a Unicode string to CP437 bytes.
 *
 * - ASCII (0x00–0x7F) is passed through unchanged.
 * - Known CP437 characters (0x80–0xFF) are mapped via the lookup table.
 * - Everything else becomes '?' (0x3F).
 *
 * @param str  The string to encode
 * @returns Uint8Array of CP437 bytes
 */
export function encodeCP437(str: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const cp = str.codePointAt(i)!;
    // Handle surrogate pairs
    if (cp > 0xffff) {
      i++; // skip low surrogate
      bytes.push(REPLACEMENT_BYTE);
      continue;
    }
    if (cp < 0x80) {
      bytes.push(cp);
    } else {
      bytes.push(CP437_MAP.get(cp) ?? REPLACEMENT_BYTE);
    }
  }
  return new Uint8Array(bytes);
}

/**
 * ESC t n — Select character code table (code page).
 *
 * Common pages:
 *   0  = CP437 (USA, standard)
 *   2  = CP850 (Multilingual)
 *  19  = CP858 (Multilingual with €)
 *  47  = CP1252 (Windows Latin-1)
 *
 * Note: The Indian Rupee symbol ₹ (U+20B9) is NOT available in any
 * standard ESC/POS code page. Options:
 *   1. Use "Rs" or "Rs." as a text substitute (most reliable)
 *   2. Print ₹ as a small raster image (printer-dependent)
 *   3. Some modern printers support UTF-8 mode — check your model
 *
 * @param page  Code page number (0–255, printer-dependent)
 */
export function selectCodePage(page: number): Uint8Array {
  const n = Math.max(0, Math.min(255, Math.floor(page)));
  return new Uint8Array([ESC, 0x74, n]);
}

/**
 * Encode a string using the built-in TextEncoder (UTF-8).
 * Only use this if your printer supports UTF-8 mode.
 */
export function encodeUTF8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}
