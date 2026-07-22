# Base64 string encoder/decoder

## Name
Base64 string encoder/decoder (`base64-string-converter`)

## Description
Encode and decode strings to/from Base64 (UTF-8). Optional URL-safe alphabet (`-`/`_`, no padding). Runs entirely in the browser with native `TextEncoder` / `btoa` / `atob` — no dependencies.

## Toggles and Settings
- **Encode URL safe** — when encoding, strip `=` padding and map `+`/`/` → `-`/`_`
- **Decode URL safe** — when decoding, accept URL-safe alphabet and missing padding

## Inputs
- Cleartext string to encode (multiline)
- Base64 string to decode (multiline; optional `data:*;base64,` prefix; trimmed in the UI)

## Outputs
- Base64 (or URL-safe Base64) of the cleartext (live as you type)
- Decoded string (live as you type; empty when invalid)
- Copy to clipboard on each panel

## Notes
- Encoding is UTF-8 via `TextEncoder` then `btoa` (parity with it-tools / js-base64)
- Invalid decode input soft-fails to an empty output and shows a validation hint
- Data-URI prefixes matching `data:…;base64,` are stripped before decode/validation
- Empty input yields an empty output on that panel

## Source
Port of [it-tools Base64 string converter](https://it-tools.tech/base64-string-converter). Local reference: handy-dandy `it-tools` (`/base64-string-converter`). Catalogue id: `base64-string-converter`.

## Files
- `src/lib/tools/base64-string-converter/` — service, tests, README
- `src/components/tools/islands/Base64StringConverter.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `base64-string-converter`

## How to verify
```bash
npm test -- src/lib/tools/base64-string-converter
npm run build
```
Open `/tools/base64-string-converter`, encode/decode both ways (with and without URL-safe), paste invalid base64 to confirm the validation hint, copy each output.
