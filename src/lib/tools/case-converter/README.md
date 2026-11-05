# Case converter

## Name
Case converter (`case-converter`)

## Description
Transform a string into common case formats (camel, snake, kebab/param, Pascal, constant, and more), including a playful “mocking” alternating case. Conversion runs entirely in the browser with a native port of change-case@4 algorithms — no dependencies.

## Toggles and Settings
None. All formats are computed live from the input.

## Inputs
- Your string (single-line text; default sample matches it-tools: `lorem ipsum dolor sit amet`)

## Outputs
Fourteen live formats, each with its own copy control:
Lowercase, Uppercase, Camelcase, Capitalcase, Constantcase, Dotcase, Headercase, Nocase, Paramcase, Pascalcase, Pathcase, Sentencecase, Snakecase, Mockingcase.

## Notes
- Word splitting matches change-case@4 (`fooBar` / `XMLHttpRequest` boundaries)
- Letters, combining marks, and digits in any script are kept; everything else separates words. For Latin text the results match `change-case@4`. it-tools kept only Latin letters, which deleted digits and all text in scripts like Cyrillic.
- Lowercase / Uppercase use `toLocaleLowerCase` / `toLocaleUpperCase` (parity with it-tools)
- Mockingcase alternates character case by index (`index % 2`) and does not strip punctuation
- Empty results show an en dash and have no copy control
- Catalogue id: `case-converter`

## Source
Port of [it-tools Case converter](https://it-tools.tech/case-converter). Local reference: handy-dandy `it-tools` (`/case-converter`). Algorithms: change-case@4 family with it-tools `stripRegexp`.

## Files
- `src/lib/tools/case-converter/` — service, tests, README
- `src/components/tools/islands/CaseConverter.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `case-converter`

## How to verify
```bash
npm test -- src/lib/tools/case-converter
npm run build
```
Open `/tools/case-converter`, edit the input, confirm all formats update and copy works.
