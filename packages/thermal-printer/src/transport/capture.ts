// ---------------------------------------------------------------------------
// CaptureTransport — collects written bytes in memory (test / dry-run)
// ---------------------------------------------------------------------------
import type { Transport } from "../types.js";

/**
 * A transport that captures all written bytes in memory.
 * Useful for unit tests, dry runs, and debugging.
 *
 * @example
 * ```ts
 * const transport = new CaptureTransport();
 * await transport.open();
 * await transport.write(receiptBytes);
 * await transport.close();
 *
 * const allBytes = transport.getBuffer();
 * console.log(Buffer.from(allBytes).toString("hex"));
 * ```
 */
export class CaptureTransport implements Transport {
  private readonly chunks: Uint8Array[] = [];
  private opened = false;

  async open(): Promise<void> {
    this.opened = true;
  }

  async write(data: Uint8Array): Promise<void> {
    if (!this.opened) {
      throw new Error("CaptureTransport is not open");
    }
    // Copy to avoid mutation
    this.chunks.push(new Uint8Array(data));
  }

  async close(): Promise<void> {
    this.opened = false;
  }

  /** Concatenate all captured chunks into a single Uint8Array. */
  getBuffer(): Uint8Array {
    const totalLength = this.chunks.reduce((sum, c) => sum + c.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of this.chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }

  /** Get the raw captured chunks (without concatenation). */
  getChunks(): ReadonlyArray<Uint8Array> {
    return this.chunks;
  }

  /** Clear all captured data. */
  clear(): void {
    this.chunks.length = 0;
  }

  /** Whether the transport is currently open. */
  isOpen(): boolean {
    return this.opened;
  }
}
