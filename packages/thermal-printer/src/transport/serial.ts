// ---------------------------------------------------------------------------
// SerialTransport — stub for future serial (RS-232 / USB-serial) support
//
// Requires: `serialport` package (pure JS, no native addon rebuild needed).
// Uncomment and implement when serial connectivity is needed.
// ---------------------------------------------------------------------------
import type { Transport } from "../types.js";

/**
 * Placeholder for serial port transport.
 * Install `serialport` and implement when needed.
 *
 * Typical usage:
 * ```ts
 * const transport = new SerialTransport("/dev/ttyUSB0", 9600);
 * ```
 */
export class SerialTransport implements Transport {
  constructor(
    private readonly _path: string,
    private readonly _baudRate = 9600
  ) {}

  async open(): Promise<void> {
    throw new Error(
      "SerialTransport is not yet implemented. Install `serialport` and implement open/write/close."
    );
  }

  async write(_data: Uint8Array): Promise<void> {
    throw new Error("SerialTransport is not yet implemented.");
  }

  async close(): Promise<void> {
    throw new Error("SerialTransport is not yet implemented.");
  }
}
