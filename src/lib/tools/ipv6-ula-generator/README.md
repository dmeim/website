# IPv6 ULA generator

## Name
IPv6 ULA generator (`ipv6-ula-generator`)

## Description
Generate a Unique Local Address (ULA) prefix for private IPv6 networks per RFC 4193, using the IETF-suggested method: SHA-1 of the current timestamp plus a MAC address, taking the lower 40 bits.

## Toggles and Settings
- **Refresh** — re-run generation with a new timestamp (same MAC)

## Inputs
- MAC address (default `20:37:06:12:34:56`) — 3–6 hex octets separated by `:` or `-`

## Outputs
- **IPv6 ULA** — `fdxx:xxxx:xxxx::/48`
- **First routable block** — `fdxx:xxxx:xxxx:0::/64`
- **Last routable block** — `fdxx:xxxx:xxxx:ffff::/64`
- Each row is copyable when the MAC is valid

## Notes
- Invalid MAC shows a validation error and clears output values (same as it-tools)
- SHA-1 uses Web Crypto (`crypto.subtle.digest`); no extra npm dependency
- Hash input is `String(timestamp) + macAddress` (milliseconds since epoch), matching it-tools

## Source
Port of [it-tools IPv6 ULA generator](https://it-tools.tech/ipv6-ula-generator). Local reference: handy-dandy `it-tools` (`/ipv6-ula-generator`). Catalogue id: `ipv6-ula-generator`.

## Files
- `src/lib/tools/ipv6-ula-generator/` — service, tests, README
- `src/components/tools/islands/Ipv6UlaGenerator.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `ipv6-ula-generator`

## How to verify
```bash
npm test -- src/lib/tools/ipv6-ula-generator
npm run build
```
Open `/tools/ipv6-ula-generator`, enter a MAC, confirm the three prefixes, refresh, and copy a row.
