# Markdown to HTML

## Name
Markdown to HTML (`markdown-to-html`)

## Description
Live convert Markdown to HTML in the browser. Uses `markdown-it` with default options. Includes copy and print-as-PDF actions.

## Toggles and Settings
None.

## Inputs
- Markdown text (multiline)

## Outputs
- HTML (live as you type)
- Copy to clipboard
- Print as PDF (opens a print window with the rendered HTML)

## Notes
- Convert: `new MarkdownIt().render(input)` (matches it-tools defaults)
- Empty input yields empty HTML
- Print opens a new window, writes the HTML body, then calls `window.print()`
- Dep: `markdown-it` ^14 (same major as it-tools)

## Source
Port of [it-tools Markdown to HTML](https://it-tools.tech/markdown-to-html). Local reference: handy-dandy `it-tools` (`/markdown-to-html`). Catalogue id: `markdown-to-html`.

## Files
- `src/lib/tools/markdown-to-html/` — service, tests, README
- `src/components/tools/islands/MarkdownToHtml.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `markdown-to-html`

## How to verify
```bash
npm test -- src/lib/tools/markdown-to-html
npm run build
```
Open `/tools/markdown-to-html`, paste Markdown, confirm HTML output, copy, and print.
