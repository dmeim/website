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

Exact custom domain wiring for `dmeim.com` is done in the Cloudflare dashboard (or later via Wrangler routes).

## Headers & Caching

- Prefer Cloudflare-managed security headers — see `05-Keys-and-Security.md`
- Long-lived caching for hashed static assets; shorter for HTML
