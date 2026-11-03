# Deployment

## Strategy

- Build with Astro (`@astrojs/cloudflare` adapter), deploy via Wrangler to Workers Assets
- Worker / project name: `dmeim`
- TLS and edge delivery handled by Cloudflare

## Commands

```bash
npm run build
npm run deploy    # astro build && wrangler deploy
```

Requires Wrangler authenticated to the Cloudflare account that owns `dmeim`, and Node ≥ 22.

## Config

- `wrangler.jsonc` — Worker name, compatibility date/flags, assets binding
- `astro.config.ts` — Cloudflare adapter
- `public/.assetsignore` — excludes Worker build artifacts from the assets upload

Custom domain `dmeim.com` is pinned in `wrangler.jsonc` (`routes` + `custom_domain: true`) so deploys keep it attached.

## Headers, redirects, and caching

- `public/_headers` sets the security headers on every response (HSTS, `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, a `Permissions-Policy` that allows only camera, microphone, fullscreen, and wake lock for this origin, and a CSP limited to `frame-ancestors`, `base-uri`, `object-src`, and `upgrade-insecure-requests`). Hashed `/_astro/*` files are cached for a year; PNGs and the manifest for a day.
- `public/_redirects` holds permanent redirects for retired pages (`/connect` goes home).
- Pages build as `about.html` (`build.format: "file"`), so `/about` is served directly with no trailing-slash redirect. Canonical URLs and the sitemap use the slash-free form.

## Crawlers, search, and agents

- `public/robots.txt` allows everything except `/ui` and points at the sitemap. Cloudflare's managed robots.txt (AI content signals) is added on top at the edge; change that in the dashboard.
- `@astrojs/sitemap` writes `sitemap-index.xml` at build, leaving out `/ui` and `/colors` (both `noindex`).
- `public/llms.txt` describes the site for AI agents.
- `public/.well-known/security.txt` gives the security contact. Its `Expires` date (2027-11-03) must be renewed before then.

## Analytics

Cloudflare Web Analytics is cookieless. Set `analytics.cloudflareToken` in `src/content/site.ts` to the site token from Cloudflare dashboard > Analytics & Logs > Web Analytics; production builds then load the beacon (with SPA tracking for client-side navigation). Empty means no beacon.
