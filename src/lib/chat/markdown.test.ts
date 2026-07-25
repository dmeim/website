import { describe, expect, it } from "vitest";

import { renderMarkdown, renderMarkdownBlocks } from "./markdown";

const SAMPLE = `# Heading one

Some prose with a [ref link][a] and \`inline code\`.

## Table section

| Rank | Movie | Gross |
| ---: | :--- | ---: |
| 1 | Avatar | $2,923,710,708 |
| 2 | Avengers: Endgame | $2,799,439,100 |

- list item one
- list item two
  - nested item

> a blockquote
> spanning lines

\`\`\`ts
const x: number = 1;
\`\`\`

---

Trailing paragraph.

[a]: https://example.com
`;

describe("renderMarkdownBlocks", () => {
  it("concatenates to the same HTML as a whole-message render", () => {
    expect(renderMarkdownBlocks(SAMPLE).join("")).toBe(renderMarkdown(SAMPLE));
  });

  it("stays equivalent for every streaming prefix", () => {
    // Streaming replays the message one chunk at a time, so parity has to hold
    // for partial input too — not just the finished document.
    for (let i = 1; i <= SAMPLE.length; i += 7) {
      const prefix = SAMPLE.slice(0, i);
      expect(renderMarkdownBlocks(prefix).join("")).toBe(
        renderMarkdown(prefix),
      );
    }
  });

  it("keeps completed blocks byte-identical as text is appended", () => {
    const first = renderMarkdownBlocks("Alpha paragraph.\n\nBeta para");
    const later = renderMarkdownBlocks(
      "Alpha paragraph.\n\nBeta paragraph.\n\nGamma.",
    );
    // The leading block must not change, or React would replace its DOM.
    expect(later[0]).toBe(first[0]);
  });

  it("splits top-level blocks rather than returning one string", () => {
    const blocks = renderMarkdownBlocks("One.\n\nTwo.\n\nThree.");
    expect(blocks).toHaveLength(3);
    expect(blocks[0]).toContain("One.");
    expect(blocks[2]).toContain("Three.");
  });

  it("keeps a list as a single block", () => {
    expect(renderMarkdownBlocks("- a\n- b\n- c")).toHaveLength(1);
  });

  it("returns no blocks for empty input", () => {
    expect(renderMarkdownBlocks("")).toEqual([]);
  });
});

describe("renderMarkdown", () => {
  it("wraps tables in a focusable scroll container", () => {
    const html = renderMarkdown("| a | b |\n| --- | --- |\n| 1 | 2 |");
    expect(html).toContain('<div class="chat-table" tabindex="0"><table>');
    expect(html).toContain("</table></div>");
  });

  it("wraps fenced code with a language label and copy button", () => {
    const html = renderMarkdown("```ts\nconst x = 1;\n```");
    expect(html).toContain('class="chat-code" data-lang="ts"');
    expect(html).toContain("data-chat-copy");
  });

  it("labels unlabelled fences as code", () => {
    expect(renderMarkdown("```\nplain\n```")).toContain('data-lang="code"');
  });

  it("does not emit raw HTML from the model", () => {
    const html = renderMarkdown('<img src=x onerror="alert(1)">');
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });
});

describe("links", () => {
  it("opens markdown links in a new tab safely", () => {
    const html = renderMarkdown("[docs](https://example.com/docs)");
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("applies the same treatment to auto-linked bare URLs", () => {
    const html = renderMarkdown("see https://example.com for details");
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("still refuses javascript: URLs", () => {
    // markdown-it's validateLink rejects the scheme, so no anchor is produced
    // and the source stays inert literal text.
    const html = renderMarkdown("[x](javascript:alert(1))");
    expect(html).not.toContain("<a ");
    expect(html).not.toContain("href");
  });
});

describe("syntax highlighting", () => {
  it("tokenizes a known language", () => {
    const html = renderMarkdown("```ts\nconst x: number = 1;\n```");
    expect(html).toContain("hljs-keyword");
  });

  it("resolves language aliases", () => {
    expect(renderMarkdown("```py\nimport os\n```")).toContain("hljs-keyword");
    expect(renderMarkdown("```sh\necho hi\n```")).toContain("hljs-");
  });

  it("leaves unknown languages as escaped plain text", () => {
    const html = renderMarkdown("```notalanguage\na < b && c\n```");
    expect(html).not.toContain("hljs-");
    expect(html).toContain("a &lt; b &amp;&amp; c");
  });

  it("escapes fence content that is not highlighted", () => {
    const html = renderMarkdown("```\n<script>alert(1)</script>\n```");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("survives syntactically incomplete code mid-stream", () => {
    // Every prefix of a fence gets highlighted while the reply streams, so an
    // unterminated string or brace must not throw.
    const source = '```ts\nfunction f() {\n  const s = "unterminated';
    for (let i = 1; i <= source.length; i += 3) {
      expect(() => renderMarkdown(source.slice(0, i))).not.toThrow();
    }
  });
});
