# dmeim.com — Project Overview

Personal website for dmeim.com — portfolios, public keys, verification tools, and more.

**Stack:** Astro 7 · TypeScript · React islands · Framer Motion · plain CSS · Phosphor icons · Cloudflare Workers Assets · Wrangler (`dmeim`) · Node ≥ 22

**Design:** Profile: flat and quiet, Inter, a gold accent and hairlines, with a sticky identity rail. The UI library lives in `src/ui` (see `docs/13-Redesign-Profile.md`).

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
| `/orthodox` | Orthodox icons (landing; ☦ in the nav) |
| `/orthodox/screensaver` | Full-screen icon-wall screensaver |
| `/projects` | Project portfolio |
| `/tools` | Tools (catalogue + tool pages) |
| `/keys` | SSH / GPG keys |
| `/gallery` | Albums of every image the site uses (photos, icons, project screenshots) |
| `/game-of-life` | Conway's Game of Life (landing) |
| `/game-of-life/simulation` | Full-page Game of Life simulator |
| `/chat` | Private AI chat (Access-gated; OpenCode Go; Library + Archive panes) |

### Orthodox screensaver images

Drop icons into the gallery's Icons album, `src/assets/gallery/icons/<collection>/`, and wall photos into `src/assets/gallery/backgrounds/`. They are picked up at build time, with no per-file registration. Collections are currently month folders (`January/` … `December/`). Full-size originals are fine: the build resizes them to WebP with sharp (`imageService: "compile"` in `astro.config.ts`). The **Custom** layout lets you arrange cards by hand and lock each one to a specific icon (by file name) or a group (folder). Folder and file naming rules, and how the custom wall works, are in `src/assets/gallery/icons/README.md`.

### Private chat (local)

```bash
cp .dev.vars.example .dev.vars   # set OPENCODE_API_KEY
npm run chat:reset-local         # wipe local D1/R2, then apply migrations 0001–0004
npm run dev                      # D1/R2 via local Miniflare bindings
```

`chat:reset-local` deletes Miniflare state under `.wrangler/state/v3/d1` and `.wrangler/state/v3/r2`, then recreates empty chat tables. Prefer that over re-running migrate alone when you need a clean slate (migrate-on-top keeps old rows).

Production Access + secrets checklist: `docs/chat-access-setup.md`.

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
