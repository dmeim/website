/**
 * Decode Outlook SafeLink-wrapped URLs to the original destination.
 * Parity with it-tools safelink-decoder — native URL API only.
 */

const SAFELINKS_HOST_SUFFIX = ".safelinks.protection.outlook.com";

export const NOT_A_SAFELINK_MESSAGE =
  "This is not an Outlook SafeLink. Paste a full link whose address ends in .safelinks.protection.outlook.com.";
export const MISSING_URL_MESSAGE =
  "This SafeLink has no url parameter, so there is no destination to decode. Copy the whole link and try again.";

/** Mail clients often hand over the link HTML-escaped, and without a protocol when copied as text. */
function parseLink(value: string): URL | null {
  const unescaped = value.trim().replace(/&amp;/g, "&");
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(unescaped) ? unescaped : `https://${unescaped}`;
  try {
    return new URL(candidate);
  } catch {
    return null;
  }
}

/** True when the link's host, not just some part of its text, is an Outlook SafeLinks host. */
export function isSafeLinksUrl(value: string): boolean {
  return parseLink(value)?.hostname.toLowerCase().endsWith(SAFELINKS_HOST_SUFFIX) ?? false;
}

/**
 * Extract the original destination from an Outlook SafeLinks URL.
 * Throws when the host is not a SafeLinks protection domain.
 * Returns `null` when the `url` query param is missing.
 */
export function decodeSafeLinksURL(safeLinksUrl: string): string | null {
  const link = parseLink(safeLinksUrl);
  if (!link || !isSafeLinksUrl(safeLinksUrl)) {
    throw new Error("Invalid SafeLinks URL provided");
  }

  return link.searchParams.get("url");
}

export type DecodeSafeLinksResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Non-throwing decode for the UI. Empty input → empty success.
 * Invalid host / unparseable URL → error result.
 */
export function decodeSafeLinksURLSafe(safeLinksUrl: string): DecodeSafeLinksResult {
  const trimmed = safeLinksUrl.trim();
  if (!trimmed) {
    return { ok: true, url: "" };
  }

  try {
    const url = decodeSafeLinksURL(trimmed);
    return url ? { ok: true, url } : { ok: false, error: MISSING_URL_MESSAGE };
  } catch {
    return { ok: false, error: NOT_A_SAFELINK_MESSAGE };
  }
}
