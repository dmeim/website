# SVG Placeholder Generator

## Name
SVG placeholder generator (`svg-placeholder`)

## Description
Build simple SVG placeholder images with configurable size, colors, font size, and optional custom label text. Useful for mockups and local UI scaffolding. Everything is generated client-side as SVG markup / data URI.

## Toggles and Settings
- **Width / height** (1–10000)
- **Background color / text color**
- **Font size** (1–1000)
- **Add exact width/height** — when on, writes `width`/`height` attributes on the root `<svg>`
- **Custom text** — defaults to `{width}x{height}` when empty

## Inputs
- Numeric and color form controls above
- Optional custom text string

## Outputs
- Live preview image (data URI)
- SVG markup (copy / download)
- SVG data URI (copy)
- Suggested filename `placeholder-{w}x{h}.svg`

## Notes
- Custom text and colors are escaped before insertion into SVG
- Default colors follow Midnight Concert Hall (elevated night + champagne)

## Source
Inspired by [it-tools SVG placeholder generator](https://it-tools.tech/svg-placeholder-generator). Local path reference: handy-dandy `it-tools` (`/svg-placeholder-generator`). Catalogue id: `svg-placeholder-generator`.

## Files
- `src/lib/tools/svg-placeholder/` — `svgPlaceholder.service.ts`, index, README
- `src/components/tools/islands/SvgPlaceholderGenerator.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `svg-placeholder-generator`

## How to verify
```bash
npm test -- src/lib/tools/svg-placeholder
npm run build
```
Open `/tools/svg-placeholder-generator`, tweak size/colors, Copy SVG / Download SVG.
