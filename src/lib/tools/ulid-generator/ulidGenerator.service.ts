/** Crockford's Base32 (ULID spec) — excludes I, L, O, U. */
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const ENCODING_LEN = CROCKFORD.length;

export const ULID_QUANTITY_MIN = 1;
export const ULID_QUANTITY_MAX = 100;
export const ULID_QUANTITY_DEFAULT = 1;

export const ULID_FORMATS = ["raw", "json"] as const;
export type UlidFormat = (typeof ULID_FORMATS)[number];
export const ULID_FORMAT_DEFAULT: UlidFormat = "raw";

/** E2E / validation pattern: 26 Crockford Base32 characters. */
export const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

export interface GenerateUlidsOptions {
  quantity?: number;
  format?: UlidFormat;
  /** Override wall-clock ms for tests. Each id in a batch still gets fresh randomness. */
  time?: number;
}

export function clampUlidQuantity(value: unknown, fallback = ULID_QUANTITY_DEFAULT): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(ULID_QUANTITY_MAX, Math.max(ULID_QUANTITY_MIN, Math.trunc(parsed)));
}

export function normalizeUlidFormat(value: unknown, fallback: UlidFormat = ULID_FORMAT_DEFAULT): UlidFormat {
  if (typeof value === "string" && (ULID_FORMATS as readonly string[]).includes(value)) {
    return value as UlidFormat;
  }

  return fallback;
}

function encodeTime(now: number, length = 10): string {
  let time = now;
  let str = "";

  for (let i = length; i > 0; i -= 1) {
    const mod = time % ENCODING_LEN;
    str = CROCKFORD.charAt(mod) + str;
    time = (time - mod) / ENCODING_LEN;
  }

  return str;
}

function encodeRandom(length = 16): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  let str = "";
  for (let i = 0; i < length; i += 1) {
    // 256 % 32 === 0 → unbiased Crockford digit per byte
    str += CROCKFORD.charAt(bytes[i]! % ENCODING_LEN);
  }

  return str;
}

/** Generate a single 26-character ULID (48-bit ms timestamp + 80-bit randomness). */
export function generateUlid(time: number = Date.now()): string {
  return encodeTime(time) + encodeRandom();
}

export function isValidUlid(value: string): boolean {
  return ULID_PATTERN.test(value.trim());
}

/**
 * Generate one or more ULIDs.
 * - `raw` — newline-joined (it-tools default)
 * - `json` — `JSON.stringify(ids, null, 2)`
 */
export function generateUlids({
  quantity = ULID_QUANTITY_DEFAULT,
  format = ULID_FORMAT_DEFAULT,
  time = Date.now(),
}: GenerateUlidsOptions = {}): string {
  const count = clampUlidQuantity(quantity);
  const safeFormat = normalizeUlidFormat(format);
  const ids = Array.from({ length: count }, () => generateUlid(time));

  if (safeFormat === "json") {
    return JSON.stringify(ids, null, 2);
  }

  return ids.join("\n");
}
