export const formatINR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2
});

// function overloading
export function convertToRupees(valueInPaisa: number, options: { asString: true }): string;
export function convertToRupees(valueInPaisa: number, options: { asString: false }): number;
export function convertToRupees(valueInPaisa: number, options?: { asString?: boolean }): number;

/**
 * Convert a paisa amount to rupees, optionally producing a textual representation.
 *
 * @param valueInPaisa - Amount in paisa to convert
 * @param optionsOrAsString - Either a boolean or an options object with an `asString` boolean property.
 *   When truthy, the function returns the rupee value as a string; when falsy (default), it returns a number.
 * @returns The rupee equivalent of `valueInPaisa` as a number, or as a string when requested; returns `"0"` or `0` for invalid numeric input depending on the requested output form.
 */
export function convertToRupees(
  valueInPaisa: number,
  optionsOrAsString: boolean | { asString?: boolean } = false
): number | string {
  const asString =
    typeof optionsOrAsString === "boolean" ? optionsOrAsString : optionsOrAsString?.asString;

  if (typeof valueInPaisa !== "number" || isNaN(valueInPaisa)) {
    return asString ? "0" : 0;
  }
  const rupees = valueInPaisa / 100;
  return asString ? rupees.toString() : rupees;
}

// function overloading
export function convertToPaisa(valueInRupees: number, options: { asString: true }): string;
export function convertToPaisa(valueInRupees: number, options: { asString: false }): number;
export function convertToPaisa(valueInRupees: number, options?: { asString?: boolean }): number;

/**
 * Convert a rupee amount into paisa.
 *
 * @param valueInRupees - Amount in rupees to convert.
 * @param optionsOrAsString - A boolean or an object with an optional `asString` flag. If `true`, the result is returned as a string.
 * @returns The equivalent amount in paisa; a string if `asString` is `true`, otherwise a number. Returns `"0"` or `0` when `valueInRupees` is not a valid number.
 */
export function convertToPaisa(
  valueInRupees: number,
  optionsOrAsString: boolean | { asString?: boolean } = false
): number | string {
  const asString =
    typeof optionsOrAsString === "boolean" ? optionsOrAsString : optionsOrAsString?.asString;

  if (typeof valueInRupees !== "number" || isNaN(valueInRupees)) {
    return asString ? "0" : 0;
  }
  const paisa = Math.round(valueInRupees * 100);
  return asString ? paisa.toString() : paisa;
}

/**
 * Format a paisa amount as an Indian-rupee currency string.
 *
 * @param valueInPaisa - Amount in paisa (1 rupee = 100 paisa)
 * @returns The formatted INR currency string (for example, `₹1,234.56`), or `"N/A"` if the input is not a finite number
 */
export function formatToRupees(valueInPaisa: number): string {
  if (typeof valueInPaisa !== "number" || isNaN(valueInPaisa) || !Number.isFinite(valueInPaisa)) {
    return "N/A";
  }
  const rupees = convertToRupees(valueInPaisa);
  return formatINR.format(rupees);
}