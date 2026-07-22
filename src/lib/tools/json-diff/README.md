# JSON diff

## Name
JSON diff (`json-diff`)

## Description
Compare two JSON objects (JSON5-tolerant) and show a nested structural diff: added, removed, updated, and unchanged values.

## Toggles and Settings
- **Only show differences** — hide unchanged keys/entries in the result tree

## Inputs
- First JSON (multiline, JSON5 accepted)
- JSON to compare (multiline, JSON5 accepted)

## Outputs
- Nested diff tree with added / removed / updated highlighting
- Message when both inputs parse to equal values
- Click a highlighted value to copy it
- Validation errors for invalid JSON

## Notes
- Parsing uses `json5` (same as it-tools)
- Diff algorithm ports it-tools `json-diff.models` without lodash (`areDeepEqual` replaces `_.isEqual`)
- Results appear only when both sides parse successfully
- Empty input is treated as “not ready” (no result), matching it-tools

## Source
Port of [it-tools JSON diff](https://it-tools.tech/json-diff). Local reference: handy-dandy `it-tools` (`/json-diff`). Catalogue id: `json-diff`.

## Files
- `src/lib/tools/json-diff/` — service, types, tests, README
- `src/components/tools/islands/JsonDiff.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `json-diff`

## How to verify
```bash
npm test -- src/lib/tools/json-diff
npm run build
```
Open `/tools/json-diff`, paste two JSON objects, toggle “Only show differences”, and confirm highlight colors.
