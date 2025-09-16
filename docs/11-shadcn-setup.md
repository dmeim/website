# shadcn/ui Setup (Vite + React)

This site uses shadcn/ui components exclusively. Below is the plan to integrate shadcn/ui with Vite + React.

## Steps (after scaffolding `site/`)

1) Tailwind setup

```
npm i -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Configure `tailwind.config.ts` content:

```
content: [
  "./index.html",
  "./src/**/*.{ts,tsx}",
]
```

Install shadcn deps:

```
npm i class-variance-authority clsx tailwind-merge lucide-react
npm i -D tailwindcss-animate
```

Add the plugin:

```
plugins: [require("tailwindcss-animate")]
```

2) Alias and utils

- In `tsconfig.json`, set `@/*` to `src/*`.
- Add `src/lib/utils.ts` with `cn` helper (clsx + tailwind-merge).

3) shadcn CLI

```
npx shadcn-ui@latest init
```

Use options suitable for Vite (paths under `src/`, `tailwind.config.ts`, `src/components/ui` target). The CLI may prompt for a framework; choose React if available, or proceed and adjust `components.json` as needed.

4) Add components

```
npx shadcn-ui@latest add button card badge tabs accordion alert tooltip toast switch navigation-menu separator dialog sheet
```

5) Theming

- Map brand palette to CSS variables via Tailwind theme extension.
- Ensure light/dark themes via `:root` and `.dark` tokens consistent with shadcn defaults.

Note: shadcn/ui components are framework-agnostic React components; minor path and config adjustments make them work smoothly with Vite.

