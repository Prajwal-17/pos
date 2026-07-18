import { ipcMain } from "electron/main";
import { ReceiptBuilder, CaptureTransport, NetworkTransport } from "@quickcart/thermal-printer";
import type { ApiResponse } from "../../../shared/types";

/**
 * Receipt payload received from the renderer process.
 * This is the data structure the billing page sends for printing.
 */
interface PrintReceiptPayload {
  /** Store details */
  store: {
    name: string;
    address?: string;
    phone?: string;
    gstin?: string;
  };
  /** Transaction metadata */
  transaction: {
    type: "sale" | "estimate";
    number: number;
    date: string;
    customerName: string;
    isPaid: boolean;
  };
  /** Line items */
  items: Array<{
    name: string;
    quantity: number;
    price: number; // in paisa
    totalPrice: number; // in paisa
  }>;
  /** Totals in paisa */
  grandTotal: number;
  /** Printer connection config */
  printer: {
    type: "network" | "capture";
    host?: string;
    port?: number;
    outputPath?: string;
    columns?: number;
  };
}

/**
 * Convert paisa to a formatted rupee string.
 */
function formatRupees(paisa: number): string {
  const rupees = paisa / 100;
  return `Rs.${rupees.toFixed(2)}`;
}

/**
 * Build receipt bytes from a payload using ReceiptBuilder.
 */
function buildReceiptBytes(payload: PrintReceiptPayload): Uint8Array {
  const cols = payload.printer.columns ?? 48;
  const builder = new ReceiptBuilder({ columns: cols });

  builder.init();

  // Store header
  builder.center().bold(true).size(2, 2).line(payload.store.name);
  builder.normalSize().bold(false);

  if (payload.store.address) {
    builder.line(payload.store.address);
  }
  if (payload.store.phone) {
    builder.line(`Ph: ${payload.store.phone}`);
  }
  if (payload.store.gstin) {
    builder.line(`GSTIN: ${payload.store.gstin}`);
  }

  builder.hr("=");
  builder.feed(1);

  // Transaction info
  builder.left();
  const typeLabel = payload.transaction.type === "sale" ? "Invoice" : "Estimate";
  builder.row(`${typeLabel} #${payload.transaction.number}`, payload.transaction.date);
  builder.line(`Customer: ${payload.transaction.customerName}`);
  builder.hr("-");

  // Column headers
  builder.bold(true);
  builder.columns3("Item", "Qty", "Amount");
  builder.bold(false);
  builder.hr("-");

  // Items
  for (const item of payload.items) {
    builder.columns3(item.name, `x${item.quantity}`, formatRupees(item.totalPrice));
  }

  builder.hr("-");

  // Total
  builder.bold(true);
  builder.row("TOTAL", formatRupees(payload.grandTotal));
  builder.bold(false);

  // Payment status
  builder.feed(1);
  builder.center();
  builder.line(payload.transaction.isPaid ? "** PAID **" : "** UNPAID **");

  // Footer
  builder.feed(1);
  builder.line("Thank you for your purchase!");
  builder.feed(3);
  builder.paperCut();

  return builder.build();
}

export function printReceipt() {
  ipcMain.handle(
    "printer:printReceipt",
    async (_event, payload: PrintReceiptPayload): Promise<ApiResponse<{ message: string }>> => {
      try {
        console.log(`\n\n=== [printReceipt Handler] NEW PRINT REQUEST ===`);
        console.log(`[printReceipt Handler] Payload details:`, JSON.stringify(payload, null, 2));
        
        const startTime = Date.now();
        const bytes = buildReceiptBytes(payload);
        console.log(`[printReceipt Handler] ReceiptBuilder generated ${bytes.length} bytes in ${Date.now() - startTime}ms`);

        if (payload.printer.type === "network") {
          const host = payload.printer.host ?? "192.168.1.100";
          const port = payload.printer.port ?? 9100;
          console.log(`[printReceipt Handler] Mode: NETWORK -> ${host}:${port}`);
          
          const transport = new NetworkTransport(host, port);
          await transport.open();
          try {
            await transport.write(bytes);
          } catch (err) {
            console.error(`[printReceipt Handler] Error during transport write:`, err);
            throw err;
          } finally {
            await transport.close();
            console.log(`[printReceipt Handler] Network socket closed for ${host}:${port}`);
          }
          console.log(`[printReceipt Handler] Print completed successfully in ${Date.now() - startTime}ms`);
          return { status: "success", data: { message: `Receipt printed to ${host}:${port}` } };
        }

        // Capture mode (dry-run / test)
        const transport = new CaptureTransport();
        await transport.open();
        await transport.write(bytes);
        await transport.close();

        // Write to file if outputPath specified
        if (payload.printer.outputPath) {
          const fs = await import("node:fs/promises");
          await fs.writeFile(payload.printer.outputPath, transport.getBuffer());
          return {
            status: "success",
            data: { message: `Receipt saved to ${payload.printer.outputPath}` }
          };
        }

        return {
          status: "success",
          data: { message: `Receipt captured (${transport.getBuffer().length} bytes)` }
        };
      } catch (error) {
        console.error("=== [printReceipt Handler] ERROR FATAL ===");
        console.error("Error printing receipt:", error);
        if (error instanceof Error) {
          console.error("Stack trace:", error.stack);
        }
        return {
          status: "error",
          error: { message: (error as Error).message ?? "Failed to print receipt" }
        };
      }
    }
  );
}
