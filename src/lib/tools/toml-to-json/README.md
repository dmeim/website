# TOML to JSON

## Name
TOML to JSON (`toml-to-json`)

## Description
Live convert TOML to pretty-printed JSON in the browser. Uses `iarna-toml-esm` for parsing.

## Toggles and Settings
None.

## Inputs
- TOML text (multiline)

## Outputs
- Pretty-printed JSON with 3-space indent (live as you type)
- Copy to clipboard
- Validation error when the TOML is invalid

## Notes
- Empty input yields an empty output string (matches it-tools short-circuit)
- Invalid TOML clears the JSON output and shows “Provided TOML is not valid.”
- Cluster deps (`yaml`, `iarna-toml-esm`, `json5`) are shared with sibling yaml/toml converters

## Source
Port of [it-tools TOML to JSON](https://it-tools.tech/toml-to-json). Local reference: handy-dandy `it-tools` (`/toml-to-json`). Catalogue id: `toml-to-json`.

## Files
- `src/lib/tools/toml-to-json/` — service, tests, README
- `src/components/tools/islands/TomlToJson.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `toml-to-json`

## How to verify
```bash
npm test -- src/lib/tools/toml-to-json
npm run build
```
Open `/tools/toml-to-json`, paste TOML, confirm JSON output and copy.
