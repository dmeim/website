# Chronometer

## Name
Chronometer (`chronometer`)

## Description
A simple stopwatch: start, stop, and reset an elapsed-time display. Pure client-side timing via `requestAnimationFrame` and `Date.now()` — no npm dependency.

## Toggles and Settings
None.

## Inputs
- **Start** — begin (or resume) accumulating elapsed time
- **Stop** — pause the timer (keeps the current elapsed value)
- **Reset** — set elapsed time to zero (does not change running/paused state by itself; matches it-tools)

## Outputs
Elapsed time formatted as `MM:SS.mmm`, or `HH:MM:SS.mmm` once one or more hours have elapsed. Updates on animation frames while running.

## Notes
- Timing uses wall-clock deltas between animation frames (same approach as it-tools + VueUse `useRafFn`)
- Reset while running zeros the counter without stopping the RAF loop
- No lap splits or countdown mode
- No external libraries

## Source
Port of [it-tools Chronometer](https://it-tools.tech/chronometer). Local reference: handy-dandy `it-tools` (`/chronometer`). Catalogue id: `chronometer`.

## Files
- `src/lib/tools/chronometer/` — service, tests, README
- `src/components/tools/islands/Chronometer.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `chronometer`

## How to verify
```bash
npm test -- src/lib/tools/chronometer
npm run build
```
Open `/tools/chronometer`, press Start, confirm the display advances, Stop pauses, Reset returns to `00:00.000`.
