// ---------------------------------------------------------------------------
// @quickcart/thermal-printer — public API surface
// ---------------------------------------------------------------------------

// High-level
export { Printer } from "./printer.js";
export { ReceiptBuilder } from "./receipt/builder.js";

// Commands (for advanced / direct usage)
export {
  feedLines,
  lineFeed,
  setAlignment,
  setBold,
  setDefaultLineSpacing,
  setLineSpacing,
  setTextSize,
  setUnderline
} from "./commands/text.js";
export { cut, initialize, openCashDrawer } from "./commands/control.js";
export {
  printBarcode,
  setBarcodeHeight,
  setBarcodeHRI,
  setBarcodeWidth
} from "./commands/barcode.js";
export { printQRCode } from "./commands/qrcode.js";

// Encoder
export { encodeCP437, encodeUTF8, selectCodePage } from "./encoder/text-encoder.js";

// Transports
export { CaptureTransport } from "./transport/capture.js";
export { NetworkTransport } from "./transport/network.js";
export { SerialTransport } from "./transport/serial.js";
export { UsbTransport } from "./transport/usb.js";

// Constants
export { ALIGN_CENTER, ALIGN_LEFT, ALIGN_RIGHT, ESC, FS, GS, LF } from "./commands/escpos.js";

// Types
export type {
  Alignment,
  BarcodeType,
  CutMode,
  PrinterConfig,
  QRErrorCorrection,
  TextSize,
  Transport
} from "./types.js";
