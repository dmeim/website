/** Default document shown in it-tools (and persisted under the same storage key). */
export const DEFAULT_HTML =
  "<h1>Hey!</h1><p>Welcome to this html wysiwyg editor</p>";

/** localStorage key used by it-tools for this tool. */
export const HTML_WYSIWYG_STORAGE_KEY = "html-wysiwyg-editor--html";

/** Block-level tags TipTap StarterKit commonly emits. */
const BLOCK_TAG =
  "h[1-6]|p|ul|ol|li|blockquote|pre|hr|div|table|thead|tbody|tr|th|td";

/**
 * Lightweight HTML pretty-printer for TipTap/StarterKit output.
 * Avoids pulling Prettier; keeps block tags on their own lines with indent.
 */
export function formatHtml(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) {
    return "";
  }

  const blockOpenOrClose = new RegExp(
    `(</?(?:${BLOCK_TAG})(?:\\s[^>]*)?>)`,
    "gi",
  );

  const collapsed = trimmed.replace(/\s*\n\s*/g, " ").replace(/\s+/g, " ");
  const rough = collapsed
    .replace(blockOpenOrClose, "\n$1\n")
    .replace(/\n+/g, "\n")
    .trim();

  const lines = rough
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  let depth = 0;
  const out: string[] = [];

  for (const line of lines) {
    const isClosing = new RegExp(`^</(?:${BLOCK_TAG})\\b`, "i").test(line);
    const isVoidHr = /^<hr\b/i.test(line);
    const isOpening =
      new RegExp(`^<(?:${BLOCK_TAG})\\b`, "i").test(line) &&
      !line.startsWith("</") &&
      !isVoidHr;
    const openAndClose = /^<([a-z0-9]+)[^>]*>[\s\S]*<\/\1>$/i.test(line);

    if (isClosing) {
      depth = Math.max(0, depth - 1);
    }

    out.push(`${"  ".repeat(depth)}${line}`);

    if (isOpening && !openAndClose) {
      depth += 1;
    }
  }

  return out.join("\n");
}

/**
 * Normalize editor HTML for display/copy: trim and treat TipTap's empty
 * document (`<p></p>`) as empty.
 */
export function normalizeEditorHtml(html: string): string {
  const trimmed = html.trim();
  if (!trimmed || trimmed === "<p></p>") {
    return "";
  }
  return trimmed;
}

/**
 * Format HTML for the live source pane (normalize then pretty-print).
 */
export function formatEditorHtml(html: string): string {
  const normalized = normalizeEditorHtml(html);
  if (!normalized) {
    return "";
  }
  return formatHtml(normalized);
}

/**
 * Read persisted HTML from localStorage (browser only). Falls back to default.
 */
export function readStoredHtml(
  storage: Pick<Storage, "getItem"> | null | undefined = typeof localStorage !==
    "undefined"
    ? localStorage
    : null,
): string {
  if (!storage) {
    return DEFAULT_HTML;
  }
  try {
    const value = storage.getItem(HTML_WYSIWYG_STORAGE_KEY);
    if (value == null || value === "") {
      return DEFAULT_HTML;
    }
    return value;
  } catch {
    return DEFAULT_HTML;
  }
}

/**
 * Persist HTML to localStorage (browser only). No-ops when unavailable.
 */
export function writeStoredHtml(
  html: string,
  storage: Pick<Storage, "setItem"> | null | undefined = typeof localStorage !==
    "undefined"
    ? localStorage
    : null,
): void {
  if (!storage) {
    return;
  }
  try {
    storage.setItem(HTML_WYSIWYG_STORAGE_KEY, html);
  } catch {
    // Quota / private mode — ignore.
  }
}
