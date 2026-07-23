/** Truncate first user message into a short chat title. */
export function titleFromPrompt(prompt: string, maxLen = 48): string {
  const collapsed = prompt.replace(/\s+/g, " ").trim();
  if (!collapsed) return "New chat";
  if (collapsed.length <= maxLen) return collapsed;
  const slice = collapsed.slice(0, maxLen - 1);
  const lastSpace = slice.lastIndexOf(" ");
  const base = lastSpace > maxLen * 0.4 ? slice.slice(0, lastSpace) : slice;
  return `${base.trimEnd()}…`;
}
