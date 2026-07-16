// ---------------------------------------------------------------------------
// Demo script — generate a sample receipt and test it
//
// Usage:
//   1. DRY RUN (no printer needed):
//      pnpm tsx scripts/demo.ts
//
//   2. PRINT TO USB PRINTER (Linux — raw device file, no native deps!):
//      pnpm tsx scripts/demo.ts | sudo tee /dev/usb/lp0 > /dev/null
//
//   3. PRINT TO NETWORK PRINTER:
//      pnpm tsx scripts/demo.ts --network 192.168.1.100
// ---------------------------------------------------------------------------

import { ReceiptBuilder } from "../src/receipt/builder.js";
import { CaptureTransport } from "../src/transport/capture.js";
import { NetworkTransport } from "../src/transport/network.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse CLI args
const args = process.argv.slice(2);
const networkFlag = args.indexOf("--network");
const networkHost = networkFlag !== -1 ? args[networkFlag + 1] : null;
const networkPort = networkFlag !== -1 && args[networkFlag + 2] ? Number(args[networkFlag + 2]) : 9100;
const pipeMode = args.includes("--pipe");

// ---------------------------------------------------------------------------
// Build a sample receipt
// ---------------------------------------------------------------------------
function buildSampleReceipt(columns = 48): Uint8Array {
  const builder = new ReceiptBuilder({ columns });

  builder
    .init()

    // ── Store Header ──
    .center()
    .size(2, 2)
    .bold(true)
    .line("QuickCart Store")
    .normalSize()
    .bold(false)
    .line("123 MG Road, Bengaluru")
    .line("Ph: 9876543210")
    .line("GSTIN: 29ABCDE1234F1Z5")

    .hr("=")
    .feed(1)

    // ── Transaction Info ──
    .left()
    .row("Invoice #42", "16/07/2026")
    .line("Customer: Rajesh Kumar")
    .hr("-")

    // ── Column Headers ──
    .bold(true)
    .columns3("Item", "Qty", "Amount")
    .bold(false)
    .hr("-")

    // ── Line Items ──
    .columns3("Amul Gold 1L", "x2", "Rs.144.00")
    .columns3("Britannia Bread", "x1", "Rs.45.00")
    .columns3("Tata Salt 1kg", "x3", "Rs.90.00")
    .columns3("Maggi Noodles", "x5", "Rs.70.00")
    .columns3("Surf Excel 1kg", "x1", "Rs.230.00")

    .hr("-")

    // ── Totals ──
    .bold(true)
    .row("TOTAL", "Rs.579.00")
    .bold(false)
    .row("Paid (Cash)", "Rs.600.00")
    .row("Change", "Rs.21.00")

    .feed(1)
    .center()
    .bold(true)
    .line("** PAID **")
    .bold(false)

    // ── Footer ──
    .feed(1)
    .line("Thank you for shopping!")
    .line("Visit again")

    .feed(3)
    .paperCut();

  return builder.build();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const receipt = buildSampleReceipt();

  console.error(`\n  Receipt built: ${receipt.length} bytes\n`);

  // MODE 1: Pipe mode — write raw bytes to stdout (for piping to /dev/usb/lp0)
  if (pipeMode) {
    process.stdout.write(Buffer.from(receipt));
    return;
  }

  // MODE 2: Network printer
  if (networkHost) {
    console.error(`  Sending to ${networkHost}:${networkPort}...`);
    const transport = new NetworkTransport(networkHost, networkPort);
    await transport.open();
    await transport.write(receipt);
    await transport.close();
    console.error(`  ✅ Printed successfully!\n`);
    return;
  }

  // MODE 3: Dry run — save to file + show hex dump
  const outFile = path.join(__dirname, "..", "demo-receipt.bin");
  const capture = new CaptureTransport();
  await capture.open();
  await capture.write(receipt);
  await capture.close();

  fs.writeFileSync(outFile, capture.getBuffer());
  console.error(`  📄 Saved to: ${outFile}`);
  console.error(`  📏 Size: ${capture.getBuffer().length} bytes\n`);

  // Pretty-print what the receipt would look like (text-only preview)
  console.error("  ─── Text Preview ───────────────────────────────────\n");
  const textPreview = extractTextPreview(receipt);
  for (const line of textPreview) {
    console.error(`  ${line}`);
  }
  console.error("\n  ─── End Preview ────────────────────────────────────\n");

  console.error("  To inspect raw bytes:  xxd demo-receipt.bin | head -40");
  console.error("  To print (Linux USB):  pnpm tsx scripts/demo.ts --pipe | sudo tee /dev/usb/lp0 > /dev/null");
  console.error("  To print (Network):    pnpm tsx scripts/demo.ts --network <IP> [PORT]\n");
}

/**
 * Naive text extractor — strips ESC/POS control sequences and shows
 * just the printable text. NOT a real emulator, but good for a quick preview.
 */
function extractTextPreview(data: Uint8Array): string[] {
  const lines: string[] = [];
  let currentLine = "";

  let i = 0;
  while (i < data.length) {
    const byte = data[i]!;

    // ESC (0x1B) — skip ESC + command + params
    if (byte === 0x1b) {
      i++; // skip ESC
      if (i >= data.length) break;
      const cmd = data[i]!;
      if (cmd === 0x40) {
        // ESC @ (init) — 1 byte
        i++;
      } else if (cmd === 0x61 || cmd === 0x45 || cmd === 0x2d || cmd === 0x74) {
        // ESC a/E/-/t n — 2 bytes
        i += 2;
      } else if (cmd === 0x64 || cmd === 0x33) {
        // ESC d/3 n — 2 bytes
        i += 2;
      } else if (cmd === 0x32) {
        // ESC 2 — 1 byte
        i++;
      } else if (cmd === 0x70) {
        // ESC p m t1 t2 — 4 bytes
        i += 4;
      } else {
        i++; // unknown ESC command, skip 1
      }
      continue;
    }

    // GS (0x1D) — skip GS commands
    if (byte === 0x1d) {
      i++;
      if (i >= data.length) break;
      const cmd = data[i]!;
      if (cmd === 0x21 || cmd === 0x56) {
        // GS ! n / GS V m — 2 bytes
        i += 2;
      } else {
        i++;
      }
      continue;
    }

    // LF — new line
    if (byte === 0x0a) {
      lines.push(currentLine);
      currentLine = "";
      i++;
      continue;
    }

    // Printable ASCII
    if (byte >= 0x20 && byte < 0x7f) {
      currentLine += String.fromCharCode(byte);
    }
    i++;
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines;
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
