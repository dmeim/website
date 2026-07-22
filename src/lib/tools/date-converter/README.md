# Date-time converter

## Name
Date-time converter (`date-converter`)

## Description
Convert a date/time string between common representations: JS locale, ISO 8601, ISO 9075, RFC 3339, RFC 7231, Unix seconds, millisecond timestamp, UTC string, Mongo ObjectID time prefix, and Excel serial date. Empty input shows the live current time. Conversion runs entirely in the browser with native `Date` / `Intl`-compatible formatting (date-fns@2.29 parity, no npm date lib).

## Toggles and Settings
- **Input format** (select): which parser to use for the text field. Defaults to **Timestamp** (ms), matching it-tools. Typing auto-detects and switches the select when a matcher hits.

## Inputs
- Date string (single-line text; placeholder “Put your date string here…”). Empty → treat as now.

## Outputs
Ten live formats, each with its own copy control:
JS locale date string, ISO 8601, ISO 9075, RFC 3339, RFC 7231, Unix timestamp, Timestamp, UTC format, Mongo ObjectID, Excel date/time.

Invalid input for the selected format clears all outputs (placeholder “Invalid date…”).

## Notes
- Catalogue id: `date-converter` (it-tools source folder is `date-time-converter`, public path `/date-converter`)
- Format matchers and Excel serial math match it-tools models tests
- ISO 8601 / ISO 9075 / RFC 3339 formatters use local wall time + offset (date-fns behavior); RFC 7231 / UTC / unix / ms / Mongo / Excel are UTC-based
- Auto-detect uses first matching format in display order (Unix before Timestamp; both match short digit strings)

## Source
Port of [it-tools Date-time converter](https://it-tools.tech/date-converter). Local reference: handy-dandy `it-tools` (`src/tools/date-time-converter/`).

## Files
- `src/lib/tools/date-converter/` — service, tests, README
- `src/components/tools/islands/DateConverter.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `date-converter`

## How to verify
```bash
npm test -- src/lib/tools/date-converter
npm run build
```
Open `/tools/date-converter`, paste a timestamp or ISO string, confirm formats update, auto-detect switches the select, and copy works. Clear the input to see live “now”.
