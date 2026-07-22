# Escape HTML entities

## Name
Escape HTML entities (`html-entities`)

## Description
Escape or unescape HTML entities — replace characters like `<`, `>`, `&`, `"`, and `'` with their HTML entity forms (and reverse). Runs entirely in the browser with a small escape map matching lodash `escape` / `unescape` (no dependencies).

## Toggles and Settings
None. Two independent panels (Escape / Unescape).

## Inputs
- Cleartext string to escape (multiline)
- Entity-encoded string to unescape (multiline)

## Outputs
- Escaped HTML string (live as you type)
- Unescaped string (live as you type)
- Copy to clipboard on each panel

## Notes
- Matches it-tools / lodash: `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`, `"` → `&quot;`, `'` → `&#39;`
- Unescape only reverses those five entities (not `&nbsp;`, numeric hex entities, etc.)
- Empty input yields an empty output on that panel
- Default sample values match it-tools: `<title>IT Tool</title>` / `&lt;title&gt;IT Tool&lt;/title&gt;`

## Source
Port of [it-tools Escape HTML entities](https://it-tools.tech/html-entities). Local reference: handy-dandy `it-tools` (`/html-entities`). Catalogue id: `html-entities`.

## Files
- `src/lib/tools/html-entities/` — service, tests, README
- `src/components/tools/islands/HtmlEntities.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `html-entities`

## How to verify
```bash
npm test -- src/lib/tools/html-entities
npm run build
```
Open `/tools/html-entities`, escape/unescape both ways, copy each output.
