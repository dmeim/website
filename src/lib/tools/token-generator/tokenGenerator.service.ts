export const TOKEN_LENGTH_MIN = 1;
export const TOKEN_LENGTH_MAX = 512;
export const TOKEN_LENGTH_DEFAULT = 64;

export const UPPERCASE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const LOWERCASE_ALPHABET = "abcdefghijklmnopqrstuvwxyz";
export const NUMBER_ALPHABET = "0123456789";
export const SYMBOL_ALPHABET = ".,;:!?./-\"'#{([-|\\@)]=}*+";

export interface CreateTokenOptions {
  withUppercase?: boolean;
  withLowercase?: boolean;
  withNumbers?: boolean;
  withSymbols?: boolean;
  length?: number;
  /** When set, overrides the character-class toggles. */
  alphabet?: string;
}

export function clampTokenLength(length: unknown, fallback = TOKEN_LENGTH_DEFAULT): number {
  const parsed = typeof length === "number" ? length : Number.parseInt(String(length), 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(TOKEN_LENGTH_MAX, Math.max(TOKEN_LENGTH_MIN, Math.trunc(parsed)));
}

export function buildTokenAlphabet({
  withUppercase = true,
  withLowercase = true,
  withNumbers = true,
  withSymbols = false,
  alphabet,
}: Pick<
  CreateTokenOptions,
  "withUppercase" | "withLowercase" | "withNumbers" | "withSymbols" | "alphabet"
> = {}): string {
  if (typeof alphabet === "string") {
    return alphabet;
  }

  return [
    withUppercase ? UPPERCASE_ALPHABET : "",
    withLowercase ? LOWERCASE_ALPHABET : "",
    withNumbers ? NUMBER_ALPHABET : "",
    withSymbols ? SYMBOL_ALPHABET : "",
  ].join("");
}

/**
 * Generate a random token from the selected character classes (or a custom alphabet).
 * Matches it-tools token-generator behavior: shuffle a repeated alphabet pool, then truncate.
 */
export function createToken({
  withUppercase = true,
  withLowercase = true,
  withNumbers = true,
  withSymbols = false,
  length = TOKEN_LENGTH_DEFAULT,
  alphabet,
}: CreateTokenOptions = {}): string {
  const safeLength = clampTokenLength(length);
  const allAlphabet = buildTokenAlphabet({
    withUppercase,
    withLowercase,
    withNumbers,
    withSymbols,
    alphabet,
  });

  if (!allAlphabet || safeLength < 1) {
    return "";
  }

  return shuffleString(allAlphabet.repeat(safeLength)).substring(0, safeLength);
}

function shuffleString(value: string): string {
  const chars = value.split("");

  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomIntBelow(i + 1);
    const current = chars[i]!;
    chars[i] = chars[j]!;
    chars[j] = current;
  }

  return chars.join("");
}

/** Uniform integer in `[0, maxExclusive)` via Web Crypto when available. */
function randomIntBelow(maxExclusive: number): number {
  if (maxExclusive <= 1) {
    return 0;
  }

  const cryptoApi = globalThis.crypto;

  if (cryptoApi?.getRandomValues) {
    const limit = 0x100000000;
    const rejectAbove = limit - (limit % maxExclusive);
    const buffer = new Uint32Array(1);

    for (;;) {
      cryptoApi.getRandomValues(buffer);
      const value = buffer[0]!;
      if (value < rejectAbove) {
        return value % maxExclusive;
      }
    }
  }

  return Math.floor(Math.random() * maxExclusive);
}
