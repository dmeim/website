# SEO and Performance

## Performance

- Static-first, minimal JS; Astro islands only where needed (e.g. verify)
- Plain CSS with a small, intentional footprint (no CSS framework)
- Responsive images (WebP/AVIF where possible); width/height hints
- Cache busting and long-lived asset caching at the Cloudflare edge

## SEO

- Set `<title>`, `<meta name="description">`
- Open Graph and Twitter Card metadata
- Canonical URL, robots.txt, sitemap.xml (later)
- Schema.org: `Person` for homepage, `WebSite` globally; later `ItemList` for projects

