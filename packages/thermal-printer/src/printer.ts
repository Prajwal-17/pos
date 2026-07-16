// ---------------------------------------------------------------------------
// Printer — combines ReceiptBuilder + Transport for a complete print pipeline
// ---------------------------------------------------------------------------
import { ReceiptBuilder } from "./receipt/builder.js";
import type { PrinterConfig, Transport } from "./types.js";

/**
 * High-level printer interface combining a ReceiptBuilder with a Transport.
 *
 * @example
 * ```ts
 * import { Printer, NetworkTransport } from "@quickcart/thermal-printer";
 *
 * const printer = new Printer(
 *   new NetworkTransport("192.168.1.100"),
 *   { columns: 48 }
 * );
 *
 * const receipt = printer.createReceipt()
 *   .init()
 *   .center().bold(true).line("QuickCart Store")
 *   .bold(false).feed(1)
 *   .left().row("Item A x2", "Rs.200")
 *   .hr()
 *   .right().line("Total: Rs.400")
 *   .feed(2).cut()
 *   .build();
 *
 * await printer.print(receipt);
 * ```
 */
export class Printer {
  private readonly transport: Transport;
  private readonly config: PrinterConfig;

  constructor(transport: Transport, config?: PrinterConfig) {
    this.transport = transport;
    this.config = config ?? {};
  }

  /** Create a new ReceiptBuilder with this printer's column config. */
  createReceipt(): ReceiptBuilder {
    return new ReceiptBuilder({ columns: this.config.columns });
  }

  /** Open transport, write bytes, close transport. */
  async print(data: Uint8Array): Promise<void> {
    await this.transport.open();
    try {
      await this.transport.write(data);
    } finally {
      await this.transport.close();
    }
  }

  /** Write bytes without managing open/close (for batch printing). */
  async write(data: Uint8Array): Promise<void> {
    await this.transport.write(data);
  }

  /** Open the transport connection. */
  async open(): Promise<void> {
    await this.transport.open();
  }

  /** Close the transport connection. */
  async close(): Promise<void> {
    await this.transport.close();
  }
}
