# IBAN Validator and Parser

## Name
IBAN Validator (`iban-validator-and-parser`)

## Description
Validate and parse IBAN numbers. Check validity, QR-IBAN status, country code, BBAN, and a friendly spaced format.

## Toggles and Settings
None.

## Inputs
- IBAN string (spaces and dashes are stripped; case-insensitive)

## Outputs
- Is IBAN valid? (Yes/No)
- IBAN errors (friendly messages; hidden when none)
- Is IBAN a QR-IBAN? (Yes/No)
- Country code (or N/A)
- BBAN (or N/A)
- IBAN friendly format
- Clickable valid IBAN examples (FR / DE / GB)

## Notes
- Uses the `ibantools` npm package (same engine as it-tools)
- Empty input shows no result rows
- Catalogue id: `iban-validator-and-parser`

## Source
Port of [it-tools IBAN validator and parser](https://it-tools.tech/iban-validator-and-parser). Local reference: handy-dandy `it-tools` (`src/tools/iban-validator-and-parser/`).

## Files
- `src/lib/tools/iban-validator-and-parser/` — service, tests, README
- `src/components/tools/islands/IbanValidatorAndParser.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `iban-validator-and-parser`

## How to verify
```bash
npm test -- src/lib/tools/iban-validator-and-parser
npm run build
```
Open `/tools/iban-validator-and-parser`, paste an IBAN (or click an example), and confirm validity / parsed fields.
