/**
 * Decode Outlook SafeLink-wrapped URLs to the original destination.
 * Parity with it-tools safelink-decoder — native URL API only.
 */

const SAFELINKS_HOST_RE = /\.safelinks\.protection\.outlook\.com/;

/** True when the string looks like an Outlook SafeLinks host. */
export function isSafeLinksUrl(value: string): boolean {
  return SAFELINKS_HOST_RE.test(value);
}

/**
 * Extract the original destination from an Outlook SafeLinks URL.
 * Throws when the host is not a SafeLinks protection domain.
 * Returns `null` when the `url` query param is missing.
 */
export function decodeSafeLinksURL(safeLinksUrl: string): string | null {
  if (!isSafeLinksUrl(safeLinksUrl)) {
    throw new Error("Invalid SafeLinks URL provided");
  }

  return new URL(safeLinksUrl).searchParams.get("url");
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
    return { ok: true, url: url ?? "" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid SafeLinks URL provided";
    return { ok: false, error: message };
  }
}
