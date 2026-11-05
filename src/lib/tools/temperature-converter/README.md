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
All eight scale values stay in sync. The edited field keeps the typed value; other scales are rounded to two decimal places.

## Notes
- Hub scale is Kelvin
- Clearing a field clears the other scales
- Initial state is 0 K (and the rounded equivalents on every other scale)
- A value colder than 0 K still converts, with a warning that it is not physically possible
- it-tools floors instead of rounding, so float noise makes 0 °C read as 31.99 °F there. This port rounds, so it reads 32 °F
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
