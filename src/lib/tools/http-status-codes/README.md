# HTTP status codes

## Name
HTTP status codes (`http-status-codes`)

## Description
Browse and search the list of HTTP (and WebDAV) status codes with their names and meanings.

## Toggles and Settings
None — static reference table with a search filter.

## Inputs
- Search query (matches code number, name, description, or category)

## Outputs
- Categorized list of status codes (1xx–5xx), or a single “Search results” group when filtering
- Each entry shows code, name, description, and a WebDAV note when applicable

## Notes
- Data table copied from it-tools `http-status-codes.constants.ts` (no npm dependency)
- Search uses case-insensitive substring matching over code, name, description, category, and type (Fuse.js not required for this dataset)
- Empty query restores the five category groups; non-empty query collapses to “Search results”

## Source
Port of [it-tools HTTP status codes](https://it-tools.tech/http-status-codes). Local reference: handy-dandy `it-tools` (`src/tools/http-status-codes/`). Catalogue id: `http-status-codes`.

## Files
- `src/lib/tools/http-status-codes/` — data, service, tests, README
- `src/components/tools/islands/HttpStatusCodes.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `http-status-codes`

## How to verify
```bash
npm test -- src/lib/tools/http-status-codes
npm run build
```
Open `/tools/http-status-codes`, search for `404` / `teapot`, and confirm names and meanings match it-tools.
