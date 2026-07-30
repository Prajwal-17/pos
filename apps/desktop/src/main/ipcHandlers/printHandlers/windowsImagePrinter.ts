import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ImagePrintResult, ReceiptImageData } from "../../../shared/types";
import { sendRawToWindowsPrinter } from "./windowsRawPrinter";

const PNG_PREFIX = "data:image/png;base64,";
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const CUT_WITH_FEED = Buffer.from([0x1b, 0x64, 0x04, 0x1d, 0x56, 0x01]);

function quotePowerShell(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function encodedCommand(script: string): string {
  return Buffer.from(script, "utf16le").toString("base64");
}

function validatePrinterName(printerName: string): string {
  const normalizedName = printerName.trim();
  if (!normalizedName) throw new Error("Enter the printer name shown in Windows Settings.");
  if (
    normalizedName.length > 200 ||
    [...normalizedName].some((character) => character.charCodeAt(0) < 32)
  ) {
    throw new Error("The Windows printer name is invalid.");
  }
  return normalizedName;
}

export function pngDataUrlToBuffer(dataUrl: string): Buffer {
  if (!dataUrl.startsWith(PNG_PREFIX)) {
    throw new Error("Only PNG receipt images are supported.");
  }

  const image = Buffer.from(dataUrl.slice(PNG_PREFIX.length), "base64");
  if (image.length === 0 || image.length > MAX_IMAGE_BYTES) {
    throw new Error("The receipt image is empty or too large.");
  }

  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!image.subarray(0, pngSignature.length).equals(pngSignature)) {
    throw new Error("The receipt image is not a valid PNG.");
  }

  return image;
}

function runPowerShell(script: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "powershell.exe",
      [
        "-NoLogo",
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-EncodedCommand",
        encodedCommand(script)
      ],
      { windowsHide: true }
    );
    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else
        reject(new Error(stderr.trim() || stdout.trim() || `PowerShell exited with code ${code}`));
    });
  });
}

export async function printReceiptImageOnWindows(
  printerName: string,
  image: ReceiptImageData
): Promise<ImagePrintResult> {
  if (process.platform !== "win32") {
    throw new Error("Receipt image printing is available on Windows only.");
  }
  if (image.width !== 576 || image.height <= 0 || image.height > 30_000) {
    throw new Error("The receipt image dimensions are invalid.");
  }

  const normalizedPrinterName = validatePrinterName(printerName);
  const png = pngDataUrlToBuffer(image.dataUrl);
  const tempPath = join(tmpdir(), `quickcart-receipt-image-${randomUUID()}.png`);
  await fs.writeFile(tempPath, png);

  const script = `
Add-Type -AssemblyName System.Drawing
$image = [System.Drawing.Image]::FromFile(${quotePowerShell(tempPath)})
$document = New-Object System.Drawing.Printing.PrintDocument
$document.PrinterSettings.PrinterName = ${quotePowerShell(normalizedPrinterName)}
if (-not $document.PrinterSettings.IsValid) {
  throw "Windows printer was not found."
}

$document.DocumentName = "QuickCart Receipt Image"
$document.PrintController = New-Object System.Drawing.Printing.StandardPrintController
$document.OriginAtMargins = $false
$document.DefaultPageSettings.Color = $false
$document.DefaultPageSettings.Margins = New-Object System.Drawing.Printing.Margins -ArgumentList 0, 0, 0, 0

$paperWidth = 315
$drawWidth = 284
$drawHeight = [Math]::Ceiling($image.Height * $drawWidth / $image.Width)
$paperHeight = [Math]::Max(100, $drawHeight + 16)
$document.DefaultPageSettings.PaperSize = New-Object System.Drawing.Printing.PaperSize -ArgumentList "QuickCart 80mm", $paperWidth, $paperHeight

foreach ($resolution in $document.PrinterSettings.PrinterResolutions) {
  if ($resolution.X -eq 203 -and $resolution.Y -eq 203) {
    $document.DefaultPageSettings.PrinterResolution = $resolution
    break
  }
}

$handler = [System.Drawing.Printing.PrintPageEventHandler] {
  param($sender, $eventArgs)
  $eventArgs.Graphics.TranslateTransform(-$eventArgs.PageSettings.HardMarginX, -$eventArgs.PageSettings.HardMarginY)
  $eventArgs.Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
  $left = [Math]::Max(0, ($paperWidth - $drawWidth) / 2)
  $eventArgs.Graphics.DrawImage($image, [single]$left, [single]0, [single]$drawWidth, [single]$drawHeight)
  $eventArgs.HasMorePages = $false
}

$document.add_PrintPage($handler)
try {
  $document.Print()
} finally {
  $document.remove_PrintPage($handler)
  $document.Dispose()
  $image.Dispose()
}
`;

  try {
    await runPowerShell(script);
    await sendRawToWindowsPrinter(normalizedPrinterName, CUT_WITH_FEED);
    return { width: image.width, height: image.height };
  } finally {
    await fs.rm(tempPath, { force: true });
  }
}
