# Roman numeral converter

## Name
Roman numeral converter (`roman-numeral-converter`)

## Description
Convert Arabic numbers (1–3999) to Roman numerals and Roman numerals back to Arabic. Conversion runs entirely in the browser with no dependencies.

## Toggles and Settings
None.

## Inputs
- Arabic number (numeric; classic range 1–3999) for Arabic → Roman
- Uppercase Roman numeral string for Roman → Arabic

## Outputs
- Roman numeral for the Arabic panel (live as you type; empty when out of range)
- Arabic number for the Roman panel (live as you type; empty when invalid)
- Copy to clipboard on each panel

## Notes
- Arabic → Roman accepts floats in range and floors via the subtractive lookup (parity with it-tools)
- Values outside 1–3999 yield an empty Roman output and a validation hint
- Roman validation is case-sensitive and uses the classic form regex (empty string is valid and yields `0`)
- Invalid Roman input yields a null conversion (empty output) and a validation hint

## Source
Port of [it-tools Roman numeral converter](https://it-tools.tech/roman-numeral-converter). Local reference: handy-dandy `it-tools` (`/roman-numeral-converter`). Catalogue id: `roman-numeral-converter`.

## Files
- `src/lib/tools/roman-numeral-converter/` — service, tests, README
- `src/components/tools/islands/RomanNumeralConverter.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `roman-numeral-converter`

## How to verify
```bash
npm test -- src/lib/tools/roman-numeral-converter
npm run build
```
Open `/tools/roman-numeral-converter`, convert both ways (defaults 42 / XLII), try out-of-range Arabic and invalid Roman for validation hints, copy each output.
