# WordCode Generator

## Name
WordCode Generator (`word-code`)

## Description
Builds friendly word + number codes from bundled JSON word categories. Useful for classroom passwords, short labels, and local mnemonic-style codes. All generation runs in the browser.

## Toggles and Settings
- **Category selection** — multi-select table of bundled word lists (Select All / Select None)
- **Word length range** — dual-range filter over selected words
- **Digits** — numeric suffix/prefix length (1–8)
- **Digits position** — at end (`Word00`) or start (`00Word`)
- **Randomize word order**
- **Allow words to repeat**
- **Word case** — as listed, capitalize, upper, lower, random letter capitalization
- **Results count** — how many codes to generate (1–1000)
- **Output format** — column/newline or single line with separator
- **Separator / custom separator / spaces after separators** (line format only)

## Inputs
- Bundled category JSON under `src/lib/tools/word-code/data/categories/`
- Optional extra words (textarea: one word per line or comma-separated)

## Outputs
- Generated code list in the output panel
- Copy to clipboard of the formatted output string

## Notes
- Category load failures surface as status/error messages and block generation until data loads
- Length filter clamps as the known word pool changes
- Behavior lives in `wordCode.service.ts`; the React island is presentation only

## Source
Custom dmeim.com tool (not an it-tools port). Catalogue id: `word-code-generator`.

## Files
- `src/lib/tools/word-code/` — service, types, category JSON, README
- `src/components/tools/islands/WordCodeGenerator.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `word-code-generator`

## How to verify
```bash
npm test -- src/lib/tools/word-code
npm run build
```
Open `/tools/word-code-generator`, select categories, Generate, Copy.
