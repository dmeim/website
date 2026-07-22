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
