# List converter

## Name
List converter (`list-converter`)

## Description
Process newline-separated (column-based) lists: trim items, remove duplicates, convert to lowercase, reverse or sort, wrap each item and the whole list with prefix/suffix, and join with a custom separator. Conversion runs entirely in the browser — no dependencies.

## Toggles and Settings
- Trim list items (default on)
- Remove duplicates (default on)
- Convert to lowercase (default off)
- Keep line breaks (default off)
- Reverse list (default off; disables sort when on, matching it-tools)
- Sort list: none / ascending / descending (default none)
- Separator (default `, `)
- Item prefix / suffix
- List prefix / suffix

## Inputs
- Your input data (multiline text; one item per line)

## Outputs
Live transformed list (as you type), with copy.

## Notes
- Empty lines are dropped after optional trim
- Dedupe runs before trim (parity with it-tools / lodash `uniq` then `trim`)
- Lowercase is applied to the whole input before splitting on newlines
- Sort uses `localeCompare` (asc / desc)
- Catalogue description mentions “truncate”; it-tools UI/model has no truncate option — not implemented
- Settings are in-memory for the session (it-tools persisted via `useStorage`; we do not persist)

## Source
Port of [it-tools List converter](https://it-tools.tech/list-converter). Local reference: handy-dandy `it-tools` (`/list-converter`). Catalogue id: `list-converter`.

## Files
- `src/lib/tools/list-converter/` — service, tests, README
- `src/components/tools/islands/ListConverter.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `list-converter`

## How to verify
```bash
npm test -- src/lib/tools/list-converter
npm run build
```
Open `/tools/list-converter`, paste a multiline list, toggle trim/dedupe/sort/wrap options, confirm live output and copy.
