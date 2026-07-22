/**
 * Convert Arabic numbers (1–3999) to Roman numerals and back.
 * Matches it-tools roman-numeral-converter behavior.
 */

export const MIN_ARABIC_TO_ROMAN = 1;
export const MAX_ARABIC_TO_ROMAN = 3999;

export function arabicToRoman(num: number): string {
  if (num < MIN_ARABIC_TO_ROMAN || num > MAX_ARABIC_TO_ROMAN) {
    return "";
  }

  const lookup: Record<string, number> = {
    M: 1000,
    CM: 900,
    D: 500,
    CD: 400,
    C: 100,
    XC: 90,
    L: 50,
    XL: 40,
    X: 10,
    IX: 9,
    V: 5,
    IV: 4,
    I: 1,
  };
  let roman = "";
  for (const i in lookup) {
    while (num >= lookup[i]!) {
      roman += i;
      num -= lookup[i]!;
    }
  }
  return roman;
}

const ROMAN_NUMBER_REGEX =
  /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

export function isValidRomanNumber(romanNumber: string): boolean {
  return ROMAN_NUMBER_REGEX.test(romanNumber);
}

/** Convert a Roman numeral to Arabic; returns null when invalid. */
export function romanToArabic(s: string): number | null {
  if (!isValidRomanNumber(s)) {
    return null;
  }
  const map: Record<string, number> = {
    I: 1,
    V: 5,
    X: 10,
    L: 50,
    C: 100,
    D: 500,
    M: 1000,
  };
  return [...s].reduce(
    (r, c, i, chars) =>
      (map[chars[i + 1]!] ?? 0) > (map[c] ?? 0)
        ? r - (map[c] ?? 0)
        : r + (map[c] ?? 0),
    0,
  );
}
