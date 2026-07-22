/**
 * Generate an HTTP Basic Authorization header from username + password.
 * Native TextEncoder + btoa — parity with it-tools basic-auth-generator.
 */

/** UTF-8 string → standard Base64 (btoa of encoded bytes). */
export function textToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return globalThis.btoa(binary);
}

/** `username:password` credential string for Basic Auth. */
export function basicAuthCredentials(username: string, password: string): string {
  return `${username}:${password}`;
}

/** Base64 of `username:password`. */
export function basicAuthToken(username: string, password: string): string {
  return textToBase64(basicAuthCredentials(username, password));
}

/**
 * Full Authorization header line:
 * `Authorization: Basic <base64(username:password)>`
 */
export function basicAuthHeader(username: string, password: string): string {
  return `Authorization: Basic ${basicAuthToken(username, password)}`;
}
