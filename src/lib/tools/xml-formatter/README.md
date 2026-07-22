# XML formatter

## Name
XML formatter (`xml-formatter`)

## Description
Prettify an XML string into a friendly, human-readable format. Trims input, validates by attempting format, and pretty-prints with configurable indent size and optional collapse of simple text content onto one line.

## Toggles and Settings
- **Collapse content** — keep simple element text on the same line as its tags (default: on)
- **Indent size** — spaces per indent level (0–10, default: 2)

## Inputs
- Raw XML text (multiline)

## Outputs
- Formatted XML (live as you type)
- Copy to clipboard
- Validation error when the XML is invalid

## Notes
- Format: `xml-formatter` npm package (matches it-tools)
- Options: `indentation` (spaces), `collapseContent`, `lineSeparator: '\n'`
- Invalid XML clears the output and shows “Provided XML is not valid.”
- Empty / whitespace-only input is treated as valid and yields empty output
- Default sample input matches it-tools: `<hello><world>foo</world><world>bar</world></hello>`
- Persistence (`localStorage`) from it-tools is not ported; defaults reset on reload

## Source
Port of [it-tools XML formatter](https://it-tools.tech/xml-formatter). Local reference: handy-dandy `it-tools` (`src/tools/xml-formatter`). Catalogue id: `xml-formatter`.

## Files
- `src/lib/tools/xml-formatter/` — service, tests, README
- `src/components/tools/islands/XmlFormatter.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `xml-formatter`

## How to verify
```bash
npm test -- src/lib/tools/xml-formatter
npm run build
```
Open `/tools/xml-formatter`, paste XML, toggle collapse / indent, confirm output and copy.
