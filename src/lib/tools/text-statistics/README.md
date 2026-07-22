# Text statistics

## Name
Text statistics (`text-statistics`)

## Description
Get information about a text: character count, word count, line count, and UTF-8 byte size.

## Toggles and Settings
None.

## Inputs
- Text (multiline textarea), e.g. `Your text...`

## Outputs
- Character count (`text.length`)
- Word count (whitespace-split tokens; `0` when empty)
- Line count (split on `\r\n` / `\r` / `\n`; `0` when empty)
- Byte size (UTF-8 via `TextEncoder`, formatted with `formatBytes`)

## Notes
- Pure string / `TextEncoder` logic; no npm dependencies
- Word and line counts match it-tools template quirks (empty → 0; trailing whitespace can inflate word count)
- Catalogue id: `text-statistics`

## Source
Port of [it-tools Text statistics](https://it-tools.tech/text-statistics). Local reference: handy-dandy `it-tools` (`/text-statistics`).

## Files
- `src/lib/tools/text-statistics/` — service, tests, README
- `src/components/tools/islands/TextStatistics.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `text-statistics`

## How to verify
```bash
npm test -- src/lib/tools/text-statistics
npm run build
```
Open `/tools/text-statistics`, paste sample text, and confirm character / word / line / byte size update live.
