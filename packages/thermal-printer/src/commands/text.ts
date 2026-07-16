// ---------------------------------------------------------------------------
// Text formatting commands — pure functions returning Uint8Array
// ---------------------------------------------------------------------------
import type { Alignment, TextSize } from "../types.js";
import { ALIGN_CENTER, ALIGN_LEFT, ALIGN_RIGHT, ESC, GS, LF } from "./escpos.js";

/**
 * ESC a n — Set alignment.
 * n: 0 = left, 1 = center, 2 = right
 */
export function setAlignment(align: Alignment): Uint8Array {
  const n = align === "left" ? ALIGN_LEFT : align === "center" ? ALIGN_CENTER : ALIGN_RIGHT;
  return new Uint8Array([ESC, 0x61, n]);
}

/**
 * ESC E n — Toggle emphasis (bold).
 * n: 0 = off, 1 = on
 */
export function setBold(on: boolean): Uint8Array {
  return new Uint8Array([ESC, 0x45, on ? 0x01 : 0x00]);
}

/**
 * ESC - n — Set underline mode.
 * n: 0 = off, 1 = 1-dot, 2 = 2-dot
 */
export function setUnderline(mode: 0 | 1 | 2): Uint8Array {
  return new Uint8Array([ESC, 0x2d, mode]);
}

/**
 * GS ! n — Set character size.
 * Bits 0-3: vertical magnification (height - 1)
 * Bits 4-7: horizontal magnification (width - 1)
 */
export function setTextSize(size: TextSize): Uint8Array {
  const n = ((size.width - 1) << 4) | (size.height - 1);
  return new Uint8Array([GS, 0x21, n]);
}

/**
 * ESC d n — Print and feed n lines.
 * n: 0–255
 */
export function feedLines(n: number): Uint8Array {
  const clamped = Math.max(0, Math.min(255, Math.floor(n)));
  return new Uint8Array([ESC, 0x64, clamped]);
}

/**
 * Single line feed (LF).
 */
export function lineFeed(): Uint8Array {
  return new Uint8Array([LF]);
}

/**
 * ESC 2 — Select default line spacing (~3.75 mm / 30 dots at 203 dpi).
 */
export function setDefaultLineSpacing(): Uint8Array {
  return new Uint8Array([ESC, 0x32]);
}

/**
 * ESC 3 n — Set line spacing to n × (motion unit).
 * n: 0–255
 */
export function setLineSpacing(n: number): Uint8Array {
  const clamped = Math.max(0, Math.min(255, Math.floor(n)));
  return new Uint8Array([ESC, 0x33, clamped]);
}
