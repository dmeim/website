/** ICAO / NATO phonetic alphabet — A…Z (case-insensitive lookup). */
export const NATO_ALPHABET = [
  "Alpha",
  "Bravo",
  "Charlie",
  "Delta",
  "Echo",
  "Foxtrot",
  "Golf",
  "Hotel",
  "India",
  "Juliet",
  "Kilo",
  "Lima",
  "Mike",
  "November",
  "Oscar",
  "Papa",
  "Quebec",
  "Romeo",
  "Sierra",
  "Tango",
  "Uniform",
  "Victor",
  "Whiskey",
  "X-ray",
  "Yankee",
  "Zulu",
] as const;

export type NatoWord = (typeof NATO_ALPHABET)[number];

function letterIndex(character: string): number {
  return character.toLowerCase().charCodeAt(0) - "a".charCodeAt(0);
}

/**
 * Convert text to a space-joined NATO phonetic string.
 * Letters map case-insensitively to Alpha…Zulu; all other characters pass through.
 */
export function textToNatoAlphabet(text: string): string {
  return text
    .split("")
    .map((character) => {
      const index = letterIndex(character);
      return NATO_ALPHABET[index] ?? character;
    })
    .join(" ");
}
