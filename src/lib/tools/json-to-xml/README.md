# JSON to XML

## Name
JSON to XML (`json-to-xml`)

## Description
Live convert JSON (JSON5-tolerant) to compact XML in the browser. Uses `xml-js` with compact object mode.

## Toggles and Settings
None.

## Inputs
- JSON / JSON5 text (multiline)

## Outputs
- Compact XML (live as you type)
- Copy to clipboard
- Validation error when the JSON is invalid

## Notes
- Parse: `JSON5.parse` (matches it-tools — unquoted keys, trailing commas)
- Convert options: `{ compact: true }` (matches it-tools)
- Opens with the it-tools sample, `{"a":{"_attributes":{"x":"1.234","y":"It's"}}}`
- Empty or whitespace-only input is treated as valid and yields empty output
- `<`, `&`, and `>` in attribute values are escaped, which `xml-js` leaves undone
- Output is checked by parsing it back, so a top-level list or value, or a key that is not an XML name (such as `a b`), shows an error instead of broken XML
- Invalid JSON clears the XML output and shows “Provided JSON is not valid.”
- Cluster dep: `xml-js` (shared with sibling `xml-to-json`); also uses existing `json5`

## Source
Port of [it-tools JSON to XML](https://it-tools.tech/json-to-xml). Local reference: handy-dandy `it-tools` (`/json-to-xml`). Catalogue id: `json-to-xml`.

## Files
- `src/lib/tools/json-to-xml/` — service, tests, README
- `src/components/tools/islands/JsonToXml.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `json-to-xml`

## How to verify
```bash
npm test -- src/lib/tools/json-to-xml
npm run build
```
Open `/tools/json-to-xml`, paste JSON, confirm XML output and copy.
