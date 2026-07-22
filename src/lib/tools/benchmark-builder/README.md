# Benchmark builder

## Name
Benchmark builder (`benchmark-builder`)

## Description
Compare execution-time (or any numeric) sample suites: enter measures per suite, optionally set a unit, and get ranked mean/variance with deltas vs the best suite. Export as a markdown table or bullet list. Pure client-side — no npm dependency.

## Toggles and Settings
- **Unit** — optional suffix appended to mean/variance (e.g. `ms`); variance gets a `²` when a unit is set
- **Reset suites** — replace all suites with two empty suites (`Suite 1`, `Suite 2`)
- Suites and unit persist in `localStorage` (`benchmark-builder:suites`, `benchmark-builder:unit`)

## Inputs
- **Suite name** — label for each suite
- **Suite values** — one or more numeric measures per suite (empty slots ignored); Enter on the last field adds another measure
- **Add / delete suite** — insert a suite after the current one, or remove when more than one suite exists
- **Add / delete measure** — grow or shrink a suite’s sample list

## Outputs
- Ranked results table: Position, Suite, Samples, Mean, Variance
- Mean includes `(+delta ; xratio)` vs the best (lowest) mean when different
- **Copy as markdown table** / **Copy as bullet list**

## Notes
- Variance is population variance (mean of squared differences), matching it-tools
- Non-numeric / empty measure slots are filtered before stats
- When the best mean is `0`, the ratio vs best is shown as `∞`
- No external libraries

## Source
Port of [it-tools Benchmark builder](https://it-tools.tech/benchmark-builder). Local reference: handy-dandy `it-tools` (`/benchmark-builder`). Catalogue id: `benchmark-builder`.

## Files
- `src/lib/tools/benchmark-builder/` — service, tests, README
- `src/components/tools/islands/BenchmarkBuilder.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `benchmark-builder`

## How to verify
```bash
npm test -- src/lib/tools/benchmark-builder
npm run build
```
Open `/tools/benchmark-builder`, confirm default suites rank Suite 1 first (mean 7.5), set unit `ms`, then copy the markdown table.
