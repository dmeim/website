/**
 * Convert text to HTML decimal character entities (`&#N;`) via charCodeAt.
 * BMP-oriented (matches it-tools): surrogate pairs are encoded per code unit.
 */
export function convertTextToUnicode(text: string): string {
  return text
    .split("")
    .map((value) => `&#${value.charCodeAt(0)};`)
    .join("");
}

/**
 * Convert HTML decimal entities (`&#N;`) back to text via fromCharCode.
 * Non-entity text is left unchanged.
 */
export function convertUnicodeToText(unicodeStr: string): string {
  return unicodeStr.replace(/&#(\d+);/g, (_match, dec: string) =>
    String.fromCharCode(Number(dec)),
  );
}
