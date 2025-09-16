# Architectural Decisions (ADRs)

This document records the key decisions for the dmeim.com site. Treat these as constraints unless explicitly revised in a future ADR.

## AD-001: Tech Stack

- Build tool: Vite
- Framework: React + TypeScript
- Styling: Tailwind CSS
- UI Library: shadcn/ui (Radix UI under the hood)
- Icons: lucide-react via shadcn
- Output: Static site (no server runtime)

## AD-002: UI Components Directive

- Exclusively use shadcn/ui components for UI building blocks.
- Do not introduce other component libraries (e.g., MUI, Chakra, Ant).
- Custom components should follow shadcn patterns and Tailwind tokens.

## AD-003: Branding & Domain

- Domain: dmeim.com
- Primary color palette (from light to dark):
  - #d1dbe4, #a3b7ca, #7593af, #476f95, #194a7a
- Light/Dark themes supported; dark respects user preference.

## AD-004: Container & Serving

- Container image: `nginx:alpine`
- Static files served from `/usr/share/nginx/html`
- This container runs behind Nginx Proxy Manager (TLS handled upstream)
- Internal HTTP port: 8080

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
- Use strong security headers (CSP/HSTS/etc.) at the reverse proxy layer (NPM)

## AD-008: Verification Modes

- Browser-based verification: OpenPGP + Ed25519
- CLI verification: gpg and ssh-keygen `-Y verify`
