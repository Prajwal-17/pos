// ---------------------------------------------------------------------------
// QR Code commands — GS ( k (Function 165/167/181)
// Multi-step: set model → set size → set error correction → store data → print
// Reference: https://download4.epson.biz/sec_pubs/pos/reference_en/escpos/gs_lparenk_fn165.html
// ---------------------------------------------------------------------------
import type { QRErrorCorrection } from "../types.js";
import { GS } from "./escpos.js";

const EC_MAP: Record<QRErrorCorrection, number> = {
  L: 48,
  M: 49,
  Q: 50,
  H: 51
};

/**
 * Build the complete multi-command sequence to print a QR code.
 *
 * @param data  The string to encode
 * @param moduleSize  Module (dot) size: 1–16, default 4
 * @param errorCorrection  Error correction level, default "M"
 * @returns Uint8Array containing all sub-commands concatenated
 */
export function printQRCode(
  data: string,
  moduleSize = 4,
  errorCorrection: QRErrorCorrection = "M"
): Uint8Array {
  const encoded = new TextEncoder().encode(data);
  const chunks: Uint8Array[] = [];

  // 1. Select model 2: GS ( k 4 0 49 65 50 0
  chunks.push(new Uint8Array([GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]));

  // 2. Set module size: GS ( k 3 0 49 67 n
  const size = Math.max(1, Math.min(16, Math.floor(moduleSize)));
  chunks.push(new Uint8Array([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, size]));

  // 3. Set error correction: GS ( k 3 0 49 69 n
  chunks.push(new Uint8Array([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, EC_MAP[errorCorrection]]));

  // 4. Store data: GS ( k (pL pH) 49 80 48 d1...dk
  //    pL pH = length of (fn + m + data) = 3 + data.length
  const storeLen = 3 + encoded.length;
  const pL = storeLen & 0xff;
  const pH = (storeLen >> 8) & 0xff;
  const storeCmd = new Uint8Array(5 + 3 + encoded.length);
  storeCmd[0] = GS;
  storeCmd[1] = 0x28;
  storeCmd[2] = 0x6b;
  storeCmd[3] = pL;
  storeCmd[4] = pH;
  storeCmd[5] = 0x31;
  storeCmd[6] = 0x50;
  storeCmd[7] = 0x30;
  storeCmd.set(encoded, 8);
  chunks.push(storeCmd);

  // 5. Print: GS ( k 3 0 49 81 48
  chunks.push(new Uint8Array([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]));

  // Concatenate all chunks
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}
