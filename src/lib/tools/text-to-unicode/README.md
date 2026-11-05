# Text to Unicode

## Name
Text to Unicode (`text-to-unicode`)

## Description
Parse and convert text to HTML decimal Unicode entities (`&#N;`) and back. Conversion runs entirely in the browser with no dependencies.

## Toggles and Settings
None.

## Inputs
- Cleartext string to convert to entities (multiline)
- Entity string (`&#N;` sequence) to convert back to text (multiline)

## Outputs
- HTML decimal character entities for the text panel (live as you type)
- Decoded text for the Unicode panel (live as you type)
- Copy to clipboard on each panel

## Notes
- Encoding emits one entity per code point, so `😀` is `&#128512;`, which HTML decodes correctly. it-tools emits two surrogate entities, which HTML reads as U+FFFD. BMP text is unchanged
- Decoding accepts decimal and hex entities and still combines surrogate pairs written as two entities. Numbers beyond U+10FFFF are left as they are
- Empty / whitespace-only input yields an empty output on that panel
- Non-entity text in the Unicode→Text panel is left unchanged

## Source
Port of [it-tools Text to Unicode](https://it-tools.tech/text-to-unicode). Local reference: handy-dandy `it-tools` (`/text-to-unicode`). Catalogue id: `text-to-unicode`.

## Files
- `src/lib/tools/text-to-unicode/` — service, tests, README
- `src/components/tools/islands/TextToUnicode.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `text-to-unicode`

## How to verify
```bash
npm test -- src/lib/tools/text-to-unicode
npm run build
```
Open `/tools/text-to-unicode`, convert text both ways, copy each output.
