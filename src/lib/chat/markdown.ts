/**
 * Markdown rendering for chat replies.
 *
 * Kept out of the React component so the renderer rules and the block-splitting
 * behaviour can be tested directly.
 */
import MarkdownIt from "markdown-it";

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
});

const defaultFence =
  md.renderer.rules.fence ??
  ((tokens, idx, options, _env, self) =>
    self.renderToken(tokens, idx, options));

md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx]!;
  const info = (token.info || "").trim();
  const lang = info.split(/\s+/g)[0] || "";
  const raw = defaultFence(tokens, idx, options, env, self);
  const label = lang || "code";
  return `<div class="chat-code" data-lang="${md.utils.escapeHtml(label)}"><div class="chat-code__bar"><span class="chat-code__lang">${md.utils.escapeHtml(label)}</span><button type="button" class="chat-code__copy" data-chat-copy>Copy</button></div>${raw}</div>`;
};

// A bare <table> won't shrink below its min-content width, so a wide one
// overflows the bubble and makes the whole thread scroll sideways. Wrap it in
// its own scroll container, the same way fenced code blocks are handled.
// tabindex goes on the wrapper — the element that actually scrolls — so the
// table is reachable by keyboard and not only by touch.
md.renderer.rules.table_open = () =>
  '<div class="chat-table" tabindex="0"><table>';
md.renderer.rules.table_close = () => "</table></div>";

type MdToken = ReturnType<MarkdownIt["parse"]>[number];

/** Render a whole message to one HTML string. */
export function renderMarkdown(source: string): string {
  return md.render(source ?? "");
}

/**
 * Render each top-level markdown block to its own HTML string.
 *
 * Rendering a message as a single string means every streamed chunk reassigns
 * innerHTML for the entire subtree, which drops the reader's text selection,
 * resets table scroll offsets, and blows away focus. Splitting on top-level
 * blocks keeps completed blocks byte-identical between renders, so React skips
 * them and only the trailing block is touched.
 *
 * Concatenating the result is equivalent to `renderMarkdown` — the shared `env`
 * keeps link references resolvable across blocks.
 */
export function renderMarkdownBlocks(source: string): string[] {
  const env = {};
  const tokens = md.parse(source ?? "", env);
  const blocks: string[] = [];
  let group: MdToken[] = [];
  let depth = 0;

  for (const token of tokens) {
    group.push(token);
    depth += token.nesting;
    if (depth === 0) {
      blocks.push(md.renderer.render(group, md.options, env));
      group = [];
    }
  }
  // markdown-it balances its own output, so this is only a guard.
  if (group.length > 0) {
    blocks.push(md.renderer.render(group, md.options, env));
  }

  return blocks;
}
