# Text diff

## Name
Text diff (`text-diff`)

## Description
Compare two texts and see the differences between them.

## Toggles and Settings
- None (live comparison; both panes are editable)

## Inputs
- Original text (multiline, default `original text`)
- Modified text (multiline, default `modified text`)

## Outputs
- Side-by-side line diff with added / removed / modified highlighting
- Character-level marks within modified lines
- Copyable unified diff (`+` / `-` / space prefixes)

## Notes
- it-tools uses Monaco DiffEditor; this port keeps the same dual-pane editable UX and defaults without shipping Monaco
- Line diffs via the `diff` package (`diffLines` / `diffChars`)
- Line numbers on unchanged rows follow each side, so they stay correct after an insert or removal
- A missing final newline on one side shows as a blank line, not a change to the last line
- Large input limits: line diff gives up after 500 ms and shows the texts as replaced, character highlighting has a 300 ms budget and skips very long lines, and only the first 2,000 rows render (the unified diff copy has all of them)
- Catalogue id: `text-diff`

## Source
Port of [it-tools Text diff](https://it-tools.tech/text-diff). Local reference: handy-dandy `it-tools` (`/text-diff`, UI: `src/ui/c-diff-editor`).

## Files
- `src/lib/tools/text-diff/` — service, tests, README
- `src/components/tools/islands/TextDiff.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `text-diff`

## How to verify
```bash
npm test -- src/lib/tools/text-diff
npm run build
```
Open `/tools/text-diff`, edit either pane, and confirm added/removed/modified highlights update live.
