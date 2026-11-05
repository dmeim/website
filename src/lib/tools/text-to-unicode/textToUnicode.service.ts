const MAX_CODE_POINT = 0x10ffff;

/**
 * Convert text to HTML decimal character entities (`&#N;`), one per code point.
 * HTML reads a surrogate entity as U+FFFD, so an emoji must be a single entity.
 */
export function convertTextToUnicode(text: string): string {
  return Array.from(text, (value) => `&#${value.codePointAt(0)};`).join("");
}

/**
 * Convert decimal (`&#N;`) and hex (`&#xN;`) entities back to text.
 * Non-entity text and numbers beyond Unicode are left unchanged. Surrogate pairs written
 * as two entities still combine, so output from the older per-code-unit form decodes.
 */
export function convertUnicodeToText(unicodeStr: string): string {
  return unicodeStr.replace(/&#(?:(\d+)|[xX]([0-9a-fA-F]+));/g, (match, dec?: string, hex?: string) => {
    const codePoint = dec ? Number(dec) : Number.parseInt(hex!, 16);
    return codePoint <= MAX_CODE_POINT ? String.fromCodePoint(codePoint) : match;
  });
}
