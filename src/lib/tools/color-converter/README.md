# Color converter

## Name
Color converter (`color-converter`)

## Description
Convert a color between hex, rgb, hsl, hwb, lch, cmyk, and CSS color name (with closest-name fallback). Includes a native color picker. Conversion runs in the browser via `colord` (same library as it-tools) for format parity.

## Toggles and Settings
None — every field is an editable live input. Changing any valid format updates the others.

## Inputs
- Color picker (`#rrggbb`)
- hex (e.g. `#ff0000`)
- rgb (e.g. `rgb(255, 0, 0)`)
- hsl (e.g. `hsl(0, 100%, 50%)`)
- hwb (e.g. `hwb(0 0% 0%)`)
- lch (e.g. `lch(53.24% 104.55 40.85)`)
- cmyk (e.g. `device-cmyk(0% 100% 100% 0%)`)
- name (e.g. `red` / closest CSS name)

## Outputs
Live (as you type), each with copy:
- Same set of formats as inputs — editing one reformats the rest when valid

## Notes
- Default seed color is `#1ea54c` (matches it-tools)
- Empty input is allowed and does not clear sibling fields
- Invalid non-empty input shows a field error and leaves siblings unchanged
- Name output uses colord `toName({ closest: true })` (falls back to `Unknown`)
- Native color picker is opaque `#rrggbb` only (alpha is dropped for the picker field)
- Uses `colord` + cmyk/hwb/lch/names plugins for parity with it-tools

## Source
Port of [it-tools Color converter](https://it-tools.tech/color-converter). Local reference: handy-dandy `it-tools` (`/color-converter`). Catalogue id: `color-converter`.

## Files
- `src/lib/tools/color-converter/` — service, tests, README
- `src/components/tools/islands/ColorConverter.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `color-converter`

## How to verify
```bash
npm test -- src/lib/tools/color-converter
npm run build
```
Open `/tools/color-converter`, confirm the default green, type `olive` in name, check hex/rgb/hsl update, try an invalid hex, copy a result.
