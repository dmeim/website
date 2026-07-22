# MAC address generator

## Name
MAC address generator (`mac-address-generator`)

## Description
Generate one or more random MAC addresses with an optional prefix, chosen case (upper/lower), and separator (`:`, `-`, `.`, or none).

## Toggles and Settings
- **Quantity** — 1–100 addresses (default 1)
- **Case** — Uppercase (default) or Lowercase
- **Separator** — `:`, `-`, `.`, or None

## Inputs
- MAC address prefix (default `64:16:7F`) — partial MAC; empty allowed

## Outputs
- Newline-joined list of generated MAC addresses
- Refresh regenerates with the same settings
- Copy puts the list on the clipboard

## Notes
- Invalid prefix shows a validation error and clears output (same as it-tools)
- Random bytes use Web Crypto (`crypto.getRandomValues`); no npm dependency
- Prefix parsing matches it-tools: continuous hex grouped by two, otherwise split on non-hex

## Source
Port of [it-tools MAC address generator](https://it-tools.tech/mac-address-generator). Local reference: handy-dandy `it-tools` (`/mac-address-generator`). Catalogue id: `mac-address-generator`.

## Files
- `src/lib/tools/mac-address-generator/` — service, tests, README
- `src/components/tools/islands/MacAddressGenerator.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `mac-address-generator`

## How to verify
```bash
npm test -- src/lib/tools/mac-address-generator
npm run build
```
Open `/tools/mac-address-generator`, set quantity/prefix/case/separator, confirm output, refresh, and copy.
