/**
 * Encode/decode URL percent-encoding via native encodeURIComponent / decodeURIComponent.
 * Parity with it-tools url-encoder.
 */

/** Percent-encode a string (application/x-www-form-urlencoded component rules). */
export function encodeUrl(value: string): string {
  return encodeURIComponent(value);
}

/** Percent-decode a string. Throws URIError on malformed sequences. */
export function decodeUrl(value: string): string {
  return decodeURIComponent(value);
}

/**
 * Runs a conversion, returning null if it throws. The validators below must use this result:
 * minifiers treat encodeURIComponent and decodeURIComponent as pure, and delete a call whose
 * result goes unused, which made every value look valid in production.
 */
function attempt(convert: (value: string) => string, value: string): string | null {
  try {
    return convert(value);
  } catch {
    return null;
  }
}

/** Encode; returns empty string on unexpected failure. */
export function encodeUrlSafe(value: string): string {
  return attempt(encodeUrl, value) ?? "";
}

/** Decode; returns empty string on malformed percent-encoding. */
export function decodeUrlSafe(value: string): string {
  return attempt(decodeUrl, value) ?? "";
}

/** True when encodeURIComponent succeeds for the value. */
export function canEncodeUrl(value: string): boolean {
  return attempt(encodeUrl, value) !== null;
}

/** True when decodeURIComponent succeeds for the value. */
export function canDecodeUrl(value: string): boolean {
  return attempt(decodeUrl, value) !== null;
}
