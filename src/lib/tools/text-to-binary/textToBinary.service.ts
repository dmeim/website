/**
 * Convert text to binary octets and back. ASCII matches it-tools exactly. Anything beyond
 * ASCII is UTF-8, because 16-bit code units cannot split into octets and survive the trip back.
 */

export function convertTextToAsciiBinary(
  text: string,
  { separator = " " }: { separator?: string } = {},
): string {
  return Array.from(new TextEncoder().encode(text), (byte) =>
    byte.toString(2).padStart(8, "0"),
  ).join(separator);
}

export function convertAsciiBinaryToText(binary: string): string {
  const cleanBinary = binary.replace(/[^01]/g, "");

  if (cleanBinary.length % 8) {
    throw new Error("Invalid binary string");
  }

  const bytes = Uint8Array.from(cleanBinary.match(/.{8}/g) ?? [], (octet) =>
    Number.parseInt(octet, 2),
  );

  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    // Not UTF-8, so read each octet as Latin-1, as it-tools does for every input.
    return Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  }
}

/** True when the string cleans to complete 8-bit octets, or is blank. Text with no bits at all is not binary. */
export function isValidAsciiBinary(binary: string): boolean {
  if (binary.trim() !== "" && !/[01]/.test(binary)) return false;
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
