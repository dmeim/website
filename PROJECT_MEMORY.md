# Project Memory — dmeim.com

Compact reference for any collaborator or AI assistant. Keep this up to date when decisions change.

- Domain: dmeim.com
- Email: me@dmeim.com
- Framework: Astro 7
- Language: TypeScript
- Runtime: Node ≥ 22
- Styling: Plain CSS (no framework) — CSS variables + dark mode
- Icons: Lucide
- Hosting: Cloudflare Workers Assets
- Deploy: Wrangler (project name: `dmeim`)
- Adapter: @astrojs/cloudflare
- App root: repository root (not a nested `site/` app)
- Package manager: npm
- Pages planned: `/` (Home/About), `/resume`, `/keys`, `/verify`
- Future: `/projects`, `/links`
- Assets root: `assets/` → keys, images, logos, vcards, downloads
- Colors: #d1dbe4, #a3b7ca, #7593af, #476f95, #194a7a
- Verification: Browser (OpenPGP + Ed25519), CLI (gpg, ssh-keygen -Y)
- Security: Publish fingerprints; `/.well-known/security.txt`; strong headers at Cloudflare
- Performance: Static-first, minimal JS (Astro islands where needed), plain CSS, optimize images
