# TOML to YAML

## Name
TOML to YAML (`toml-to-yaml`)

## Description
Live convert TOML to YAML in the browser. Uses `iarna-toml-esm` for parsing and `yaml` for stringify.

## Toggles and Settings
None.

## Inputs
- TOML text (multiline)

## Outputs
- YAML (live as you type)
- Copy to clipboard
- Validation error when the TOML is invalid

## Notes
- Empty or whitespace-only input yields an empty output string (matches it-tools trim short-circuit)
- Invalid TOML clears the YAML output and shows “Provided TOML is not valid.”
- Cluster deps (`yaml`, `iarna-toml-esm`, `json5`) are shared with sibling yaml/toml converters

## Source
Port of [it-tools TOML to YAML](https://it-tools.tech/toml-to-yaml). Local reference: handy-dandy `it-tools` (`/toml-to-yaml`). Catalogue id: `toml-to-yaml`.

## Files
- `src/lib/tools/toml-to-yaml/` — service, tests, README
- `src/components/tools/islands/TomlToYaml.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `toml-to-yaml`

## How to verify
```bash
npm test -- src/lib/tools/toml-to-yaml
npm run build
```
Open `/tools/toml-to-yaml`, paste TOML, confirm YAML output and copy.
