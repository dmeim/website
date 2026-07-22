# Math evaluator

## Name
Math evaluator (`math-evaluator`)

## Description
Evaluate mathematical expressions in the browser with mathjs — arithmetic, roots, trig, logs, absolutes, and related functions (e.g. `2*sqrt(6)`, `sin(pi/2)`, `abs(-3)`).

## Toggles and Settings
None.

## Inputs
1. **Expression** — free-form math expression (multiline textarea; monospace)

## Outputs
1. **Result** — stringified mathjs evaluation result (hidden while empty)

Invalid or incomplete expressions yield an empty result (it-tools `withDefaultOnError` + `?? ''` parity). Empty input evaluates to `undefined` → empty result.

## Notes
- Uses `mathjs` `evaluate` for parity with it-tools
- Result card only appears when the result string is non-empty
- Division by zero stringifies as `Infinity` / `-Infinity`

## Source
Port of [it-tools Math evaluator](https://it-tools.tech/math-evaluator). Local reference: handy-dandy `it-tools` (`/math-evaluator`). Catalogue id: `math-evaluator`.

## Files
- `src/lib/tools/math-evaluator/` — service, tests, README
- `src/components/tools/islands/MathEvaluator.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `math-evaluator`

## How to verify
```bash
npm test -- src/lib/tools/math-evaluator
npm run build
```
Open `/tools/math-evaluator`, enter `2*sqrt(6)`, and confirm the result appears (~4.899). Try an incomplete expression like `2+` — the result should clear.
