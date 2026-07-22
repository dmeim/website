# YAML to JSON converter

## Name
YAML to JSON converter (`yaml-to-json-converter`)

## Description
Live convert YAML to pretty-printed JSON in the browser. Uses the `yaml` package with merge-key support (`<<` / anchors).

## Toggles and Settings
None.

## Inputs
- YAML text (multiline)

## Outputs
- Pretty-printed JSON with 3-space indent (live as you type)
- Copy to clipboard
- Validation error when the YAML is invalid

## Notes
- Parse options: `{ merge: true }` (enables YAML merge keys)
- Empty / null / falsy parsed values yield an empty output string (matches it-tools)
- Invalid YAML clears the JSON output and shows “Provided YAML is not valid.”
- Cluster deps (`yaml`, `iarna-toml-esm`, `json5`) are shared with sibling yaml/toml converters

## Source
Port of [it-tools YAML to JSON converter](https://it-tools.tech/yaml-to-json-converter). Local reference: handy-dandy `it-tools` (`/yaml-to-json-converter`). Catalogue id: `yaml-to-json-converter`.

## Files
- `src/lib/tools/yaml-to-json-converter/` — service, tests, README
- `src/components/tools/islands/YamlToJsonConverter.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `yaml-to-json-converter`

## How to verify
```bash
npm test -- src/lib/tools/yaml-to-json-converter
npm run build
```
Open `/tools/yaml-to-json-converter`, paste YAML, confirm JSON output and copy.
