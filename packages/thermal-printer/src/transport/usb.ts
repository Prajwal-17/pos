// ---------------------------------------------------------------------------
// UsbTransport — stub for future raw USB support
//
// Requires: `usb` or `node-usb` package (native addon — needs electron-rebuild).
// This has the SAME class of rebuild risk as better-sqlite3.
// ---------------------------------------------------------------------------
import type { Transport } from "../types.js";

/**
 * Placeholder for raw USB transport.
 * Install `usb` and run `electron-rebuild -f -w usb` before using.
 *
 * Typical usage:
 * ```ts
 * const transport = new UsbTransport(0x04b8, 0x0e15); // Epson TM-T20II
 * ```
 */
export class UsbTransport implements Transport {
  constructor(
    private readonly _vendorId: number,
    private readonly _productId: number
  ) {}

  async open(): Promise<void> {
    throw new Error(
      "UsbTransport is not yet implemented. Install `usb`, run `electron-rebuild -f -w usb`, and implement open/write/close."
    );
  }

  async write(_data: Uint8Array): Promise<void> {
    throw new Error("UsbTransport is not yet implemented.");
  }

  async close(): Promise<void> {
    throw new Error("UsbTransport is not yet implemented.");
  }
}
