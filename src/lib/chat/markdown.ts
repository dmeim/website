/**
 * Markdown rendering for chat replies.
 *
 * Kept out of the React component so the renderer rules and the block-splitting
 * behaviour can be tested directly.
 */
import MarkdownIt from "markdown-it";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import csharp from "highlight.js/lib/languages/csharp";
import css from "highlight.js/lib/languages/css";
import diff from "highlight.js/lib/languages/diff";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import go from "highlight.js/lib/languages/go";
import ini from "highlight.js/lib/languages/ini";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import kotlin from "highlight.js/lib/languages/kotlin";
import lua from "highlight.js/lib/languages/lua";
import markdown from "highlight.js/lib/languages/markdown";
import php from "highlight.js/lib/languages/php";
import python from "highlight.js/lib/languages/python";
import ruby from "highlight.js/lib/languages/ruby";
import rust from "highlight.js/lib/languages/rust";
import sql from "highlight.js/lib/languages/sql";
import swift from "highlight.js/lib/languages/swift";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";

// Explicit registrations rather than highlight.js's "all" bundle, which would
// pull ~190 grammars into the chat island. Each grammar also registers its own
// aliases (ts, js, sh, py, yml, html, rs, …).
for (const [name, language] of [
  ["bash", bash],
  ["c", c],
  ["cpp", cpp],
  ["csharp", csharp],
  ["css", css],
  ["diff", diff],
  ["dockerfile", dockerfile],
  ["go", go],
  ["ini", ini],
  ["java", java],
  ["javascript", javascript],
  ["json", json],
  ["kotlin", kotlin],
  ["lua", lua],
  ["markdown", markdown],
  ["php", php],
  ["python", python],
  ["ruby", ruby],
  ["rust", rust],
  ["sql", sql],
  ["swift", swift],
  ["typescript", typescript],
  ["xml", xml],
  ["yaml", yaml],
] as const) {
  hljs.registerLanguage(name, language);
}

/**
 * Highlight a fence body, falling back to escaped plain text.
 *
 * `ignoreIllegals` matters here: while a reply streams, the trailing fence is
 * usually syntactically incomplete, and strict mode would throw on every chunk.
 */
function highlightFence(source: string, lang: string): string {
  const language = lang && hljs.getLanguage(lang) ? lang : null;
  if (!language) return md.utils.escapeHtml(source);
  try {
    return hljs.highlight(source, { language, ignoreIllegals: true }).value;
  } catch {
    return md.utils.escapeHtml(source);
  }
}

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
  highlight: highlightFence,
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
