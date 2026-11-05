import type { lib } from "crypto-js";
import { MD5, RIPEMD160, SHA1, SHA224, SHA256, SHA3, SHA384, SHA512, algo, enc, lib as cryptoLib } from "crypto-js";

/** it-tools hash-text algorithms in their original order, plus Keccak512. */
export const HASH_ALGORITHMS = [
  "MD5",
  "SHA1",
  "SHA256",
  "SHA224",
  "SHA512",
  "SHA384",
  "SHA3",
  "RIPEMD160",
  "Keccak512",
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

type HasherInternals = {
  _data: lib.WordArray;
  _process: (doFlush?: boolean) => unknown;
  _doFinalize: () => lib.WordArray;
};

const KeccakHasher = algo.SHA3 as unknown as HasherInternals & { extend: (overrides: object) => unknown };

// crypto-js's "SHA3" is pre-standard Keccak: it pads with 0x01 where FIPS 202 SHA-3 uses 0x06.
// Its padding is hardcoded, so the domain byte is corrected just before the last block is absorbed.
const Sha3Hasher = KeccakHasher.extend({
  _doFinalize(this: HasherInternals) {
    const data = this._data;
    const domainBit = data.sigBytes * 8;
    const absorb = this._process;

    this._process = function patchedProcess(this: HasherInternals, doFlush?: boolean) {
      this._process = absorb;
      data.words[domainBit >>> 5]! ^= 0x07 << (24 - (domainBit % 32));
      return absorb.call(this, doFlush);
    };

    return KeccakHasher._doFinalize.call(this);
  },
});

const hasherHelpers = cryptoLib.Hasher as unknown as {
  _createHelper: (hasher: unknown) => (message: string | lib.WordArray) => lib.WordArray;
  _createHmacHelper: (hasher: unknown) => (message: string | lib.WordArray, key: string | lib.WordArray) => lib.WordArray;
};

/** FIPS 202 SHA3-512, matching `openssl dgst -sha3-512`. */
export const sha3Digest = hasherHelpers._createHelper(Sha3Hasher);

/** HMAC over FIPS 202 SHA3-512. */
export const hmacSha3Digest = hasherHelpers._createHmacHelper(Sha3Hasher);

const ALGOS = {
  MD5,
  SHA1,
  SHA256,
  SHA224,
  SHA512,
  SHA384,
  SHA3: sha3Digest,
  RIPEMD160,
  Keccak512: SHA3,
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
