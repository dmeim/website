# URL parser

## Name
URL parser (`url-parser`)

## Description
Parse an absolute URL into its separate constituent parts — protocol, username, password, hostname, port, path, query string, and individual query parameters. Runs entirely in the browser via the native `URL` API (no dependencies).

## Toggles and Settings
None. Live parse as you type.

## Inputs
- Absolute URL string (single line)

## Outputs
- Protocol, username, password, hostname, port, path, params (`search`), and hash, each copyable
- A table of query parameters, with the name and value each copyable
- Validation error when the input is not a valid absolute URL

## Notes
- Requires an absolute URL (`https://…`); relative paths are invalid
- Default sample matches it-tools: `https://me:pwd@it-tools.tech:3000/url-parser?key1=value&key2=value2#the-hash`
- Every value of a repeated query key is listed (it-tools keeps only the last one)
- Empty input is a clean state and shows no error

## Source
Port of [it-tools URL parser](https://it-tools.tech/url-parser). Local reference: handy-dandy `it-tools` (`/url-parser`). Catalogue id: `url-parser`.

## Files
- `src/lib/tools/url-parser/` — service, tests, README
- `src/components/tools/islands/UrlParser.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `url-parser`

## How to verify
```bash
npm test -- src/lib/tools/url-parser
npm run build
```
Open `/tools/url-parser`, confirm parts update live, copy a field and a query param.
