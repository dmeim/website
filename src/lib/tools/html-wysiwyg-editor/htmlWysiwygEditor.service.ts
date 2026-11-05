/** Default document shown in it-tools (and persisted under the same storage key). */
export const DEFAULT_HTML =
  "<h1>Hey!</h1><p>Welcome to this html wysiwyg editor</p>";

/** localStorage key used by it-tools for this tool. */
export const HTML_WYSIWYG_STORAGE_KEY = "html-wysiwyg-editor--html";

/** Block-level tags TipTap StarterKit commonly emits. */
const CONTAINER_TAG = "ul|ol|li|blockquote|pre|hr|div|table|thead|tbody|tr|th|td";
const BLOCK_TAG = `h[1-6]|p|${CONTAINER_TAG}`;

/** Blocks that hold only inline content, so they read best on a single line. */
const LEAF_BLOCK = /<(h[1-6]|p)(?:\s[^>]*)?>.*?<\/\1>/gi;

const PRE_TOKEN = "\u0000";

/**
 * Lightweight HTML pretty-printer for TipTap/StarterKit output.
 * Avoids pulling Prettier; puts each block on its own line with indent.
 */
export function formatHtml(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) {
    return "";
  }

  const containerOpenOrClose = new RegExp(
    `(</?(?:${CONTAINER_TAG})(?:\\s[^>]*)?>)`,
    "gi",
  );

  // Whitespace inside <pre> is content, so code blocks skip the collapsing and indenting below.
  const preBlocks: string[] = [];
  const withoutPre = trimmed.replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/gi, (block) => {
    preBlocks.push(block);
    return `${PRE_TOKEN}${preBlocks.length - 1}${PRE_TOKEN}`;
  });

  const collapsed = withoutPre.replace(/\s+/g, " ");
  const rough = collapsed
    .replace(LEAF_BLOCK, "\n$&\n")
    .replace(containerOpenOrClose, "\n$1\n")
    .replace(new RegExp(`${PRE_TOKEN}\\d+${PRE_TOKEN}`, "g"), "\n$&\n")
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

    const restored = line.replace(
      new RegExp(`${PRE_TOKEN}(\\d+)${PRE_TOKEN}`),
      (_, index: string) => preBlocks[Number(index)] ?? "",
    );
    out.push(`${"  ".repeat(depth)}${restored}`);

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
