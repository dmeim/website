# IPv4 address converter

## Name
IPv4 address converter (`ipv4-address-converter`)

## Description
Convert a dotted IPv4 address into its decimal integer, hexadecimal, binary, and IPv4-mapped IPv6 representations (full and short).

## Toggles and Settings
None.

## Inputs
- IPv4 address (default `192.168.1.1`)

## Outputs
- Decimal (32-bit unsigned integer as decimal string)
- Hexadecimal (uppercase)
- Binary
- IPv6 (`0000:0000:0000:0000:0000:ffff:xxxx:xxxx`)
- IPv6 (short) (`::ffff:xxxx:xxxx`)

## Notes
- Invalid input shows a validation error; output fields are cleared with a placeholder
- Hex/binary use the shared `base-converter` `convertBase` helper (same as it-tools integer base converter)
- IPv6 mapping does not use lodash; octet → hex → hextet pairing matches it-tools

## Source
Port of [it-tools IPv4 address converter](https://it-tools.tech/ipv4-address-converter). Local reference: handy-dandy `it-tools` (`/ipv4-address-converter`). Catalogue id: `ipv4-address-converter`.

## Files
- `src/lib/tools/ipv4-address-converter/` — service, tests, README
- `src/components/tools/islands/Ipv4AddressConverter.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `ipv4-address-converter`

## How to verify
```bash
npm test -- src/lib/tools/ipv4-address-converter
npm run build
```
Open `/tools/ipv4-address-converter`, enter an IPv4 address, confirm decimal / hex / binary / IPv6 rows, and copy values.
