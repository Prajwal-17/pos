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
      console.log(`[NetworkTransport] [INIT] Attempting TCP socket creation to ${this.host}:${this.port}...`);
      const socket = createConnection({ host: this.host, port: this.port }, () => {
        socket.removeAllListeners("error");
        this.socket = socket;
        console.log(`[NetworkTransport] [SUCCESS] TCP Socket connected successfully to ${this.host}:${this.port}`);
        resolve();
      });

      socket.setTimeout(this.timeoutMs);

      socket.once("timeout", () => {
        console.error(`[NetworkTransport] [ERROR] TCP Socket Connection TIMEOUT to ${this.host}:${this.port} after ${this.timeoutMs}ms!`);
        console.error(`[NetworkTransport] -> Ensure the printer is turned on, connected to the network, and the IP is exactly ${this.host}`);
        socket.destroy();
        reject(new Error(`Connection to ${this.host}:${this.port} timed out after ${this.timeoutMs}ms`));
      });

      socket.once("error", (err) => {
        console.error(`[NetworkTransport] [ERROR] TCP Socket Connection ERROR to ${this.host}:${this.port}:`, err.message);
        console.error(`[NetworkTransport] -> Full Error Details:`, JSON.stringify(err, null, 2));
        socket.destroy();
        reject(new Error(`Failed to connect to ${this.host}:${this.port}: ${err.message}`));
      });
      
      socket.on("close", (hadError) => console.log(`[NetworkTransport] [LIFECYCLE] Socket closed (hadError: ${hadError})`));
      socket.on("end", () => console.log(`[NetworkTransport] [LIFECYCLE] Socket ended by remote`));
      socket.on("ready", () => console.log(`[NetworkTransport] [LIFECYCLE] Socket ready for writing`));
      socket.on("lookup", (err, address, family) => console.log(`[NetworkTransport] [LIFECYCLE] Socket lookup complete (address: ${address}, family: ${family})`, err ? `Error: ${err.message}` : ""));
    });
  }

  async write(data: Uint8Array): Promise<void> {
    if (!this.socket) {
      throw new Error("NetworkTransport is not open");
    }

    return new Promise((resolve, reject) => {
      console.log(`[NetworkTransport] [WRITE] Preparing to write ${data.length} bytes of ESC/POS data to the socket...`);
      this.socket!.write(data, (err) => {
        if (err) {
          console.error(`[NetworkTransport] [ERROR] Failed to write data to socket:`, err.message);
          reject(new Error(`Failed to write to ${this.host}:${this.port}: ${err.message}`));
        } else {
          console.log(`[NetworkTransport] [SUCCESS] Wrote ${data.length} bytes to ${this.host}:${this.port}`);
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
