# Random port generator

## Name
Random port generator (`random-port-generator`)

## Description
Generate a random TCP/UDP port number outside the well-known range (0–1023). Useful when picking a local development or ephemeral service port. Generation runs entirely in the browser via Web Crypto — no npm dependency.

## Toggles and Settings
None. Output refreshes on load and when **Refresh** is pressed.

## Inputs
- None in the UI
- Programmatic `generatePort()`

## Outputs
- A single integer port in `[1024, 65535)` (parity with it-tools `randIntFromInterval(1024, 65535)`)
- Copy to clipboard / Refresh (new random port)

## Notes
- it-tools uses a half-open interval, so **65535 is never generated**; valid outputs are 1024–65534
- Randomness prefers `crypto.getRandomValues` with rejection sampling (same pattern as token-generator); falls back to `Math.random` if Web Crypto is unavailable
- No quantity or range controls (matches it-tools UI)

## Source
Port of [it-tools random port generator](https://it-tools.tech/random-port-generator). Local reference: handy-dandy `it-tools` (`/random-port-generator`). Catalogue id: `random-port-generator`.

## Files
- `src/lib/tools/random-port-generator/` — service, tests, README
- `src/components/tools/islands/RandomPortGenerator.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `random-port-generator`

## How to verify
```bash
npm test -- src/lib/tools/random-port-generator
npm run build
```
Open `/tools/random-port-generator`, Copy / Refresh.
