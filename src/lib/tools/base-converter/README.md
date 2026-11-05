# Integer base converter

## Name
Integer base converter (`base-converter`)

## Description
Convert an integer between numeric bases 2–64 (binary, octal, decimal, hexadecimal, base64 alphabet, and a custom target base). Conversion runs entirely in the browser with BigInt — no dependencies.

## Toggles and Settings
- Input base (2–64; default 10)
- Custom output base (2–64; default 42)

## Inputs
- Input number (string of digits valid for the chosen input base)
- Input base (integer 2–64)

## Outputs
Live (as you type), each with copy:
- Binary (2)
- Octal (8)
- Decimal (10)
- Hexadecimal (16)
- Base64 (64) — uses the it-tools digit alphabet `0-9a-zA-Z+/`
- Custom base (chosen output base)

## Notes
- Invalid digits for the input base clear all outputs and show an error message, and so does a base outside 2 to 64
- Empty input leaves the outputs blank (the service still converts `""` as `0`)
- Large integers keep full precision via BigInt (parity with it-tools), up to 100,000 digits so a stray paste cannot freeze the tab
- Surrounding whitespace is ignored
- Alphabet is case-sensitive for bases above 36 (`a` ≠ `A`); at 36 and below, `FF` and `ff` are the same number

## Source
Port of [it-tools Integer base converter](https://it-tools.tech/base-converter). Local reference: handy-dandy `it-tools` (`/integer-base-converter`; catalogue path `/base-converter`). Catalogue id: `base-converter`.

## Files
- `src/lib/tools/base-converter/` — service, tests, README
- `src/components/tools/islands/BaseConverter.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `base-converter`

## How to verify
```bash
npm test -- src/lib/tools/base-converter
npm run build
```
Open `/tools/base-converter`, convert the default `42` (base 10), try an invalid digit for the input base, change the custom output base, copy each result.
