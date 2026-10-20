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
- Pages: `/` (Home), `/orthodox` (☦ in nav; landing) + `/orthodox/screensaver` (full-screen icon wall; settings in localStorage; images from `src/assets/orthodox/`, month folders as collections, resized to WebP at build via the adapter's `imageService: "compile"`; Custom layout = hand-arranged cards on a 48-step grid, lockable to an icon id or a folder, logic in `src/lib/orthodox/custom.ts`), `/projects`, `/tools` (catalogue + ready tools), `/keys`, `/connect`, `/chat` (Access-gated private AI chat; Library + Archive as right-pane modes), `/game-of-life` (landing write-up), `/game-of-life/simulation` (full-page simulator; not in primary nav)
- Chat: OpenCode Go via AI SDK; D1 (`DB`) + R2 (`CHAT_LIBRARY`); default model `deepseek-v4-flash`; setup in `docs/chat-access-setup.md`
- Assets root: `assets/` → keys, images, logos, vcards, downloads
- Design reference: `reference/georgios-zerdalis` (branch `pre-retro-pop`, gitignored)
- Accent palette (Midnight Concert Hall): champagne `#d4bc8a`, steel `#8fa3b0`, ground `#050607`
- Verification: Browser (OpenPGP + Ed25519), CLI (gpg, ssh-keygen -Y) — planned
- Security: Publish fingerprints; `/.well-known/security.txt`; strong headers at Cloudflare
- Performance: Static-first, minimal JS (Astro islands where needed), plain CSS, optimize images
