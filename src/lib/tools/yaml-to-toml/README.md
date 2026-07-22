# YAML to TOML

## Name
YAML to TOML (`yaml-to-toml`)

## Description
Live convert YAML to TOML in the browser. Parses with `yaml` and serializes with `iarna-toml-esm`.

## Toggles and Settings
None.

## Inputs
- YAML text (multiline)

## Outputs
- TOML text (live as you type)
- Copy to clipboard
- Validation error when the YAML is invalid

## Notes
- Parse: `yaml` `parse` (matches it-tools; no merge-key option)
- Serialize: `iarna-toml-esm` `stringify`, flattened and trimmed (matches it-tools)
- Empty / whitespace-only input yields an empty output string
- Invalid YAML clears the TOML output and shows “Provided YAML is not valid.”
- Top-level arrays are valid YAML but not valid TOML documents — conversion yields empty output
- Cluster deps (`yaml`, `iarna-toml-esm`, `json5`) are shared with sibling yaml/toml converters

## Source
Port of [it-tools YAML to TOML](https://it-tools.tech/yaml-to-toml). Local reference: handy-dandy `it-tools` (`/yaml-to-toml`). Catalogue id: `yaml-to-toml`.

## Files
- `src/lib/tools/yaml-to-toml/` — service, tests, README
- `src/components/tools/islands/YamlToToml.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `yaml-to-toml`

## How to verify
```bash
npm test -- src/lib/tools/yaml-to-toml
npm run build
```
Open `/tools/yaml-to-toml`, paste YAML, confirm TOML output and copy.
