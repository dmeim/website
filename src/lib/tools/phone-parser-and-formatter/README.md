# Phone Parser and Formatter

## Name
Phone Parser (`phone-parser-and-formatter`)

## Description
Parse, validate, and format phone numbers. Show country, calling code, validity, type, and standard formats (international, national, E.164, RFC3966).

## Toggles and Settings
- Default country code (select; used when the number has no country prefix)

## Inputs
- Phone number string (digits, spaces, `+`, `-`, `(`, `)` only)

## Outputs
- Country code
- Country name
- Country calling code
- Is valid? / Is possible?
- Type (Mobile, Fixed line, etc.)
- International, national, E.164, and RFC3966 formats (copyable)

## Notes
- Uses `libphonenumber-js/max` (same engine family as it-tools; max metadata for number type)
- Country display names via `Intl.DisplayNames` (native; it-tools used `country-code-lookup`)
- Default country is inferred from the browser locale region, falling back to `FR`
- Empty or character-invalid input shows no result rows
- Catalogue id: `phone-parser-and-formatter`

## Source
Port of [it-tools phone parser and formatter](https://it-tools.tech/phone-parser-and-formatter). Local reference: handy-dandy `it-tools` (`src/tools/phone-parser-and-formatter/`).

## Files
- `src/lib/tools/phone-parser-and-formatter/` — service, tests, README
- `src/components/tools/islands/PhoneParserAndFormatter.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `phone-parser-and-formatter`

## How to verify
```bash
npm test -- src/lib/tools/phone-parser-and-formatter
npm run build
```
Open `/tools/phone-parser-and-formatter`, pick a default country, enter a number (e.g. `0612345678` with FR), and confirm parsed fields and formats.
