/** Minimum RSA modulus length (bits), matching it-tools validation. */
export const RSA_BITS_MIN = 256;
/** Maximum RSA modulus length (bits), matching it-tools validation. */
export const RSA_BITS_MAX = 16384;
/** Default modulus length (bits). */
export const RSA_BITS_DEFAULT = 2048;
/**
 * Auto-regenerate when bits change only up to this size.
 * Larger keys need an explicit Refresh (Web Crypto can take a long time).
 */
export const RSA_BITS_AUTO_REGEN_MAX = 4096;

export const RSA_PUBLIC_EXPONENT = new Uint8Array([0x01, 0x00, 0x01]); // 65537
export const RSA_HASH = "SHA-256" as const;
export const RSA_ALGORITHM = "RSA-OAEP" as const;

export const RSA_PUBLIC_PEM_LABEL = "PUBLIC KEY";
export const RSA_PRIVATE_PEM_LABEL = "PRIVATE KEY";

export interface RsaKeyPairPem {
  publicKeyPem: string;
  privateKeyPem: string;
}

export interface GenerateRsaKeyPairOptions {
  bits?: number;
}

/** True when bits is an integer in [256, 16384] and a multiple of 8. */
export function isValidRsaBits(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= RSA_BITS_MIN &&
    value <= RSA_BITS_MAX &&
    value % 8 === 0
  );
}

/**
 * Parse and normalize bits into a valid modulus length.
 * Non-finite input falls back to `fallback`. Otherwise clamps to range and
 * rounds to the nearest multiple of 8.
 */
export function normalizeRsaBits(value: unknown, fallback = RSA_BITS_DEFAULT): number {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value));

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  const rounded = Math.round(parsed / 8) * 8;
  return Math.min(RSA_BITS_MAX, Math.max(RSA_BITS_MIN, rounded));
}

/** Encode an ArrayBuffer as standard Base64 (browser `btoa` or Node `Buffer`). */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);

  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }

  return btoa(binary);
}

/**
 * Wrap Base64 as a PEM block with 64-column body lines.
 * `label` is the PEM type (e.g. `PUBLIC KEY`, `PRIVATE KEY`).
 */
export function wrapPem(base64: string, label: string): string {
  const compact = base64.replace(/\s+/g, "");
  const lines = compact.match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----`;
}

/** Export a DER ArrayBuffer as a PEM string with 64-column wrapping. */
export function arrayBufferToPem(buffer: ArrayBuffer, label: string): string {
  return wrapPem(arrayBufferToBase64(buffer), label);
}

function requireSubtle(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("Web Crypto SubtleCrypto is not available in this environment.");
  }
  return subtle;
}

/**
 * Generate an RSA-OAEP key pair and return SPKI + PKCS#8 PEM strings.
 * Uses Web Crypto only (no node-forge).
 */
export async function generateRsaKeyPair(
  options: GenerateRsaKeyPairOptions = {},
): Promise<RsaKeyPairPem> {
  const bits = normalizeRsaBits(options.bits);

  if (!isValidRsaBits(bits)) {
    throw new Error(
      `Bits should be ${RSA_BITS_MIN} <= bits <= ${RSA_BITS_MAX} and be a multiple of 8.`,
    );
  }

  const subtle = requireSubtle();

  const keyPair = await subtle.generateKey(
    {
      name: RSA_ALGORITHM,
      modulusLength: bits,
      publicExponent: RSA_PUBLIC_EXPONENT,
      hash: RSA_HASH,
    },
    true,
    ["encrypt", "decrypt"],
  );

  const [spki, pkcs8] = await Promise.all([
    subtle.exportKey("spki", keyPair.publicKey),
    subtle.exportKey("pkcs8", keyPair.privateKey),
  ]);

  return {
    publicKeyPem: arrayBufferToPem(spki, RSA_PUBLIC_PEM_LABEL),
    privateKeyPem: arrayBufferToPem(pkcs8, RSA_PRIVATE_PEM_LABEL),
  };
}
