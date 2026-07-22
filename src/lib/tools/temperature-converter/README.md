# Temperature converter

## Name
Temperature converter (`temperature-converter`)

## Description
Convert a temperature across Kelvin, Celsius, Fahrenheit, Rankine, Delisle, Newton, Réaumur, and Rømer. Edit any scale and the others update through Kelvin. Pure client-side arithmetic — no npm dependency.

## Toggles and Settings
None.

## Inputs
Eight linked number fields, one per scale. Changing any field recalculates the rest.

## Outputs
All eight scale values stay in sync. The edited field keeps the typed value; other scales are truncated toward −∞ to two decimal places (`Math.floor(n * 100) / 100`), matching it-tools.

## Notes
- Hub scale is Kelvin
- Empty / non-finite input does not update the other fields
- Initial state is 0 K (and the floored equivalents on every other scale)
- Flooring uses `Math.floor`, so IEEE float noise can show e.g. `273.14` instead of `273.15` when converting from Celsius 0 (same as it-tools)
- No external libraries

## Source
Port of [it-tools Temperature converter](https://it-tools.tech/temperature-converter). Local reference: handy-dandy `it-tools` (`/temperature-converter`). Catalogue id: `temperature-converter`.

## Files
- `src/lib/tools/temperature-converter/` — service, tests, README
- `src/components/tools/islands/TemperatureConverter.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `temperature-converter`

## How to verify
```bash
npm test -- src/lib/tools/temperature-converter
npm run build
```
Open `/tools/temperature-converter`, confirm 0 K shows −273.15 °C / −459.67 °F, then enter `32` in Fahrenheit and check Celsius `0` and Kelvin `273.15`.
