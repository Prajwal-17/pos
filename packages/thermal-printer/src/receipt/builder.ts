// ---------------------------------------------------------------------------
// ReceiptBuilder — fluent API for constructing ESC/POS receipt data
// ---------------------------------------------------------------------------
import { cut, initialize, openCashDrawer } from "../commands/control.js";
import { LF } from "../commands/escpos.js";
import { feedLines, lineFeed, setAlignment, setBold, setTextSize, setUnderline } from "../commands/text.js";
import { encodeCP437 } from "../encoder/text-encoder.js";
import type { Alignment, CutMode, TextSize } from "../types.js";

/** Default column width for 80 mm paper. */
const DEFAULT_COLUMNS = 48;

/**
 * Fluent builder for constructing ESC/POS receipt byte sequences.
 *
 * Every method returns `this` for chaining. Call `.build()` to get
 * the final `Uint8Array` containing all accumulated commands.
 *
 * @example
 * ```ts
 * const bytes = new ReceiptBuilder({ columns: 48 })
 *   .init()
 *   .center().bold(true).line("QuickCart Store")
 *   .bold(false).feed(1)
 *   .left().line("Item A     x2  Rs.200")
 *   .hr()
 *   .right().line("Total: Rs.400")
 *   .feed(2).cut()
 *   .build();
 * ```
 */
export class ReceiptBuilder {
  private readonly chunks: Uint8Array[] = [];
  private readonly columns: number;

  constructor(config?: { columns?: number }) {
    this.columns = config?.columns ?? DEFAULT_COLUMNS;
  }

  // ── Printer control ─────────────────────────────────────────────────

  /** ESC @ — Initialize printer, clear buffer, reset to defaults. */
  init(): this {
    this.chunks.push(initialize());
    return this;
  }

  /** GS V — Cut paper. */
  paperCut(mode?: CutMode): this {
    this.chunks.push(cut(mode));
    return this;
  }

  /** ESC p — Open cash drawer. */
  drawer(pin?: 0 | 1): this {
    this.chunks.push(openCashDrawer(pin));
    return this;
  }

  // ── Text formatting ─────────────────────────────────────────────────

  /** ESC a — Set text alignment. */
  align(alignment: Alignment): this {
    this.chunks.push(setAlignment(alignment));
    return this;
  }

  /** Shorthand for align("left"). */
  left(): this {
    return this.align("left");
  }

  /** Shorthand for align("center"). */
  center(): this {
    return this.align("center");
  }

  /** Shorthand for align("right"). */
  right(): this {
    return this.align("right");
  }

  /** ESC E — Toggle bold. */
  bold(on: boolean): this {
    this.chunks.push(setBold(on));
    return this;
  }

  /** ESC - — Set underline mode (0=off, 1=thin, 2=thick). */
  underline(mode: 0 | 1 | 2 = 1): this {
    this.chunks.push(setUnderline(mode));
    return this;
  }

  /** GS ! — Set character size multiplier. */
  size(width: TextSize["width"], height: TextSize["height"]): this {
    this.chunks.push(setTextSize({ width, height }));
    return this;
  }

  /** Reset text size to normal (1×1). */
  normalSize(): this {
    return this.size(1, 1);
  }

  // ── Text output ─────────────────────────────────────────────────────

  /**
   * Encode and append text (no line feed).
   * Uses CP437 encoding by default.
   */
  text(str: string): this {
    this.chunks.push(encodeCP437(str));
    return this;
  }

  /** Append a line feed. */
  newline(): this {
    this.chunks.push(new Uint8Array([LF]));
    return this;
  }

  /** Encode text + append line feed. Convenience for `.text(str).newline()`. */
  line(str: string): this {
    return this.text(str).newline();
  }

  /** ESC d n — Feed n blank lines. */
  feed(n: number): this {
    this.chunks.push(feedLines(n));
    return this;
  }

  /** Print a single LF (same as newline). */
  lf(): this {
    this.chunks.push(lineFeed());
    return this;
  }

  // ── Layout helpers ──────────────────────────────────────────────────

  /**
   * Print a horizontal rule spanning the full column width.
   * @param char  The character to repeat. Default "-".
   */
  hr(char = "-"): this {
    return this.line(char.repeat(this.columns));
  }

  /**
   * Print a two-column row (left-aligned label, right-aligned value).
   * Pads the gap with spaces.
   *
   * @example
   * builder.row("Subtotal", "Rs.1,200")
   * // "Subtotal                        Rs.1,200"
   */
  row(left: string, right: string): this {
    const gap = this.columns - left.length - right.length;
    if (gap < 1) {
      // Content too wide — just print on separate alignment
      return this.line(left + " " + right);
    }
    return this.line(left + " ".repeat(gap) + right);
  }

  /**
   * Print a three-column row (left, center, right).
   * Useful for item lines: name, qty, price.
   */
  columns3(col1: string, col2: string, col3: string): this {
    const totalContent = col1.length + col2.length + col3.length;
    const totalGap = this.columns - totalContent;
    if (totalGap < 2) {
      return this.line(`${col1} ${col2} ${col3}`);
    }
    const gap1 = Math.floor(totalGap / 2);
    const gap2 = totalGap - gap1;
    return this.line(col1 + " ".repeat(gap1) + col2 + " ".repeat(gap2) + col3);
  }

  /**
   * Print an empty line (just a line feed).
   */
  blank(): this {
    return this.newline();
  }

  // ── Raw bytes ───────────────────────────────────────────────────────

  /** Append arbitrary raw bytes (escape hatch). */
  raw(bytes: Uint8Array): this {
    this.chunks.push(bytes);
    return this;
  }

  // ── Build ───────────────────────────────────────────────────────────

  /**
   * Concatenate all accumulated chunks into a single Uint8Array.
   * This is the final output to send to the transport layer.
   */
  build(): Uint8Array {
    const totalLength = this.chunks.reduce((sum, c) => sum + c.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of this.chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }

  /** Get the configured column width. */
  getColumns(): number {
    return this.columns;
  }
}
