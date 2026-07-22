# Slugify string

## Name
Slugify string (`slugify-string`)

## Description
Make a string URL, filename, and id safe. Converts text to a lowercase, hyphen-separated slug with Unicode transliteration and built-in replacements (e.g. `&` → `and`, `♥` → `love`).

## Toggles and Settings
None. Uses `@sindresorhus/slugify` defaults (same as it-tools): separator `-`, lowercase, decamelize on.

## Inputs
- Your string to slugify (multiline text)

## Outputs
- Slug (readonly multiline text) with a copy control

## Notes
- Depends on `@sindresorhus/slugify` for parity with it-tools (Unicode transliteration + emoji/special replacements)
- Empty or invalid input yields an empty slug
- Catalogue id: `slugify-string`

## Source
Port of [it-tools Slugify string](https://it-tools.tech/slugify-string). Local reference: handy-dandy `it-tools` (`/slugify-string`).

## Files
- `src/lib/tools/slugify-string/` — service, tests, README
- `src/components/tools/islands/SlugifyString.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `slugify-string`

## How to verify
```bash
npm test -- src/lib/tools/slugify-string
npm run build
```
Open `/tools/slugify-string`, type a string (e.g. `My file path`), confirm the slug updates, and copy works.
