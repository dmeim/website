# XML to JSON

## Name
XML to JSON (`xml-to-json`)

## Description
Live convert XML to pretty-printed JSON in the browser. Uses `xml-js` with compact object mode.

## Toggles and Settings
None.

## Inputs
- XML text (multiline)

## Outputs
- Pretty-printed JSON with 2-space indent (live as you type)
- Copy to clipboard
- Validation error when the XML is invalid

## Notes
- Convert options: `{ compact: true }` (matches it-tools)
- Indent: 2 spaces (matches it-tools)
- Empty / whitespace-only input is treated as valid and yields `{}`
- Invalid XML clears the JSON output and shows “Provided XML is not valid.”
- Validation uses `xml-js` (not `xml-formatter`) so `json-to-xml` can share one dep
- Cluster dep: `xml-js` (shared with sibling `json-to-xml`)

## Source
Port of [it-tools XML to JSON](https://it-tools.tech/xml-to-json). Local reference: handy-dandy `it-tools` (`/xml-to-json`). Catalogue id: `xml-to-json`.

## Files
- `src/lib/tools/xml-to-json/` — service, tests, README
- `src/components/tools/islands/XmlToJson.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `xml-to-json`

## How to verify
```bash
npm test -- src/lib/tools/xml-to-json
npm run build
```
Open `/tools/xml-to-json`, paste XML, confirm JSON output and copy.
