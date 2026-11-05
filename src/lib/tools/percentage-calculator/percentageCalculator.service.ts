/** Optional numeric input — `undefined` means the field is empty (matches it-tools). */
export type OptionalNumber = number | undefined;

function isMissing(value: OptionalNumber): value is undefined {
  return value === undefined;
}

/**
 * Drop binary float noise such as 7.000000000000001 or 0.30000000000000004.
 * Rounding to 14 significant digits only counts as noise when it leaves a clearly shorter number,
 * so genuinely long results like 26.973684210526315 keep every digit.
 */
export function cleanFloatNoise(value: number): number {
  const rounded = Number(value.toPrecision(14));
  const significantDigits = rounded.toExponential().split("e")[0].replace(/[-.]/g, "").length;
  return significantDigits <= 12 ? rounded : value;
}

function finiteOrEmpty(result: number): string {
  return Number.isFinite(result) ? cleanFloatNoise(result).toString() : "";
}

/**
 * Parse a controlled number-input string into an optional number.
 * Empty / whitespace → `undefined`; otherwise `Number(raw)` (may be NaN).
 */
export function parseOptionalNumber(raw: string): OptionalNumber {
  if (raw.trim() === "") {
    return undefined;
  }
  const value = Number(raw);
  return Number.isNaN(value) ? undefined : value;
}

/** What is X% of Y → `(X / 100) * Y`. */
export function percentOf(x: OptionalNumber, y: OptionalNumber): string {
  if (isMissing(x) || isMissing(y)) {
    return "";
  }
  return finiteOrEmpty((x / 100) * y);
}

/** X is what percent of Y → `(100 * X) / Y`. Empty when not finite (e.g. Y = 0). */
export function xIsWhatPercentOfY(x: OptionalNumber, y: OptionalNumber): string {
  if (isMissing(x) || isMissing(y)) {
    return "";
  }
  return finiteOrEmpty((100 * x) / y);
}

/**
 * Percentage increase/decrease from `from` to `to`
 * → `((to - from) / |from|) * 100`. Empty when not finite (e.g. from = 0).
 * The absolute value keeps the sign right for negative starts: -100 to -50 is a 50% increase.
 */
export function percentageIncreaseDecrease(
  from: OptionalNumber,
  to: OptionalNumber,
): string {
  if (isMissing(from) || isMissing(to)) {
    return "";
  }
  return finiteOrEmpty(((to - from) / Math.abs(from)) * 100);
}
