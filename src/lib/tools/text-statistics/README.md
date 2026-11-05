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
- Character count (user-perceived characters, so an emoji or a letter with a combining mark counts as one)
- Word count (whitespace-split tokens, ignoring surrounding whitespace; `0` when blank)
- Line count (split on `\r\n` / `\r` / `\n`; `0` when empty)
- Byte size (UTF-8 via `TextEncoder`, formatted with `formatBytes`)

## Notes
- Pure string / `TextEncoder` / `Intl.Segmenter` logic; no npm dependencies
- `splitGraphemes` is also used by the numeronym generator and string obfuscator
- it-tools counts UTF-16 units and lets trailing whitespace add a word; both are deliberately fixed here
- Very large pastes full of emoji are slow because of Chromium's text shaping in the textarea, not the counting
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
