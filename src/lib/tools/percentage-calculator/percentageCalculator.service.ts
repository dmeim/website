/** Optional numeric input — `undefined` means the field is empty (matches it-tools). */
export type OptionalNumber = number | undefined;

function isMissing(value: OptionalNumber): value is undefined {
  return value === undefined;
}

function finiteOrEmpty(result: number): string {
  return !Number.isFinite(result) || Number.isNaN(result) ? "" : result.toString();
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
  return ((x / 100) * y).toString();
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
 * → `((to - from) / from) * 100`. Empty when not finite (e.g. from = 0).
 */
export function percentageIncreaseDecrease(
  from: OptionalNumber,
  to: OptionalNumber,
): string {
  if (isMissing(from) || isMissing(to)) {
    return "";
  }
  return finiteOrEmpty(((to - from) / from) * 100);
}
