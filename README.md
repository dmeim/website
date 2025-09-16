# dmeim.com — Project Overview

This repository contains the plans and decisions for building a fast, modern personal website for dmeim.com. The site will be built with Vite + React + TypeScript + Tailwind and will exclusively use shadcn/ui components. It will be packaged as a static site and served from an `nginx:alpine` container behind Nginx Proxy Manager.

See the docs for full context and step‑by‑step plans.

## Documentation Map

- docs/01-Product-Vision.md
- docs/02-Information-Architecture.md
- docs/03-Stack-and-Structure.md
- docs/04-Design-System.md
- docs/05-Keys-and-Security.md
- docs/06-Verification.md
- docs/07-Deployment-and-Docker.md
- docs/08-Backlog.md
- docs/09-SEO-and-Performance.md
- docs/10-Content-and-Branding.md
- DECISIONS.md
- PROJECT_MEMORY.md

## Assets

All non-code assets (keys, images, logos, vcards, downloads) live under `assets/` for easy maintenance. During build, these will be copied into the site’s `public/` directory.

Directory:

- assets/keys/
- assets/images/
- assets/logos/
- assets/vcards/
- assets/downloads/

