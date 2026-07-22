import type { lib } from "crypto-js";
import {
  HmacMD5,
  HmacRIPEMD160,
  HmacSHA1,
  HmacSHA224,
  HmacSHA256,
  HmacSHA3,
  HmacSHA384,
  HmacSHA512,
  enc,
} from "crypto-js";

import {
  HASH_ALGORITHMS,
  HASH_ENCODING_DEFAULT,
  convertHexToBin,
  normalizeHashEncoding,
  type HashAlgorithm,
  type HashEncoding,
} from "@/lib/tools/hash-text";

export type { HashAlgorithm, HashEncoding };

export {
  HASH_ALGORITHMS,
  HASH_ENCODINGS,
  HASH_ENCODING_DEFAULT,
  HASH_ENCODING_OPTIONS,
  convertHexToBin,
  isHashEncoding,
  normalizeHashEncoding,
} from "@/lib/tools/hash-text";

/** Default hashing function (matches it-tools hmac-generator). */
export const HMAC_ALGORITHM_DEFAULT: HashAlgorithm = "SHA256";

const ALGOS = {
  MD5: HmacMD5,
  SHA1: HmacSHA1,
  SHA256: HmacSHA256,
  SHA224: HmacSHA224,
  SHA512: HmacSHA512,
  SHA384: HmacSHA384,
  SHA3: HmacSHA3,
  RIPEMD160: HmacRIPEMD160,
} as const satisfies Record<
  HashAlgorithm,
  (message: string | lib.WordArray, key: string | lib.WordArray) => lib.WordArray
>;

function formatWithEncoding(words: lib.WordArray, encoding: HashEncoding): string {
  if (encoding === "Bin") {
    return convertHexToBin(words.toString(enc.Hex));
  }

  return words.toString(enc[encoding]);
}

export function isHashAlgorithm(value: unknown): value is HashAlgorithm {
  return typeof value === "string" && (HASH_ALGORITHMS as readonly string[]).includes(value);
}

export function normalizeHashAlgorithm(
  value: unknown,
  fallback: HashAlgorithm = HMAC_ALGORITHM_DEFAULT,
): HashAlgorithm {
  return isHashAlgorithm(value) ? value : fallback;
}

/**
 * Compute an HMAC of `plainText` with `secret` using `algo`, then encode the digest.
 * Defaults to Hex encoding (it-tools parity).
 */
export function hmacText(
  algo: HashAlgorithm,
  plainText: string,
  secret: string,
  encoding: HashEncoding = HASH_ENCODING_DEFAULT,
): string {
  const hasher = ALGOS[normalizeHashAlgorithm(algo)];
  return formatWithEncoding(hasher(plainText, secret), normalizeHashEncoding(encoding));
}
