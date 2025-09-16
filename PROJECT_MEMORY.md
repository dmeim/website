# Project Memory — dmeim.com

Compact reference for any collaborator or AI assistant. Keep this up to date when decisions change.

- Domain: dmeim.com
- Email: me@dmeim.com
- Stack: Vite + React + TypeScript + Tailwind
- UI: shadcn/ui only (Radix-based). No other UI libraries.
- Icons: lucide-react via shadcn
- Container: nginx:alpine (HTTP behind Nginx Proxy Manager)
- Pages now: `/` (Home/About), `/resume`, `/keys`, `/verify`
- Future: `/projects`, `/links`
- Assets root: `assets/` → keys, images, logos, vcards, downloads
- Colors: #d1dbe4, #a3b7ca, #7593af, #476f95, #194a7a
- Verification: Browser (OpenPGP + Ed25519), CLI (gpg, ssh-keygen -Y)
- Security: Publish fingerprints; `/.well-known/security.txt`; strong headers at proxy
- Performance: Static-first, minimal JS, Tailwind JIT, optimize images
