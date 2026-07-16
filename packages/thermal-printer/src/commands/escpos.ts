// ---------------------------------------------------------------------------
// ESC/POS byte constants
// Reference: https://download4.epson.biz/sec_pubs/pos/reference_en/escpos/
// ---------------------------------------------------------------------------

// Control characters
export const NUL = 0x00;
export const LF = 0x0a;
export const CR = 0x0d;
export const ESC = 0x1b;
export const FS = 0x1c;
export const GS = 0x1d;

// Alignment values for ESC a
export const ALIGN_LEFT = 0x00;
export const ALIGN_CENTER = 0x01;
export const ALIGN_RIGHT = 0x02;

// Cut modes for GS V
export const CUT_FULL = 0x00;
export const CUT_PARTIAL = 0x01;
