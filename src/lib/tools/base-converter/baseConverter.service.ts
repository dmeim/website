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

/** BigInt work grows with the square of the digit count, so this keeps a stray paste from freezing the tab. */
export const MAX_INPUT_DIGITS = 100_000;

/** How many digits fit in a safe integer, so long numbers take one BigInt step per group and not per digit. */
function groupSize(base: number): number {
  return Math.floor(Math.log(Number.MAX_SAFE_INTEGER) / Math.log(base));
}

/** Bases up to 36 have one case of letters, so "FF" can only mean "ff". */
function normalizeDigits(value: string, fromBase: number): string {
  const trimmed = value.trim();
  return fromBase <= 36 ? trimmed.toLowerCase() : trimmed;
}

function parseDigits(value: string, fromBase: number): bigint {
  const digits = normalizeDigits(value, fromBase);
  if (digits.length > MAX_INPUT_DIGITS) {
    throw new Error(`That number is too long. The limit is ${MAX_INPUT_DIGITS.toLocaleString("en-US")} digits.`);
  }

  const size = groupSize(fromBase);
  const scale = BigInt(fromBase) ** BigInt(size);
  let result = 0n;
  let group = 0;
  let count = 0;
  for (const digit of digits) {
    const index = DIGIT_RANGE.indexOf(digit);
    if (index === -1 || index >= fromBase) {
      throw new Error(`Invalid digit "${digit}" for base ${fromBase}.`);
    }
    group = group * fromBase + index;
    count += 1;
    if (count === size) {
      result = result * scale + BigInt(group);
      group = 0;
      count = 0;
    }
  }
  return result * BigInt(fromBase) ** BigInt(count) + BigInt(group);
}

let lastParse: { value: string; fromBase: number; result: bigint } | undefined;

/** The island converts one input to six bases per keystroke, so reuse the costly parse. */
function parseOnce(value: string, fromBase: number): bigint {
  if (lastParse?.value === value && lastParse.fromBase === fromBase) return lastParse.result;
  const result = parseDigits(value, fromBase);
  lastParse = { value, fromBase, result };
  return result;
}

export function convertBase({ value, fromBase, toBase }: ConvertBaseArgs): string {
  let decValue = parseOnce(value, fromBase);
  if (toBase <= 36) {
    return decValue.toString(toBase);
  }

  const size = groupSize(toBase);
  const scale = BigInt(toBase) ** BigInt(size);
  const groups: string[] = [];
  while (decValue > 0n) {
    let group = Number(decValue % scale);
    decValue /= scale;
    let digits = "";
    for (let i = 0; i < size && (group > 0 || decValue > 0n); i += 1) {
      digits = DIGIT_RANGE[group % toBase]! + digits;
      group = Math.floor(group / toBase);
    }
    groups.push(digits);
  }
  return groups.reverse().join("") || "0";
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

/** A message when a base is blank or outside 2 to 64; otherwise null. */
export function getBaseError(label: string, base: number): string | null {
  if (Number.isInteger(base) && base >= MIN_BASE && base <= MAX_BASE) return null;
  return `${label} must be a whole number from ${MIN_BASE} to ${MAX_BASE}.`;
}

/** Clamp a base to the supported 2–64 range; non-finite values fall back to `fallback`. */
export function clampBase(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(MAX_BASE, Math.max(MIN_BASE, Math.trunc(value)));
}
