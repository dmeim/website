# YAML prettify

## Name
YAML prettify and format (`yaml-prettify`)

## Description
Prettify a YAML string into a friendly, human-readable format. Parses with the `yaml` package, optionally sorts map entries, and stringifies with a configurable indent size.

## Toggles and Settings
- **Sort keys** — sort map entries via `yaml.stringify` `sortMapEntries` (default: off)
- **Indent size** — spaces per indent level (1–10, default: 2)

## Inputs
- Raw YAML text (multiline)

## Outputs
- Prettified YAML (live as you type)
- Copy to clipboard
- Validation error when the YAML is invalid

## Notes
- Parse / serialize: `yaml` npm package (`parse` + `stringify`) — matches it-tools
- Options: `sortMapEntries`, `indent`
- Invalid YAML clears the output and shows “Provided YAML is not valid.”
- Empty input is treated as valid; `yaml.parse('')` is `null`, so output is `"null\n"` (it-tools / package parity)
- Default raw input is empty (matches it-tools `useStorage` default)
- Shared dep: `yaml` (already used by YAML converters)
- Persistence (`localStorage`) from it-tools is not ported; defaults reset on reload

## Source
Port of [it-tools YAML prettify](https://it-tools.tech/yaml-prettify). Local reference: handy-dandy `it-tools` (`src/tools/yaml-viewer`, path `/yaml-prettify`). Catalogue id: `yaml-prettify`.

## Files
- `src/lib/tools/yaml-prettify/` — service, tests, README
- `src/components/tools/islands/YamlPrettify.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `yaml-prettify`

## How to verify
```bash
npm test -- src/lib/tools/yaml-prettify
npm run build
```
Open `/tools/yaml-prettify`, paste YAML, toggle sort keys / indent, confirm output and copy.
