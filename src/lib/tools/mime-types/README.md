# MIME types

## Name
MIME types (`mime-types`)

## Description
Convert MIME types to associated file extensions and file extensions back to MIME types. Includes a full reference table of MIME ↔ extension mappings from the `mime-types` / mime-db dataset (same source as it-tools).

## Toggles and Settings
None — pure lookup from the static MIME database.

## Inputs
- MIME type selection (e.g. `application/pdf`)
- File extension selection (e.g. `pdf` / `.pdf`)
- Optional filter text for the reference table

## Outputs
- Extensions for the selected MIME type
- MIME type for the selected extension
- Full MIME types ↔ extensions reference table

## Notes
- Builds extension ↔ MIME maps from `mime-db` with mime-types 2.x source preference (same dataset as it-tools; browser-safe, no Node `path`)
- Extension keys are stored without a leading dot; the UI accepts `.pdf` or `pdf`
- Only MIME types that declare extensions in mime-db appear in the maps

## Source
Port of [it-tools MIME types](https://it-tools.tech/mime-types). Local reference: handy-dandy `it-tools` (`src/tools/mime-types/`). Catalogue id: `mime-types`.

## Files
- `src/lib/tools/mime-types/` — service, tests, README
- `src/components/tools/islands/MimeTypes.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `mime-types`

## How to verify
```bash
npm test -- src/lib/tools/mime-types
npm run build
```
Open `/tools/mime-types`, pick a MIME type and an extension, and confirm the reference table lists matching rows.
