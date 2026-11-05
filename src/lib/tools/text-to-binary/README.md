# Text to ASCII binary

## Name
Text to ASCII binary (`text-to-binary`)

## Description
Convert text to its ASCII binary representation (space-separated 8-bit octets) and decode binary back to text. Conversion runs entirely in the browser with no dependencies.

## Toggles and Settings
None. Octet separator defaults to a single space (parity with it-tools).

## Inputs
- Cleartext string to convert to binary (multiline)
- ASCII binary string (0/1 digits; spaces and other noise are stripped) to convert back to text (multiline)

## Outputs
- Space-separated 8-bit binary for the text panel (live as you type)
- Decoded text for the binary panel (live as you type; empty when invalid)
- Copy to clipboard on each panel

## Notes
- ASCII encodes exactly as in it-tools. Beyond ASCII this uses UTF-8 bytes, so `é` is `11000011 10101001` where it-tools gives `11101001`, and every octet stays 8 bits so emoji round-trip
- Decoding strips non-`01` characters, then requires a multiple of 8 bits. Octets that are not valid UTF-8 read as Latin-1, so older `11101001` output still decodes
- Text with no `0` or `1` at all shows the validation hint
- Incomplete octets throw in the service; the island soft-fails to an empty output and shows a validation hint
- Empty input yields an empty output on that panel

## Source
Port of [it-tools Text to ASCII binary](https://it-tools.tech/text-to-binary). Local reference: handy-dandy `it-tools` (`/text-to-binary`). Catalogue id: `text-to-binary`.

## Files
- `src/lib/tools/text-to-binary/` — service, tests, README
- `src/components/tools/islands/TextToBinary.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `text-to-binary`

## How to verify
```bash
npm test -- src/lib/tools/text-to-binary
npm run build
```
Open `/tools/text-to-binary`, convert text both ways, paste incomplete binary to confirm the validation hint, copy each output.
