/**
 * Encode/decode strings as Base64 (UTF-8), with optional URL-safe alphabet.
 * Native TextEncoder + btoa/atob — parity with it-tools (js-base64).
 */

export type Base64Options = {
  makeUrlSafe?: boolean;
};

export function textToBase64(
  str: string,
  { makeUrlSafe = false }: Base64Options = {},
): string {
  const encoded = bytesToBase64(new TextEncoder().encode(str));
  return makeUrlSafe ? makeUriSafe(encoded) : encoded;
}

export function base64ToText(
  str: string,
  { makeUrlSafe = false }: Base64Options = {},
): string {
  if (!isValidBase64(str, { makeUrlSafe })) {
    throw new Error("Incorrect base64 string");
  }

  let cleanStr = removePotentialDataAndMimePrefix(str);
  if (makeUrlSafe) {
    cleanStr = unURI(cleanStr);
  } else {
    cleanStr = cleanStr.replace(/\s/g, "");
  }

  try {
    return new TextDecoder().decode(base64ToBytes(cleanStr));
  } catch {
    throw new Error("Incorrect base64 string");
  }
}

/** Decode base64 to text; returns empty string on invalid input. */
export function base64ToTextSafe(
  str: string,
  options: Base64Options = {},
): string {
  try {
    return base64ToText(str, options);
  } catch {
    return "";
  }
}

export function removePotentialDataAndMimePrefix(str: string): string {
  return str.replace(/^data:.*?;base64,/, "");
}

export function isValidBase64(
  str: string,
  { makeUrlSafe = false }: Base64Options = {},
): boolean {
  let cleanStr = removePotentialDataAndMimePrefix(str);
  if (makeUrlSafe) {
    cleanStr = unURI(cleanStr);
  }

  try {
    const reEncodedBase64 = bytesToBase64(base64ToBytes(cleanStr));
    if (makeUrlSafe) {
      return removePotentialPadding(reEncodedBase64) === cleanStr;
    }
    return reEncodedBase64 === cleanStr.replace(/\s/g, "");
  } catch {
    return false;
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return globalThis.btoa(binary);
}

function base64ToBytes(str: string): Uint8Array {
  const padded = padBase64(str.replace(/\s/g, ""));
  const binary = globalThis.atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function padBase64(str: string): string {
  const pad = (4 - (str.length % 4)) % 4;
  return str + "=".repeat(pad);
}

function makeUriSafe(encoded: string): string {
  return encoded.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function unURI(encoded: string): string {
  return encoded
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .replace(/[^A-Za-z0-9+/]/g, "");
}

function removePotentialPadding(str: string): string {
  return str.replace(/=/g, "");
}
