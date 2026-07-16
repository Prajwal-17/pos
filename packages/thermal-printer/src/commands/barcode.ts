// ---------------------------------------------------------------------------
// Barcode commands — GS k (Function B)
// Stub: basic implementation for common symbologies.
// ---------------------------------------------------------------------------
import type { BarcodeType } from "../types.js";
import { GS } from "./escpos.js";

/**
 * Barcode type → GS k function-B type code mapping.
 */
const BARCODE_TYPE_MAP: Record<BarcodeType, number> = {
  UPC_A: 65, // 0x41
  EAN13: 67, // 0x43
  EAN8: 68, // 0x44
  CODE39: 69, // 0x45
  CODE128: 73 // 0x49
};

/**
 * GS H n — Set HRI (Human Readable Interpretation) print position.
 * n: 0=none, 1=above, 2=below, 3=both
 */
export function setBarcodeHRI(position: 0 | 1 | 2 | 3): Uint8Array {
  return new Uint8Array([GS, 0x48, position]);
}

/**
 * GS h n — Set barcode height (in dots).
 * n: 1–255, default 162.
 */
export function setBarcodeHeight(dots: number): Uint8Array {
  const n = Math.max(1, Math.min(255, Math.floor(dots)));
  return new Uint8Array([GS, 0x68, n]);
}

/**
 * GS w n — Set barcode module width.
 * n: 2–6 (thin to thick), default 3.
 */
export function setBarcodeWidth(width: number): Uint8Array {
  const n = Math.max(2, Math.min(6, Math.floor(width)));
  return new Uint8Array([GS, 0x77, n]);
}

/**
 * GS k m n data — Print barcode (Function B format).
 * @param type  Barcode symbology
 * @param data  Barcode data string (ASCII)
 */
export function printBarcode(type: BarcodeType, data: string): Uint8Array {
  const m = BARCODE_TYPE_MAP[type];
  const encoded = new TextEncoder().encode(data);
  const n = encoded.length;

  // GS k m n d1...dn
  const cmd = new Uint8Array(4 + n);
  cmd[0] = GS;
  cmd[1] = 0x6b; // 'k'
  cmd[2] = m;
  cmd[3] = n;
  cmd.set(encoded, 4);
  return cmd;
}
