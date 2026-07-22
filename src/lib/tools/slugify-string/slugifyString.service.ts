import slugify from "@sindresorhus/slugify";

/**
 * Slugify a string for URLs, filenames, and IDs.
 * Uses `@sindresorhus/slugify` defaults (same as it-tools): lowercase, `-`
 * separator, decamelize, and built-in replacements (`&`→and, `♥`→love, etc.).
 * Returns `""` on empty input or unexpected errors.
 */
export function slugifyString(input: string): string {
  if (!input) {
    return "";
  }

  try {
    return slugify(input);
  } catch {
    return "";
  }
}
