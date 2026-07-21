# Architectural Decisions (ADRs)

This document records the key decisions for the dmeim.com site. Treat these as constraints unless explicitly revised in a future ADR.

## AD-001: Tech Stack

- Framework: Astro 7
- Language: TypeScript
- Runtime: Node ≥ 22
- Styling: Plain CSS (no CSS framework) — CSS variables + dark mode
- Icons: Lucide
- Hosting: Cloudflare Workers Assets
- Deploy: Wrangler (project name: `dmeim`)
- Adapter: `@astrojs/cloudflare` (on-demand rendering available; prerender where useful)
- Package manager: npm
- App lives at repository root

## AD-002: Styling Directive

- Use plain CSS only. Do not introduce Tailwind, Bootstrap, or other CSS frameworks.
- Theme via CSS custom properties; support light and dark modes.
- Prefer semantic HTML and small, purpose-built components over a component library.
- Do not introduce UI libraries (e.g., shadcn/ui, MUI, Chakra, Ant).

## AD-003: Branding & Domain

- Domain: dmeim.com
- Primary color palette (from light to dark):
  - #d1dbe4, #a3b7ca, #7593af, #476f95, #194a7a
- Light/Dark themes supported; dark respects user preference.

## AD-004: Hosting & Deploy

- Host on Cloudflare Workers Assets via `@astrojs/cloudflare`
- Deploy with Wrangler; Cloudflare project / Worker name: `dmeim`
- Config: `wrangler.jsonc` at repo root; TLS and edge delivery by Cloudflare
- Package manager: npm; app lives at repository root

## AD-005: Information Architecture (Initial)

- `/` Home/About (short introduction and primary calls to action)
- `/resume` Detailed resume content
- `/keys` Public keys (SSH, PGP, etc.) + fingerprints + usage
- `/verify` In-browser verification for PGP + SSH/Ed25519; CLI docs
- Future: `/projects`, `/projects/<slug>`, `/links`

## AD-006: Assets Management

- Canonical assets live in `assets/` at repo root:
  - `assets/keys/`, `assets/images/`, `assets/logos/`, `assets/vcards/`, `assets/downloads/`
- Build scripts will copy necessary assets into the site’s `public/` folder.

## AD-007: Security Posture

- Publish keys and fingerprints; provide security.txt under `/.well-known/security.txt`
- Document WKD (OpenPGP Web Key Directory) as a later enhancement
- Use strong security headers (CSP/HSTS/etc.) at the Cloudflare edge

## AD-008: Verification Modes

- Browser-based verification: OpenPGP + Ed25519
- CLI verification: gpg and ssh-keygen `-Y verify`
