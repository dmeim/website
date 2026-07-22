/**
 * Mask a string by replacing middle characters while optionally keeping
 * leading/trailing characters and spaces (parity with it-tools string-obfuscator).
 */

export type ObfuscateStringOptions = {
  replacementChar?: string;
  keepFirst?: number;
  keepLast?: number;
  keepSpace?: boolean;
};

export function obfuscateString(
  str: string,
  {
    replacementChar = "*",
    keepFirst = 4,
    keepLast = 0,
    keepSpace = true,
  }: ObfuscateStringOptions = {},
): string {
  return str
    .split("")
    .map((char, index, array) => {
      if (keepSpace && char === " ") {
        return char;
      }

      return index < keepFirst || index >= array.length - keepLast
        ? char
        : replacementChar;
    })
    .join("");
}
