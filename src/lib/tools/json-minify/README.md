# JSON minify

## Name
JSON minify (`json-minify`)

## Description
Minify and compress JSON by removing unnecessary whitespace. Parses with JSON5 (tolerant of unquoted keys and trailing commas) and stringifies with zero indent.

## Toggles and Settings
None — live minify with no options.

## Inputs
- Raw JSON / JSON5 text (multiline)

## Outputs
- Minified JSON (live as you type)
- Copy to clipboard
- Validation error when the JSON is invalid

## Notes
- Parse: `JSON5.parse` (matches it-tools)
- Serialize: `JSON.stringify(..., null, 0)`
- Invalid JSON clears the output and shows “Provided JSON is not valid.”
- Empty input is treated as valid and yields empty output
- Default sample input matches it-tools: pretty-printed `{"hello":["world"]}`
- Shared dep: `json5` (already used by sibling JSON converters)
- Persistence (`localStorage`) from it-tools is not ported; defaults reset on reload

## Source
Port of [it-tools JSON minify](https://it-tools.tech/json-minify). Local reference: handy-dandy `it-tools` (`src/tools/json-minify`). Catalogue id: `json-minify`.

## Files
- `src/lib/tools/json-minify/` — service, tests, README
- `src/components/tools/islands/JsonMinify.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `json-minify`

## How to verify
```bash
npm test -- src/lib/tools/json-minify
npm run build
```
Open `/tools/json-minify`, paste JSON, confirm minified output and copy.
