# IPv4 range expander

## Name
IPv4 range expander (`ipv4-range-expander`)

## Description
Given a start and end IPv4 address, calculate the smallest CIDR subnet that fully covers the range, along with the expanded start/end and address counts.

## Toggles and Settings
None. When start > end, a “Switch start and end” action swaps the two inputs.

## Inputs
- Start IPv4 address (default `192.168.1.1`)
- End IPv4 address (default `192.168.6.255`)

## Outputs
- Start address — original vs expanded network start
- End address — original vs expanded network end
- Addresses in range — original count vs expanded CIDR size
- CIDR — expanded subnet in `a.b.c.d/prefix` form

## Notes
- Invalid addresses show a validation error; no result table until both are valid
- When both are valid but end < start, show an error with a switch action (same as it-tools)
- Reuses `ipv4ToInt` / `isValidIpv4` from `ipv4-address-converter` and `convertBase` from `base-converter`
- No npm dependencies beyond the shared kit

## Source
Port of [it-tools IPv4 range expander](https://it-tools.tech/ipv4-range-expander). Local reference: handy-dandy `it-tools` (`/ipv4-range-expander`). Catalogue id: `ipv4-range-expander`.

## Files
- `src/lib/tools/ipv4-range-expander/` — service, tests, README
- `src/components/tools/islands/Ipv4RangeExpander.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `ipv4-range-expander`

## How to verify
```bash
npm test -- src/lib/tools/ipv4-range-expander
npm run build
```
Open `/tools/ipv4-range-expander`, enter start/end addresses, confirm old/new rows and CIDR, try an inverted range and the switch action, and copy values.
