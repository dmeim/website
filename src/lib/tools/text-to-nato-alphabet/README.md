# Text to NATO alphabet

## Name
Text to NATO alphabet (`text-to-nato-alphabet`)

## Description
Transform text into the NATO / ICAO phonetic alphabet (Alpha…Zulu) for clear oral transmission. Conversion runs entirely in the browser with no dependencies.

## Toggles and Settings
None.

## Inputs
- Cleartext string to convert (single-line or multiline)

## Outputs
- Space-joined NATO phonetic string (live as you type)
- Copy to clipboard

## Notes
- Letters map case-insensitively (`a`/`A` → Alpha)
- Non-letters (digits, punctuation, spaces, etc.) pass through unchanged
- Characters are joined with a single space, so an input space becomes three spaces in the output (letter-space, passthrough space, letter-space)
- Empty input yields an empty output

## Source
Port of [it-tools Text to NATO alphabet](https://it-tools.tech/text-to-nato-alphabet). Local reference: handy-dandy `it-tools` (`/text-to-nato-alphabet`). Catalogue id: `text-to-nato-alphabet`.

## Files
- `src/lib/tools/text-to-nato-alphabet/` — service, tests, README
- `src/components/tools/islands/TextToNatoAlphabet.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `text-to-nato-alphabet`

## How to verify
```bash
npm test -- src/lib/tools/text-to-nato-alphabet
npm run build
```
Open `/tools/text-to-nato-alphabet`, enter text, copy the NATO string.
