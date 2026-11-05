import { splitGraphemes } from "../text-statistics/textStatistics.service";

/**
 * Build a numeronym: first letter + count of letters between first and last + last letter.
 * Words of length 3 or fewer are returned unchanged (same as it-tools).
 */
export function generateNumeronym(word: string): string {
  const trimmed = word.trim();
  const letters = splitGraphemes(trimmed);

  if (letters.length <= 3) {
    return trimmed;
  }

  return `${letters[0]}${letters.length - 2}${letters[letters.length - 1]}`;
}
