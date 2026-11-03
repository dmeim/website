# Project Memory — dmeim.com

Compact reference for any collaborator or AI assistant. Keep this up to date when decisions change.

- Domain: dmeim.com
- Email: hello@dmeim.com
- Framework: Astro 7
- Language: TypeScript
- Runtime: Node ≥ 22
- Styling: Plain CSS (no framework) — Midnight Concert Hall tokens (Syne / Instrument Serif / Manrope)
- Motion: React islands + Framer Motion
- Icons: Phosphor (`@phosphor-icons/react`) through the `src/ui/icons` registry; crypto marks from `@web3icons/react`
- Hosting: Cloudflare Workers Assets
- Deploy: Wrangler (project name: `dmeim`)
- Adapter: @astrojs/cloudflare
- App root: repository root (not a nested `site/` app)
- Package manager: npm
- Pages: `/` (Home: About + site buttons, then Experience / Skills / Education from `src/content/resume.ts` (no address, phone or email); no other sections), `/orthodox` (☦ in nav; landing) + `/orthodox/screensaver` (full-screen icon wall; settings in localStorage; icons from the gallery's Icons album `src/assets/gallery/icons/<Month>/`, month folders as collections, wall photos from `src/assets/gallery/backgrounds/`, resized to WebP at build via the adapter's `imageService: "compile"`; Custom layout = hand-arranged cards on a 48-step grid, lockable to an icon id or a folder, logic in `src/lib/orthodox/custom.ts`), `/projects` (one Markdown file per project in `src/content/projects/` via the `projects` content collection; media in `src/assets/gallery/projects/<slug>/` with gallery rules, also listed on /gallery; each project is a static page `/projects/<slug>`), `/gallery` (`src/assets/gallery/` is the root for every image the site uses; albums = folders there, sub-folders = sections, holding images, GIFs, video and audio; previews and downloads are the untouched originals, `download: false` per album hides downloads; a same-named image is a video's poster or an audio file's cover; words and order in `src/content/gallery.ts`; each album is a static page `/gallery/<folder>` (projects at `/gallery/projects/<slug>`) with a preview box and thumbnail grid, `#<id>` deep-links an item; build fails on any output file over Cloudflare's 25 MiB limit), `/tools` (rail shell; tool groups expand under Tools in the rail nav via `SiteNavTools.astro` + `src/ui/lib/tools-nav.ts`, one group open at a time; landing = intro + one search), `/keys`, `/game-of-life` (landing write-up), `/game-of-life/simulation` (full-page simulator; not in primary nav)
- Assets root: `assets/` → keys, images, logos, vcards, downloads
- Design reference: `reference/georgios-zerdalis` (branch `pre-retro-pop`, gitignored)
- Accent palette (Midnight Concert Hall): champagne `#d4bc8a`, steel `#8fa3b0`, ground `#050607`
- Verification: Browser (OpenPGP + Ed25519), CLI (gpg, ssh-keygen -Y) — planned
- Security: Publish fingerprints; `/.well-known/security.txt` (renew `Expires` before 2027-11-03); security headers in `public/_headers`
- Performance: Static-first, minimal JS (Astro islands where needed), plain CSS, optimize images
