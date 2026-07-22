# UUID generator

## Name
UUIDs generator (`uuid-generator`)

## Description
Generate Universally Unique Identifiers (UUIDs): NIL, time-based v1, name-based v3/v5 (MD5 / SHA-1), and random v4. Quantity 1–50; name-based versions accept RFC namespace presets or a custom namespace UUID plus a name. Generation runs entirely in the browser via the `uuid` package.

## Toggles and Settings
- **UUID version** — `NIL`, `v1`, `v3`, `v4` (default), `v5`
- **Quantity** — 1 to 50 (default 1)
- **Namespace** (v3 / v5 only) — presets DNS / URL / OID / X500, or a custom namespace UUID
- **Name** (v3 / v5 only) — string hashed with the namespace

## Inputs
- Version, quantity, and (for v3/v5) namespace + name in the island UI
- Programmatic `generateUuids({ version, quantity, namespace, name })`

## Outputs
- One UUID per line (newline-joined when quantity > 1)
- Copy to clipboard / Refresh (regenerate random / time-based values)

## Notes
- Invalid v3/v5 namespaces throw inside `uuid`; the service catches and returns an empty string (it-tools `withDefaultOnError` parity)
- Batch v1 uses `clockseq: index` (plus random nsecs/node) so consecutive IDs in one batch stay unique
- RFC namespaces: DNS `6ba7b810-…`, URL `6ba7b811-…`, OID `6ba7b812-…`, X500 `6ba7b814-…`
- Version / quantity localStorage persistence is intentionally omitted

## Source
Port of [it-tools UUID generator](https://it-tools.tech/uuid-generator). Local reference: handy-dandy `it-tools` (`/uuid-generator`). Catalogue id: `uuid-generator`.

## Files
- `src/lib/tools/uuid-generator/` — service, tests, README
- `src/components/tools/islands/UuidGenerator.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `uuid-generator`

## How to verify
```bash
npm test -- src/lib/tools/uuid-generator
npm run build
```
Open `/tools/uuid-generator`, switch versions, adjust quantity, try v3/v5 namespaces, Copy / Refresh.
