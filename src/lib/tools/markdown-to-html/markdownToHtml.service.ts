/**
 * Convert Markdown to HTML.
 * Parity with it-tools: default `markdown-it()` instance, `.render(input)`.
 */
import MarkdownIt from "markdown-it";

const md = new MarkdownIt();

/** Render Markdown to HTML using markdown-it defaults. */
export function markdownToHtml(input: string): string {
  return md.render(input);
}
