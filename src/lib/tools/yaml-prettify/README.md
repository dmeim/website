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
- Parse / serialize: `yaml` npm package (`parseAllDocuments` + `stringify`). Multiple documents stay separated by `---`, where it-tools reports them as invalid.
- Options: `sortMapEntries`, `indent`
- Invalid YAML clears the output and shows “Provided YAML is not valid:” with the parser's reason and position
- Blank or comment-only input is treated as valid and yields empty output (it-tools shows `null`)
- Default raw input is empty (matches it-tools `useStorage` default)
- Shared dep: `yaml` (already used by YAML converters)
- Sort keys and indent size are remembered in `localStorage`. The pasted YAML is not, unlike it-tools, because it may be private.

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
