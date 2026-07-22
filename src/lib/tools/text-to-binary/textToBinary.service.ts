/**
 * Convert text to ASCII binary (8-bit octets via charCodeAt) and back.
 * BMP-oriented (matches it-tools): surrogate pairs are encoded per code unit.
 */

export function convertTextToAsciiBinary(
  text: string,
  { separator = " " }: { separator?: string } = {},
): string {
  return text
    .split("")
    .map((char) => char.charCodeAt(0).toString(2).padStart(8, "0"))
    .join(separator);
}

export function convertAsciiBinaryToText(binary: string): string {
  const cleanBinary = binary.replace(/[^01]/g, "");

  if (cleanBinary.length % 8) {
    throw new Error("Invalid binary string");
  }

  return cleanBinary
    .split(/(\d{8})/)
    .filter(Boolean)
    .map((octet) => String.fromCharCode(Number.parseInt(octet, 2)))
    .join("");
}

/** True when the string cleans to complete 8-bit octets (or empty). */
export function isValidAsciiBinary(binary: string): boolean {
  try {
    convertAsciiBinaryToText(binary);
    return true;
  } catch {
    return false;
  }
}

/** Decode binary to text; returns empty string on invalid input. */
export function convertAsciiBinaryToTextSafe(binary: string): string {
  try {
    return convertAsciiBinaryToText(binary);
  } catch {
    return "";
  }
}
