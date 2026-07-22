# JSON to TOML

## Name
JSON to TOML (`json-to-toml`)

## Description
Live convert JSON to TOML in the browser. Parses with JSON5 (tolerant of unquoted keys, trailing commas) and serializes with `iarna-toml-esm`.

## Toggles and Settings
None.

## Inputs
- JSON / JSON5 text (multiline)

## Outputs
- TOML text (live as you type)
- Copy to clipboard
- Validation error when the JSON is invalid

## Notes
- Parse: `JSON5.parse` (matches it-tools)
- Serialize: `iarna-toml-esm` `stringify`, flattened and trimmed (matches it-tools)
- Empty / whitespace-only input yields an empty output string
- Invalid JSON clears the TOML output and shows “Provided JSON is not valid.”
- Top-level arrays are valid JSON but not valid TOML documents — conversion yields empty output
- Cluster deps (`yaml`, `iarna-toml-esm`, `json5`) are shared with sibling yaml/toml converters

## Source
Port of [it-tools JSON to TOML](https://it-tools.tech/json-to-toml). Local reference: handy-dandy `it-tools` (`/json-to-toml`). Catalogue id: `json-to-toml`.

## Files
- `src/lib/tools/json-to-toml/` — service, tests, README
- `src/components/tools/islands/JsonToToml.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `json-to-toml`

## How to verify
```bash
npm test -- src/lib/tools/json-to-toml
npm run build
```
Open `/tools/json-to-toml`, paste JSON, confirm TOML output and copy.
