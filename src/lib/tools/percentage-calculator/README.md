# Percentage calculator

## Name
Percentage calculator (`percentage-calculator`)

## Description
Calculate percentages in three common forms: X% of Y, X as a percent of Y, and the percentage increase/decrease from one value to another. Pure client-side arithmetic — no npm dependency.

## Toggles and Settings
None.

## Inputs
1. **What is X% of Y** — percentage `X`, base value `Y`
2. **X is what percent of Y** — part `X`, whole `Y`
3. **Percentage increase/decrease** — starting value `From`, ending value `To`

## Outputs
1. `(X / 100) * Y` (copyable)
2. `(100 * X) / Y` (copyable; empty when not finite, e.g. Y = 0)
3. `((To - From) / From) * 100` (copyable; empty when not finite, e.g. From = 0)

Results use JavaScript number `.toString()` formatting (matches it-tools). Incomplete pairs yield an empty result.

## Notes
- Empty inputs are treated as missing — both sides of a pair are required
- Division by zero / non-finite results clear the second and third outputs
- No rounding beyond native float stringification

## Source
Port of [it-tools Percentage calculator](https://it-tools.tech/percentage-calculator). Local reference: handy-dandy `it-tools` (`/percentage-calculator`). Catalogue id: `percentage-calculator`.

## Files
- `src/lib/tools/percentage-calculator/` — service, tests, README
- `src/components/tools/islands/PercentageCalculator.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `percentage-calculator`

## How to verify
```bash
npm test -- src/lib/tools/percentage-calculator
npm run build
```
Open `/tools/percentage-calculator`, try `123` / `456` in each pair (results `560.88`, `26.973…`, `270.731…`), and copy a result.
