# JSON to CSV

## Name
JSON to CSV (`json-to-csv`)

## Description
Convert a JSON array of objects to CSV. Parses with JSON5 (tolerant of unquoted keys and trailing commas), unions object keys for the header row in first-seen order, and serializes cell values with it-tools escaping rules.

## Toggles and Settings
None — live convert with no options.

## Inputs
- Raw JSON / JSON5 text (multiline) — expected to be an array of objects

## Outputs
- CSV text (live as you type)
- Copy to clipboard
- Validation error when the JSON is invalid

## Notes
- Parse: `JSON5.parse` (matches it-tools)
- Headers: union of all object keys in first-seen order (`Set` insertion order)
- Null → the string `null`; missing/undefined → empty cell
- Cells and headers follow RFC 4180, so CSV parsers and spreadsheets read them back: a cell with a comma, quote, or line break is wrapped in double quotes and `"` becomes `""`. it-tools wrote `\"` and literal `\n` instead, which those parsers misread.
- Nested objects and arrays are written as JSON (it-tools wrote `[object Object]`)
- Invalid JSON and anything other than an array of objects clear the output and show a message saying which it was
- Blank input is treated as valid and yields empty output
- Default sample input is empty (matches it-tools)
- Shared dep: `json5` (already used by sibling JSON converters)
- Persistence (`localStorage`) from it-tools is not ported; defaults reset on reload

## Source
Port of [it-tools JSON to CSV](https://it-tools.tech/json-to-csv). Local reference: handy-dandy `it-tools` (`src/tools/json-to-csv`). Catalogue id: `json-to-csv`.

## Files
- `src/lib/tools/json-to-csv/` — service, tests, README
- `src/components/tools/islands/JsonToCsv.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `json-to-csv`

## How to verify
```bash
npm test -- src/lib/tools/json-to-csv
npm run build
```
Open `/tools/json-to-csv`, paste a JSON array of objects, confirm CSV output and copy.
