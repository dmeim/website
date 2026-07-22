# Regex memo

## Name
Regex memo (`regex-memo`)

## Description
JavaScript regular-expression cheatsheet covering character classes, whitespace, sets, escaping, quantifiers, boundaries, lookarounds, and grouping/capturing.

## Toggles and Settings
None — static reference with an optional search filter.

## Inputs
- Search query (matches section title, group title, expression, description, or notes)

## Outputs
- Categorized tables of Expression → Description rows (Normal characters, Whitespace, Character set, Escaping, Quantifiers, Boundaries, Matching, Grouping and capturing)
- Section notes where the source memo includes them
- References (MDN, RegExplained) and a link to the Regex tester tool
- Non-empty search collapses matches into a single “Search results” group

## Notes
- Content copied from it-tools `regex-memo.content.md` (no npm dependency)
- Search uses case-insensitive substring matching (same pattern as `git-memo` / `http-status-codes`)
- Empty query restores the nine source sections; it-tools itself only rendered the markdown with no search — search is a site-native affordance on the same content
- Copy uses the primary expression token when a row lists alternatives (`a or b`)

## Source
Port of [it-tools Regex cheatsheet](https://it-tools.tech/regex-memo). Local reference: handy-dandy `it-tools` (`src/tools/regex-memo/`). Catalogue id: `regex-memo`.

## Files
- `src/lib/tools/regex-memo/` — data, service, tests, README
- `src/components/tools/islands/RegexMemo.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `regex-memo`

## How to verify
```bash
npm test -- src/lib/tools/regex-memo
npm run build
```
Open `/tools/regex-memo`, confirm the sections and expressions match it-tools, search for `\\d` / `lookahead` / `negate`, copy an expression, and open the Regex tester link.
