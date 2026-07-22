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

/** Encode; returns empty string on unexpected failure. */
export function encodeUrlSafe(value: string): string {
  try {
    return encodeUrl(value);
  } catch {
    return "";
  }
}

/** Decode; returns empty string on malformed percent-encoding. */
export function decodeUrlSafe(value: string): string {
  try {
    return decodeUrl(value);
  } catch {
    return "";
  }
}

/** True when encodeURIComponent succeeds for the value. */
export function canEncodeUrl(value: string): boolean {
  try {
    encodeUrl(value);
    return true;
  } catch {
    return false;
  }
}

/** True when decodeURIComponent succeeds for the value. */
export function canDecodeUrl(value: string): boolean {
  try {
    decodeUrl(value);
    return true;
  } catch {
    return false;
  }
}
