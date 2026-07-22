# SQL prettify

## Name
SQL prettify and format (`sql-prettify`)

## Description
Format and prettify SQL queries with dialect-aware formatting. Uses `sql-formatter` with selectable dialect, keyword case, and indent style.

## Toggles and Settings
- **Dialect** — SQL language dialect (default: Standard SQL / `sql`)
- **Keyword case** — `upper` | `lower` | `preserve` (default: `upper`)
- **Indent style** — `standard` | `tabularLeft` | `tabularRight` (default: `standard`)

Hidden defaults (match it-tools, not exposed in UI):
- `useTabs: false`
- `tabulateAlias: true`

## Inputs
- Raw SQL query text (multiline)

## Outputs
- Prettified SQL (live as you type)
- Copy to clipboard
- Error status when the formatter cannot parse the input

## Notes
- Formatter: `sql-formatter` `format()` (same package as it-tools, `^13`)
- Invalid / unparseable SQL clears the output and shows the formatter error
- Empty input yields empty output
- Default sample matches it-tools: `select field1,field2,field3 from my_table where my_condition;`
- Persistence (`localStorage`) from it-tools is not ported; defaults reset on reload

## Source
Port of [it-tools SQL prettify](https://it-tools.tech/sql-prettify). Local reference: handy-dandy `it-tools` (`src/tools/sql-prettify`). Catalogue id: `sql-prettify`.

## Files
- `src/lib/tools/sql-prettify/` — service, tests, README
- `src/components/tools/islands/SqlPrettify.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `sql-prettify`

## How to verify
```bash
npm test -- src/lib/tools/sql-prettify
npm run build
```
Open `/tools/sql-prettify`, paste SQL, change dialect / keyword case / indent style, confirm output and copy.
