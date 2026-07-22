/**
 * Build a numeronym: first letter + count of letters between first and last + last letter.
 * Words of length 3 or fewer are returned unchanged (same as it-tools).
 */
export function generateNumeronym(word: string): string {
  const wordLength = word.length;

  if (wordLength <= 3) {
    return word;
  }

  return `${word.at(0)}${wordLength - 2}${word.at(-1)}`;
}
