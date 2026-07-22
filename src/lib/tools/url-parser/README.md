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
- Protocol, username, password, hostname, port, path, and params (`search`) — each copyable
- Individual query parameter key/value pairs — each copyable
- Validation error when the input is not a valid absolute URL

## Notes
- Requires an absolute URL (`https://…`); relative paths are invalid
- Default sample matches it-tools: `https://me:pwd@it-tools.tech:3000/url-parser?key1=value&key2=value2#the-hash`
- Duplicate query keys keep the last value (same as it-tools `Object.fromEntries`)
- Hash / origin / href are available from the service but the UI mirrors it-tools’ property list

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
