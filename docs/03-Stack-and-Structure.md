# Stack and Structure

## Stack

- Framework: Astro 7
- Language: TypeScript
- Runtime: Node ≥ 22
- Styling: Plain CSS (no framework) — CSS variables + dark mode
- Icons: Lucide
- Hosting: Cloudflare Workers Assets
- Deploy: Wrangler (project name: `dmeim`)
- Adapter: `@astrojs/cloudflare` (on-demand rendering capable)

## Styling Directive

- Plain CSS only. No Tailwind or other CSS frameworks.
- Theme tokens as CSS custom properties on `:root` / `[data-theme="dark"]`.
- Prefer semantic HTML and light, hand-written components over UI libraries.

## Directory Layout

Top-level (repo root is the Astro app):

- `src/` — pages, layouts, components, styles, lib
- `public/` — static files served as-is (plus `.assetsignore` for Workers)
- `assets/` — canonical content assets (keys, images, logos, vcards, downloads)
- `docs/` — project documentation
- `astro.config.ts` — Astro + Cloudflare adapter
- `wrangler.jsonc` — Workers Assets deploy config (`name: "dmeim"`)
- `package.json` — npm scripts (`dev`, `build`, `preview`, `deploy`)

Inside `src/`:

- `pages/` — file-based routes
- `layouts/` — shared HTML shells
- `components/` — Astro / TS components (as needed)
- `styles/` — global CSS and tokens
- `lib/` — utilities (as needed)

## Color Palette Mapping

Brand palette (light → dark):

- 50: `#d1dbe4`
- 200: `#a3b7ca`
- 400: `#7593af`
- 600: `#476f95`
- 800: `#194a7a`

CSS variables live in `src/styles/global.css` (`--color-*`).
