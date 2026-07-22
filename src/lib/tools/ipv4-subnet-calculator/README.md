# IPv4 subnet calculator

## Name
IPv4 subnet calculator (`ipv4-subnet-calculator`)

## Description
Parse an IPv4 address with optional CIDR / netmask and show network address, masks, size, usable range, broadcast, and IP class. Navigate previous / next same-size blocks. Uses the `netmask` package for parity with it-tools.

## Toggles and Settings
None. Previous / next block buttons adjust the current CIDR by one block of the same size.

## Inputs
- IPv4 address with or without mask (default `192.168.0.1/24`)

## Outputs
- Netmask (block string, e.g. `192.168.0.0/24`)
- Network address
- Network mask (dotted decimal)
- Network mask in binary
- CIDR notation (`/bitmask`)
- Wildcard mask
- Network size
- First address / Last address
- Broadcast address (or “No broadcast address with this mask” for /31–/32)
- IP class (A–E, or “Unknown class type”)

## Notes
- Invalid input shows a parse error and hides the results table
- Class is derived from the network base address first octet (classic A–E)
- `/31` and `/32` have no broadcast address (`netmask` returns undefined)
- Block navigation uses `Netmask.next(±1)` and replaces the input with the adjacent block CIDR

## Source
Port of [it-tools IPv4 subnet calculator](https://it-tools.tech/ipv4-subnet-calculator). Local reference: handy-dandy `it-tools` (`/ipv4-subnet-calculator`). Catalogue id: `ipv4-subnet-calculator`.

## Files
- `src/lib/tools/ipv4-subnet-calculator/` — service, tests, README
- `src/components/tools/islands/Ipv4SubnetCalculator.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `ipv4-subnet-calculator`

## How to verify
```bash
npm test -- src/lib/tools/ipv4-subnet-calculator
npm run build
```
Open `/tools/ipv4-subnet-calculator`, enter a CIDR, confirm table fields, copy values, and use Previous / Next block.
