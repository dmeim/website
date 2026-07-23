/**
 * Normalize assistant text for D1 persistence after streamText finish or abort.
 * Empty / whitespace-only text is skipped (no row) unless reasoning alone exists.
 *
 * When `steps` is present (onEnd / onAbort), join all steps — AI SDK's top-level
 * `text` / `reasoningText` are final-step-only and miss earlier tool-loop content.
 */
export function assistantContentToPersist(input: {
  text?: string | null;
  reasoningText?: string | null;
  steps?: Array<{ text?: string; reasoningText?: string }>;
}): { content: string; reasoning: string | null } | null {
  let content = "";
  let reasoning: string | null = null;

  if (input.steps?.length) {
    content = input.steps
      .map((step) => step.text ?? "")
      .join("")
      .trim();
  } else if (input.text != null) {
    content = input.text.trim();
  }

  if (input.steps?.length) {
    const joined = input.steps
      .map((step) => step.reasoningText ?? "")
      .join("")
      .trim();
    reasoning = joined || null;
  } else if (input.reasoningText != null) {
    const trimmed = input.reasoningText.trim();
    reasoning = trimmed || null;
  }

  if (!content && !reasoning) return null;
  return { content, reasoning };
}
