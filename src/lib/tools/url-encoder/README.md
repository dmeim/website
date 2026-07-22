# Encode/decode URL-formatted strings

## Name
Encode/decode URL-formatted strings (`url-encoder`)

## Description
Encode text to URL percent-encoding (`encodeURIComponent`), or decode percent-encoded strings back to text (`decodeURIComponent`). Runs entirely in the browser with native APIs — no dependencies.

## Toggles and Settings
None. Two independent panels (Encode / Decode).

## Inputs
- Cleartext string to encode (multiline)
- Percent-encoded string to decode (multiline)

## Outputs
- Percent-encoded string (live as you type)
- Decoded string (live as you type; empty when invalid)
- Copy to clipboard on each panel

## Notes
- Uses native `encodeURIComponent` / `decodeURIComponent` (parity with it-tools)
- Invalid decode input soft-fails to an empty output and shows a validation hint (“Impossible to parse this string”)
- Empty input yields an empty output on that panel
- Default sample values match it-tools: `Hello world :)` / `Hello%20world%20%3A)`

## Source
Port of [it-tools Encode/decode URL-formatted strings](https://it-tools.tech/url-encoder). Local reference: handy-dandy `it-tools` (`/url-encoder`). Catalogue id: `url-encoder`.

## Files
- `src/lib/tools/url-encoder/` — service, tests, README
- `src/components/tools/islands/UrlEncoder.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `url-encoder`

## How to verify
```bash
npm test -- src/lib/tools/url-encoder
npm run build
```
Open `/tools/url-encoder`, encode/decode both ways, paste a malformed sequence (e.g. `%`) to confirm the validation hint, copy each output.
