# ASCII Art Text Generator

## Name
ASCII Art Text Generator (`ascii-text-drawer`)

## Description
Create ASCII art text with many FIGlet fonts and a configurable wrap width.

## Toggles and Settings
- Font (select; default `Standard`)
- Width (0–10000; default `80`) — figlet wrap width with `whitespaceBreak: true`

## Inputs
- Multiline text to render (default `Ascii ART`)

## Outputs
- ASCII art text (monospace, copyable)
- Loading state while a font is fetched/rendered
- Error alert when figlet fails for the current settings

## Notes
- Uses the `figlet` npm package (same engine as it-tools)
- Browser islands fetch FIGfonts from the unpkg CDN (`figlet@1.11.3/fonts/`); Node/tests load fonts from the local package
- Font list matches it-tools (deduped); unknown fonts fall back to `Standard`
- Catalogue id: `ascii-text-drawer`

## Source
Port of [it-tools ASCII Art Text Generator](https://it-tools.tech/ascii-text-drawer). Local reference: handy-dandy `it-tools` (`src/tools/ascii-text-drawer/`).

## Files
- `src/lib/tools/ascii-text-drawer/` — service, tests, README
- `src/components/tools/islands/AsciiTextDrawer.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `ascii-text-drawer`

## How to verify
```bash
npm test -- src/lib/tools/ascii-text-drawer
npm run build
```
Open `/tools/ascii-text-drawer`, change the text/font/width, and copy the ASCII art output.
