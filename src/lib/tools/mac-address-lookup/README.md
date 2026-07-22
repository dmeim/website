# MAC address lookup

## Name
MAC address lookup (`mac-address-lookup`)

## Description
Find the vendor and manufacturer of a device by looking up the IEEE OUI (Organizationally Unique Identifier) from a MAC address.

## Toggles and Settings
None.

## Inputs
- MAC address (default `20:37:06:12:34:56`) — 3–6 hex octets separated by `:` or `-`

## Outputs
- Vendor info (multiline: organization name and address when known)
- “Unknown vendor for this address” when the OUI is not in the database
- Copy puts the full vendor string on the clipboard (disabled when unknown)

## Notes
- Validation matches it-tools (`:` / `-` separators only); lookup still strips `.` and spaces when extracting the OUI key
- OUI key = first 6 hex digits after removing separators, uppercased
- Vendor database comes from the `oui-data` npm package (same as it-tools)

## Source
Port of [it-tools MAC address lookup](https://it-tools.tech/mac-address-lookup). Local reference: handy-dandy `it-tools` (`/mac-address-lookup`). Catalogue id: `mac-address-lookup`.

## Files
- `src/lib/tools/mac-address-lookup/` — service, tests, README, `oui-data` types
- `src/components/tools/islands/MacAddressLookup.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `mac-address-lookup`

## How to verify
```bash
npm test -- src/lib/tools/mac-address-lookup
npm run build
```
Open `/tools/mac-address-lookup`, confirm Cisco vendor for the default MAC, try an unknown OUI, and copy.
