import type { lib } from "crypto-js";
import { MD5, RIPEMD160, SHA1, SHA224, SHA256, SHA3, SHA384, SHA512, enc } from "crypto-js";

/** Algorithms shown in it-tools hash-text (order preserved). */
export const HASH_ALGORITHMS = [
  "MD5",
  "SHA1",
  "SHA256",
  "SHA224",
  "SHA512",
  "SHA384",
  "SHA3",
  "RIPEMD160",
] as const;

export type HashAlgorithm = (typeof HASH_ALGORITHMS)[number];

export const HASH_ENCODINGS = ["Bin", "Hex", "Base64", "Base64url"] as const;

export type HashEncoding = (typeof HASH_ENCODINGS)[number];

export const HASH_ENCODING_DEFAULT: HashEncoding = "Hex";

export const HASH_ENCODING_OPTIONS: ReadonlyArray<{ value: HashEncoding; label: string }> = [
  { value: "Bin", label: "Binary (base 2)" },
  { value: "Hex", label: "Hexadecimal (base 16)" },
  { value: "Base64", label: "Base64 (base 64)" },
  { value: "Base64url", label: "Base64url (base 64 with url safe chars)" },
];

const ALGOS = {
  MD5,
  SHA1,
  SHA256,
  SHA224,
  SHA512,
  SHA384,
  SHA3,
  RIPEMD160,
} as const satisfies Record<HashAlgorithm, (message: string | lib.WordArray) => lib.WordArray>;

/**
 * Convert a hex digest to a binary (base-2) string, one nibble → 4 bits.
 * Matches it-tools `convertHexToBin`.
 */
export function convertHexToBin(hex: string): string {
  return hex
    .trim()
    .split("")
    .map((nibble) => Number.parseInt(nibble, 16).toString(2).padStart(4, "0"))
    .join("");
}

export function isHashEncoding(value: unknown): value is HashEncoding {
  return typeof value === "string" && (HASH_ENCODINGS as readonly string[]).includes(value);
}

export function normalizeHashEncoding(value: unknown, fallback: HashEncoding = HASH_ENCODING_DEFAULT): HashEncoding {
  return isHashEncoding(value) ? value : fallback;
}

function formatWithEncoding(words: lib.WordArray, encoding: HashEncoding): string {
  if (encoding === "Bin") {
    return convertHexToBin(words.toString(enc.Hex));
  }

  return words.toString(enc[encoding]);
}

/** Hash `value` with `algo` and encode the digest. */
export function hashText(
  algo: HashAlgorithm,
  value: string,
  encoding: HashEncoding = HASH_ENCODING_DEFAULT,
): string {
  const hasher = ALGOS[algo];
  return formatWithEncoding(hasher(value), normalizeHashEncoding(encoding));
}

/** Compute digests for every supported algorithm. */
export function hashAll(
  value: string,
  encoding: HashEncoding = HASH_ENCODING_DEFAULT,
): Record<HashAlgorithm, string> {
  const safeEncoding = normalizeHashEncoding(encoding);
  const result = {} as Record<HashAlgorithm, string>;

  for (const algo of HASH_ALGORITHMS) {
    result[algo] = hashText(algo, value, safeEncoding);
  }

  return result;
}
