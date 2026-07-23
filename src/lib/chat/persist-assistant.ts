/**
 * Normalize assistant text for D1 persistence after streamText finish or abort.
 * Empty / whitespace-only text is skipped (no row).
 */
export function assistantContentToPersist(input: {
  text?: string | null;
  steps?: Array<{ text?: string }>;
}): string | null {
  if (input.text != null) {
    const trimmed = input.text.trim();
    return trimmed || null;
  }
  if (input.steps?.length) {
    const trimmed = input.steps
      .map((step) => step.text ?? "")
      .join("")
      .trim();
    return trimmed || null;
  }
  return null;
}
