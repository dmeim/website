import { AES, RC4, Rabbit, TripleDES, enc } from "crypto-js";

/** Algorithms supported by the Encrypt / decrypt text tool (it-tools parity). */
export const ENCRYPTION_ALGORITHMS = ["AES", "TripleDES", "Rabbit", "RC4"] as const;

export type EncryptionAlgorithm = (typeof ENCRYPTION_ALGORITHMS)[number];

/** Default algorithm (matches it-tools encryption). */
export const ENCRYPTION_ALGORITHM_DEFAULT: EncryptionAlgorithm = "AES";

/** Sample plaintext shown on first load (it-tools parity). */
export const ENCRYPTION_SAMPLE_PLAINTEXT = "Lorem ipsum dolor sit amet";

/** Sample secret shown on first load (it-tools parity). */
export const ENCRYPTION_SAMPLE_SECRET = "my secret key";

/**
 * Sample AES ciphertext that decrypts to {@link ENCRYPTION_SAMPLE_PLAINTEXT}
 * with {@link ENCRYPTION_SAMPLE_SECRET} (it-tools default decrypt seed).
 */
export const ENCRYPTION_SAMPLE_CIPHERTEXT =
  "U2FsdGVkX1/EC3+6P5dbbkZ3e1kQ5o2yzuU0NHTjmrKnLBEwreV489Kr0DIB+uBs";

/** Stable UI / tryDecrypt message (does not leak crypto-js internals). */
export const DECRYPT_ERROR_MESSAGE = "Unable to decrypt your text";

/** Base64 of the OpenSSL `Salted__` magic — crypto-js ciphertext prefix. */
export const OPENSSL_SALTED_BASE64_PREFIX = "U2FsdGVkX1";

const ALGOS = {
  AES,
  TripleDES,
  Rabbit,
  RC4,
} as const;

export type DecryptResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

export function isEncryptionAlgorithm(value: unknown): value is EncryptionAlgorithm {
  return typeof value === "string" && (ENCRYPTION_ALGORITHMS as readonly string[]).includes(value);
}

export function normalizeEncryptionAlgorithm(
  value: unknown,
  fallback: EncryptionAlgorithm = ENCRYPTION_ALGORITHM_DEFAULT,
): EncryptionAlgorithm {
  return isEncryptionAlgorithm(value) ? value : fallback;
}

/**
 * Encrypt `plaintext` with `secret` using `algo`.
 * Returns OpenSSL-compatible Salted__ Base64 (crypto-js default).
 */
export function encryptText(
  algo: EncryptionAlgorithm,
  plaintext: string,
  secret: string,
): string {
  return ALGOS[normalizeEncryptionAlgorithm(algo)].encrypt(plaintext, secret).toString();
}

/**
 * Decrypt OpenSSL Salted__ Base64 `ciphertext` with `secret` using `algo`.
 * May throw (e.g. Malformed UTF-8) when the key/algo/ciphertext do not match.
 */
export function decryptText(
  algo: EncryptionAlgorithm,
  ciphertext: string,
  secret: string,
): string {
  return ALGOS[normalizeEncryptionAlgorithm(algo)]
    .decrypt(ciphertext, secret)
    .toString(enc.Utf8);
}

/**
 * Safe decrypt wrapper for UI. Maps throws and empty failure modes to a stable error.
 * Note: a successful decrypt of an empty plaintext also yields `""`; that edge case
 * is reported as failure when the ciphertext is non-empty.
 */
export function tryDecrypt(
  algo: EncryptionAlgorithm,
  ciphertext: string,
  secret: string,
): DecryptResult {
  try {
    const text = decryptText(algo, ciphertext, secret);
    if (ciphertext.length > 0 && text.length === 0) {
      return { ok: false, error: DECRYPT_ERROR_MESSAGE };
    }
    return { ok: true, text };
  } catch {
    return { ok: false, error: DECRYPT_ERROR_MESSAGE };
  }
}
