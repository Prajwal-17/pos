// ---------------------------------------------------------------------------
// Printer control commands — init, cut, cash drawer
// ---------------------------------------------------------------------------
import type { CutMode } from "../types.js";
import { CUT_FULL, CUT_PARTIAL, ESC, GS } from "./escpos.js";

/**
 * ESC @ — Initialize printer.
 * Clears print buffer and resets settings to defaults.
 */
export function initialize(): Uint8Array {
  return new Uint8Array([ESC, 0x40]);
}

/**
 * GS V m — Select cut mode and cut paper.
 * m: 0 = full cut, 1 = partial cut
 */
export function cut(mode: CutMode = "full"): Uint8Array {
  const m = mode === "full" ? CUT_FULL : CUT_PARTIAL;
  return new Uint8Array([GS, 0x56, m]);
}

/**
 * ESC p m t1 t2 — Generate pulse (cash drawer kick).
 * m: connector pin (0 = pin 2, 1 = pin 5)
 * t1: ON duration  (t1 × 2 ms)
 * t2: OFF duration (t2 × 2 ms)
 *
 * Default: pin 2, 120ms ON, 240ms OFF (standard for most drawers).
 */
export function openCashDrawer(pin: 0 | 1 = 0, onMs = 60, offMs = 120): Uint8Array {
  // Convert ms to ESC/POS units (×2 ms)
  const t1 = Math.max(0, Math.min(255, Math.floor(onMs / 2)));
  const t2 = Math.max(0, Math.min(255, Math.floor(offMs / 2)));
  return new Uint8Array([ESC, 0x70, pin, t1, t2]);
}
