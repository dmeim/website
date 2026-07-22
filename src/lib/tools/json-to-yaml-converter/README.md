# JSON to YAML converter

## Name
JSON to YAML converter (`json-to-yaml-converter`)

## Description
Live convert JSON to YAML in the browser. Parses with JSON5 (tolerant of unquoted keys, trailing commas) and serializes with the `yaml` package.

## Toggles and Settings
None.

## Inputs
- JSON / JSON5 text (multiline)

## Outputs
- YAML text (live as you type)
- Copy to clipboard
- Validation error when the JSON is invalid

## Notes
- Parse: `JSON5.parse` (matches it-tools)
- Serialize: `yaml.stringify` (default options)
- Invalid JSON clears the YAML output and shows “Provided JSON is not valid.”
- Empty input is treated as valid and yields empty output
- Cluster deps (`yaml`, `iarna-toml-esm`, `json5`) are shared with sibling yaml/toml converters

## Source
Port of [it-tools JSON to YAML converter](https://it-tools.tech/json-to-yaml-converter). Local reference: handy-dandy `it-tools` (`/json-to-yaml-converter`). Catalogue id: `json-to-yaml-converter`.

## Files
- `src/lib/tools/json-to-yaml-converter/` — service, tests, README
- `src/components/tools/islands/JsonToYamlConverter.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `json-to-yaml-converter`

## How to verify
```bash
npm test -- src/lib/tools/json-to-yaml-converter
npm run build
```
Open `/tools/json-to-yaml-converter`, paste JSON, confirm YAML output and copy.
