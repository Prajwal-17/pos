// ---------------------------------------------------------------------------
// Shared types for @quickcart/thermal-printer
// ---------------------------------------------------------------------------

/** Text alignment on the receipt. */
export type Alignment = "left" | "center" | "right";

/** Paper-cut mode. */
export type CutMode = "full" | "partial";

/**
 * Character size multiplier (1–8).
 * Width and height can be set independently.
 * `1` = normal size, `2` = double, etc.
 */
export interface TextSize {
  width: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  height: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
}

/** Barcode symbology supported by GS k (subset). */
export type BarcodeType = "UPC_A" | "EAN13" | "EAN8" | "CODE39" | "CODE128";

/** QR code error-correction level. */
export type QRErrorCorrection = "L" | "M" | "Q" | "H";

// ---------------------------------------------------------------------------
// Transport interface
// ---------------------------------------------------------------------------

/**
 * A pluggable I/O channel.
 * Implementations: CaptureTransport, NetworkTransport, SerialTransport, UsbTransport.
 */
export interface Transport {
  /** Open the underlying connection (connect, claim device, etc.). */
  open(): Promise<void>;

  /** Write raw bytes to the device. */
  write(data: Uint8Array): Promise<void>;

  /** Gracefully close the connection. */
  close(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Printer configuration
// ---------------------------------------------------------------------------

/** Configuration for ReceiptBuilder and Printer. */
export interface PrinterConfig {
  /** Number of printable character columns. 48 for 80 mm, 32 for 58 mm. Default: 48. */
  columns?: number;
}
