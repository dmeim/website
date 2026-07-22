# ETA calculator

## Name
ETA calculator (`eta-calculator`)

## Description
Estimate how long a steady consumption task will take and when it will finish — for example downloading a file or processing a queue — from total units, rate (units per time span), and a start time. Pure client-side arithmetic and date formatting — no npm dependency.

## Toggles and Settings
- **Time span unit** — milliseconds, seconds, minutes, hours, or days (multipliers `1`, `1000`, `60000`, `3600000`, `86400000`)

## Inputs
1. **Amount of element to consume** — total units remaining (default `186`)
2. **The consumption started at** — start datetime (`datetime-local`)
3. **Units per time span** — how many units are consumed per span (default `3`)
4. **Time span length** — numeric length of the span (default `5`)
5. **Time span unit** — see settings above (default minutes)

## Outputs
1. **Total duration** — human-readable duration (`formatMsDuration`, date-fns en parity + optional `ms`)
2. **It will end** — relative end time (`formatEtaRelative`, date-fns `en-GB` `formatRelative` parity)

Duration formula (matches it-tools): `unitCount / (unitPerTimeSpan / (timeSpan * unitMultiplier))`.

## Notes
- Defaults mirror it-tools (`186` units, `3` per `5` minutes → `5 hours 10 minutes`)
- Relative end uses local calendar days and en-GB time (`HH:mm`) / date (`dd/MM/yyyy`)
- Non-finite durations clear the duration string; UI clamps rate/count/span with `min={1}`
- Milliseconds-only durations keep the leading space from it-tools (` 999 ms`)

## Source
Port of [it-tools ETA calculator](https://it-tools.tech/eta-calculator). Local reference: handy-dandy `it-tools` (`/eta-calculator`). Catalogue id: `eta-calculator`.

## Files
- `src/lib/tools/eta-calculator/` — service, tests, README
- `src/components/tools/islands/EtaCalculator.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `eta-calculator`

## How to verify
```bash
npm test -- src/lib/tools/eta-calculator
npm run build
```
Open `/tools/eta-calculator`, try the plates example (`500` units, `5` in `3` minutes → `5 hours`), and confirm the relative end time updates when you change the start datetime.
