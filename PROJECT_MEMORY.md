# Project Memory — dmeim.com

Compact reference for any collaborator or AI assistant. Keep this up to date when decisions change.

- Domain: dmeim.com
- Email: hello@dmeim.com
- Framework: Astro 7
- Language: TypeScript
- Runtime: Node ≥ 22
- Styling: Plain CSS (no framework) — Midnight Concert Hall tokens (Syne / Instrument Serif / Manrope)
- Motion: React islands + Framer Motion
- Icons: Lucide (`lucide` + `@lucide/astro`)
- Hosting: Cloudflare Workers Assets
- Deploy: Wrangler (project name: `dmeim`)
- Adapter: @astrojs/cloudflare
- App root: repository root (not a nested `site/` app)
- Package manager: npm
- Pages: `/` (Home), `/projects`, `/tools` (catalogue + 4 ready tools), `/keys`, `/connect`
- Assets root: `assets/` → keys, images, logos, vcards, downloads
- Design reference: `reference/georgios-zerdalis` (branch `pre-retro-pop`, gitignored)
- Accent palette (Midnight Concert Hall): champagne `#d4bc8a`, steel `#8fa3b0`, ground `#050607`
- Verification: Browser (OpenPGP + Ed25519), CLI (gpg, ssh-keygen -Y) — planned
- Security: Publish fingerprints; `/.well-known/security.txt`; strong headers at Cloudflare
- Performance: Static-first, minimal JS (Astro islands where needed), plain CSS, optimize images
