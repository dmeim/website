/**
 * Email normalizer — line-by-line address cleanup for comparison / dedupe.
 * Parity with it-tools email-normalizer: `email-normalizer` package +
 * `withDefaultOnError` → `Unable to parse email: …`.
 */
import { normalizeEmail } from "email-normalizer";

export const DEFAULT_RAW_EMAILS = "";
export const PARSE_ERROR_PREFIX = "Unable to parse email: ";

/** Normalize a single email line; on failure return the it-tools error string. */
export function normalizeEmailLine(email: string): string {
  try {
    return normalizeEmail({ email });
  } catch {
    return `${PARSE_ERROR_PREFIX}${email}`;
  }
}

/**
 * Normalize newline-separated emails.
 * Empty input returns "" (matches it-tools early return).
 * Invalid lines become `Unable to parse email: <raw line>`. Blank lines stay blank, so a
 * trailing newline in a pasted list does not read as a bad address.
 */
export function normalizeEmails(rawEmails: string): string {
  if (!rawEmails) {
    return "";
  }

  return rawEmails
    .split(/\r?\n/)
    .map((line) => (line.trim() === "" ? "" : normalizeEmailLine(line)))
    .join("\n");
}
