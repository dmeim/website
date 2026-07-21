# dmeim.com — Project Overview

Personal website for dmeim.com — portfolios, public keys, verification tools, and more.

**Stack:** Astro 7 · TypeScript · React islands · Framer Motion · plain CSS · Lucide · Cloudflare Workers Assets · Wrangler (`dmeim`) · Node ≥ 22

**Design:** Midnight Concert Hall (Syne / Instrument Serif / Manrope, champagne + steel accents) — adapted from the `pre-retro-pop` branch of [georgios-zerdalis](https://github.com/dmeim/georgios-zerdalis) (local clone under `reference/`, gitignored).

## Quick start

```bash
npm install
npm run dev
```

```bash
npm run build
npm run deploy   # requires Wrangler auth
```

## Routes

| Path | Page |
| --- | --- |
| `/` | Home |
| `/projects` | Project portfolio |
| `/tools` | Tools (placeholder) |
| `/keys` | SSH / GPG keys |
| `/connect` | Connect form + info |

## Documentation Map

- docs/01-Product-Vision.md
- docs/02-Information-Architecture.md
- docs/03-Stack-and-Structure.md
- docs/04-Design-System.md
- docs/05-Keys-and-Security.md
- docs/06-Verification.md
- docs/07-Deployment.md
- docs/08-Backlog.md
- docs/09-SEO-and-Performance.md
- docs/10-Content-and-Branding.md
- DECISIONS.md
- PROJECT_MEMORY.md

## Assets

Canonical non-code assets live under `assets/` (keys, images, logos, vcards, downloads). Copy into `public/` as needed during feature work.
