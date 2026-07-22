# JSON prettify

## Name
JSON prettify and format (`json-prettify`)

## Description
Prettify a JSON string into a friendly, human-readable format. Parses with JSON5 (tolerant of unquoted keys and trailing commas), optionally sorts object keys alphabetically, and stringifies with a configurable indent size.

## Toggles and Settings
- **Sort keys** — recursively sort object keys with `localeCompare` (default: on)
- **Indent size** — spaces used by `JSON.stringify` (0–10, default: 3)

## Inputs
- Raw JSON / JSON5 text (multiline)

## Outputs
- Prettified JSON (live as you type)
- Copy to clipboard
- Validation error when the JSON is invalid

## Notes
- Parse: `JSON5.parse` (matches it-tools)
- Serialize: `JSON.stringify(..., null, indentSize)`
- Invalid JSON clears the output and shows “Provided JSON is not valid.”
- Empty input is treated as valid and yields empty output
- Default sample input matches it-tools: `{"hello": "world", "foo": "bar"}`
- Shared dep: `json5` (already used by sibling JSON converters)
- Persistence (`localStorage`) from it-tools is not ported; defaults reset on reload

## Source
Port of [it-tools JSON prettify](https://it-tools.tech/json-prettify). Local reference: handy-dandy `it-tools` (`src/tools/json-viewer`, path `/json-prettify`, redirect from `/json-viewer`). Catalogue id: `json-prettify`.

## Files
- `src/lib/tools/json-prettify/` — service, tests, README
- `src/components/tools/islands/JsonPrettify.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `json-prettify`

## How to verify
```bash
npm test -- src/lib/tools/json-prettify
npm run build
```
Open `/tools/json-prettify`, paste JSON, toggle sort keys / indent, confirm output and copy.
