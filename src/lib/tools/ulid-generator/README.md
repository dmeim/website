# ULID generator

## Name
ULID generator (`ulid-generator`)

## Description
Generate Universally Unique Lexicographically Sortable Identifiers (ULIDs): 128-bit values with a 48-bit millisecond timestamp and 80-bit randomness, encoded as 26 Crockford Base32 characters. Quantity 1–100; output as raw (newline-joined) or JSON. Generation runs entirely in the browser via `crypto.getRandomValues` — no npm ULID dependency.

## Toggles and Settings
- **Quantity** — 1 to 100 (default 1)
- **Format** — `raw` (default, newline-joined) or `json` (`JSON.stringify(ids, null, 2)`)

## Inputs
- Quantity and format in the island UI
- Programmatic `generateUlids({ quantity, format, time? })` / `generateUlid(time?)`

## Outputs
- One or more 26-character ULIDs matching `/[0-9A-Z]{26}/`
- Copy to clipboard / Refresh (new randomness)

## Notes
- Time component is wall-clock ms encoded with Crockford Base32; randomness uses unbiased `byte % 32` (256 divisible by 32)
- Quantity / format localStorage persistence is intentionally omitted (matches other dmeim tool ports)
- Not monotonic across rapid calls in the same millisecond (parity with it-tools default `ulid()`)

## Source
Port of [it-tools ULID generator](https://it-tools.tech/ulid-generator). Local reference: handy-dandy `it-tools` (`/ulid-generator`). Catalogue id: `ulid-generator`.

## Files
- `src/lib/tools/ulid-generator/` — service, tests, README
- `src/components/tools/islands/UlidGenerator.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `ulid-generator`

## How to verify
```bash
npm test -- src/lib/tools/ulid-generator
npm run build
```
Open `/tools/ulid-generator`, adjust quantity and format, Copy / Refresh.
