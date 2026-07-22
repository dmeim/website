# Open graph meta generator

## Name
Open graph meta generator (`og-meta-generator`)

## Description
Generate Open Graph and Twitter/social HTML `<meta>` tags from form fields. Runs entirely in the browser with native string templating (no `@it-tools/oggen` dependency).

## Toggles and Settings
- **Page type** — website, article, book, profile, music.*, or video.* (shows type-specific fields)
- **Twitter card type** — summary, summary_large_image, app, or player
- Switching page type clears the previous type-specific field values

## Inputs
- General: page type, title, description, page URL
- Image: url, alt, width, height
- Twitter: card type, site account, creator account
- Type-specific fields (article dates/author, video actors, etc.) — including multi-value lists where the source tool uses them

## Outputs
- HTML meta tag block (live): `og:*` `property` tags plus `twitter:*` `name` tags
- Twitter-compatible copies of title / description / image when those twitter fields are unset
- Copy meta tags to clipboard

## Notes
- Empty values are omitted from the output
- Multi-value fields (e.g. video actors) emit one `<meta>` per non-empty entry
- Content attribute values are not HTML-escaped (parity with it-tools / oggen); avoid raw `"` in values
- All work stays in the browser

## Source
Port of [it-tools Open graph meta generator](https://it-tools.tech/og-meta-generator). Local reference: handy-dandy `it-tools` (`src/tools/meta-tag-generator/`, route `/og-meta-generator`). Catalogue id: `og-meta-generator`. Meta HTML generation mirrors `@it-tools/oggen` natively.

## Files
- `src/lib/tools/og-meta-generator/` — service, schemas, tests, README
- `src/components/tools/islands/OgMetaGenerator.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `og-meta-generator`

## How to verify
```bash
npm test -- src/lib/tools/og-meta-generator
npm run build
```
Open `/tools/og-meta-generator`, fill title/description/image, confirm the HTML updates live, switch page type to Article and check type-specific tags, then copy the output.
