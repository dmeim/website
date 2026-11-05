export type QueryValue = string | number | boolean;

/** Decodes a stored JSON value, falling back when it is missing, corrupt, or the wrong shape. */
export function parseStoredValue<T>(raw: string | null, fallback: T, isValid?: (value: T) => boolean): T {
  if (raw === null) return fallback;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return fallback;
  }
  if (typeof parsed !== typeof fallback) return fallback;
  if (Array.isArray(parsed) !== Array.isArray(fallback)) return fallback;
  if ((parsed === null) !== (fallback === null)) return fallback;
  return !isValid || isValid(parsed as T) ? (parsed as T) : fallback;
}

/** Decodes a URL query value to the type of its fallback, rejecting anything that does not fit. */
export function parseQueryValue<T extends QueryValue>(raw: string | null, fallback: T, isValid?: (value: T) => boolean): T {
  if (raw === null) return fallback;
  let parsed: QueryValue | undefined;
  if (typeof fallback === "number") {
    parsed = raw.trim() === "" ? undefined : Number(raw);
    if (typeof parsed === "number" && !Number.isFinite(parsed)) parsed = undefined;
  } else if (typeof fallback === "boolean") {
    parsed = raw === "true" ? true : raw === "false" ? false : undefined;
  } else {
    parsed = raw;
  }
  if (parsed === undefined) return fallback;
  return !isValid || isValid(parsed as T) ? (parsed as T) : fallback;
}

/** Returns the search string for a URL with one parameter set, or removed when it equals its default. */
export function withQueryValue<T extends QueryValue>(search: string, name: string, value: T, defaultValue: T): string {
  const params = new URLSearchParams(search);
  if (value === defaultValue) params.delete(name);
  else params.set(name, String(value));
  const next = params.toString();
  return next ? `?${next}` : "";
}
