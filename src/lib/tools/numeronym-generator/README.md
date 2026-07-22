# Numeronym generator

## Name
Numeronym generator (`numeronym-generator`)

## Description
A numeronym is a word where a number forms an abbreviation. For example, `i18n` is a numeronym of `internationalization` where 18 is the number of letters between the first `i` and the last `n`.

## Toggles and Settings
None.

## Inputs
- Word (single-line text), e.g. `internationalization`

## Outputs
- Numeronym (readonly single-line text) with a copy control, e.g. `i18n`

## Notes
- Pure string logic; no npm dependencies
- Words with length ≤ 3 are returned unchanged
- Catalogue id: `numeronym-generator`

## Source
Port of [it-tools Numeronym generator](https://it-tools.tech/numeronym-generator). Local reference: handy-dandy `it-tools` (`/numeronym-generator`).

## Files
- `src/lib/tools/numeronym-generator/` — service, tests, README
- `src/components/tools/islands/NumeronymGenerator.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `numeronym-generator`

## How to verify
```bash
npm test -- src/lib/tools/numeronym-generator
npm run build
```
Open `/tools/numeronym-generator`, type `internationalization`, confirm `i18n`, and copy works.
