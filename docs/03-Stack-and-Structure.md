# Stack and Structure

## Stack

- Vite + React + TypeScript
- Tailwind CSS
- shadcn/ui (Radix primitives), lucide-react icons
- Output: static build

## shadcn/ui Usage Directive

- Exclusively use shadcn/ui components. No other UI libraries.
- Prefer composition of shadcn primitives over bespoke CSS where feasible.
- Extend via Tailwind utilities and tokens.

## Directory Layout (planned)

Top-level:

- `assets/` — canonical assets (keys, images, logos, vcards, downloads)
- `docs/` — documentation set (this folder)
- `site/` — Vite app (to be scaffolded later)

Inside `site/` (planned):

- `public/` — static assets copied from `assets/`
- `src/components/` — shadcn components + composables
- `src/pages/` — route pages (`/`, `/keys`, `/verify`)
- `src/lib/` — utils (verification helpers, formatting)
- `tailwind.config.ts` — custom theme tokens

## Color Palette Mapping

Brand palette (light → dark):

- 50: `#d1dbe4`
- 200: `#a3b7ca`
- 400: `#7593af`
- 600: `#476f95`
- 800: `#194a7a`

Tailwind theme tokens (example):

- primary: 600 `#476f95` (default)
- primary-foreground: white
- secondary: 200 `#a3b7ca`
- muted: 50 `#d1dbe4`
- accent: 400 `#7593af`

Implementation detail will be added in Tailwind config when scaffolding.

