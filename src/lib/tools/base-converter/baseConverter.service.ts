/**
 * Convert an integer between numeric bases 2–64.
 * Matches it-tools integer-base-converter / base-converter behavior.
 */

export const MIN_BASE = 2;
export const MAX_BASE = 64;

const DIGIT_RANGE =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/".split("");

export type ConvertBaseArgs = {
  value: string;
  fromBase: number;
  toBase: number;
};

export function convertBase({ value, fromBase, toBase }: ConvertBaseArgs): string {
  const fromRange = DIGIT_RANGE.slice(0, fromBase);
  const toRange = DIGIT_RANGE.slice(0, toBase);
  let decValue = value
    .split("")
    .reverse()
    .reduce((carry: bigint, digit: string, index: number) => {
      if (!fromRange.includes(digit)) {
        throw new Error(`Invalid digit "${digit}" for base ${fromBase}.`);
      }
      return (carry +=
        BigInt(fromRange.indexOf(digit)) * BigInt(fromBase) ** BigInt(index));
    }, 0n);
  let newValue = "";
  while (decValue > 0) {
    newValue = toRange[Number(decValue % BigInt(toBase))]! + newValue;
    decValue = (decValue - (decValue % BigInt(toBase))) / BigInt(toBase);
  }
  return newValue || "0";
}

/** Convert without throwing; returns empty string on invalid input. */
export function convertBaseSafe(args: ConvertBaseArgs): string {
  try {
    return convertBase(args);
  } catch {
    return "";
  }
}

/** Return the error message if convertBase throws; otherwise null. */
export function getConvertBaseError(args: ConvertBaseArgs): string | null {
  try {
    convertBase(args);
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}

/** Clamp a base to the supported 2–64 range; non-finite values fall back to `fallback`. */
export function clampBase(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(MAX_BASE, Math.max(MIN_BASE, Math.trunc(value)));
}
