# String obfuscator

## Name
String obfuscator (`string-obfuscator`)

## Description
Obfuscate a string (like a secret, an IBAN, or a token) to make it shareable and identifiable without revealing its content.

## Toggles and Settings
- Keep first (integer ≥ 0, default `4`) — number of leading characters left visible
- Keep last (integer ≥ 0, default `4` in the UI; service default `0`) — number of trailing characters left visible
- Keep spaces (toggle, default on) — leave space characters unmasked

## Inputs
- String to obfuscate (multiline text), e.g. `Lorem ipsum dolor sit amet`

## Outputs
- Obfuscated string (readonly, monospace) with a copy control, using `*` as the mask character

## Notes
- Pure string logic; no npm dependencies
- Replacement character is fixed to `*` in the UI (service accepts `replacementChar` for parity/tests)
- Overlapping keep-first / keep-last ranges leave the whole string visible
- Catalogue id: `string-obfuscator`

## Source
Port of [it-tools String obfuscator](https://it-tools.tech/string-obfuscator). Local reference: handy-dandy `it-tools` (`/string-obfuscator`).

## Files
- `src/lib/tools/string-obfuscator/` — service, tests, README
- `src/components/tools/islands/StringObfuscator.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `string-obfuscator`

## How to verify
```bash
npm test -- src/lib/tools/string-obfuscator
npm run build
```
Open `/tools/string-obfuscator`, keep defaults, confirm `Lore* ***** ***** *** amet`, and copy works.
