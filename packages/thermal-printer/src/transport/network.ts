// ---------------------------------------------------------------------------
// NetworkTransport — TCP socket transport using Node's net module
// Zero native dependencies.
// ---------------------------------------------------------------------------
import { createConnection, type Socket } from "node:net";
import type { Transport } from "../types.js";

/**
 * Send ESC/POS data to a thermal printer over TCP.
 * Most network-enabled thermal printers listen on port 9100 (RAW/JetDirect).
 *
 * @example
 * ```ts
 * const transport = new NetworkTransport("192.168.1.100", 9100);
 * await transport.open();
 * await transport.write(receiptBytes);
 * await transport.close();
 * ```
 */
export class NetworkTransport implements Transport {
  private socket: Socket | null = null;
  private readonly host: string;
  private readonly port: number;
  private readonly timeoutMs: number;

  /**
   * @param host  Printer IP address or hostname
   * @param port  TCP port (default: 9100)
   * @param timeoutMs  Connection timeout in milliseconds (default: 5000)
   */
  constructor(host: string, port = 9100, timeoutMs = 5000) {
    this.host = host;
    this.port = port;
    this.timeoutMs = timeoutMs;
  }

  async open(): Promise<void> {
    if (this.socket) {
      throw new Error("NetworkTransport is already open");
    }

    return new Promise((resolve, reject) => {
      console.log(`[NetworkTransport] Attempting to connect to ${this.host}:${this.port}...`);
      const socket = createConnection({ host: this.host, port: this.port }, () => {
        socket.removeAllListeners("error");
        this.socket = socket;
        console.log(`[NetworkTransport] Successfully connected to ${this.host}:${this.port}`);
        resolve();
      });

      socket.setTimeout(this.timeoutMs);

      socket.once("timeout", () => {
        console.error(`[NetworkTransport] Connection timeout to ${this.host}:${this.port}`);
        socket.destroy();
        reject(new Error(`Connection to ${this.host}:${this.port} timed out after ${this.timeoutMs}ms`));
      });

      socket.once("error", (err) => {
        console.error(`[NetworkTransport] Connection error to ${this.host}:${this.port}:`, err);
        socket.destroy();
        reject(new Error(`Failed to connect to ${this.host}:${this.port}: ${err.message}`));
      });
    });
  }

  async write(data: Uint8Array): Promise<void> {
    if (!this.socket) {
      throw new Error("NetworkTransport is not open");
    }

    return new Promise((resolve, reject) => {
      this.socket!.write(data, (err) => {
        if (err) {
          console.error(`[NetworkTransport] Failed to write data:`, err);
          reject(new Error(`Failed to write to ${this.host}:${this.port}: ${err.message}`));
        } else {
          console.log(`[NetworkTransport] Successfully wrote ${data.length} bytes to printer`);
          resolve();
        }
      });
    });
  }

  async close(): Promise<void> {
    if (!this.socket) {
      return;
    }

    return new Promise((resolve) => {
      this.socket!.once("close", () => {
        this.socket = null;
        resolve();
      });
      this.socket!.end();
    });
  }
}
