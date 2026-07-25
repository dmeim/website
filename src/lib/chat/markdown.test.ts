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
