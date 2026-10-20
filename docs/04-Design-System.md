# Design System

**Midnight Concert Hall** — dark ground, champagne (gold) and steel (teal) accents, quiet motion. Adapted from the `pre-retro-pop` branch of the georgios-zerdalis reference (`reference/`, gitignored).

Source of truth: `src/styles/global.css` (tokens) and `src/layouts/BaseLayout.astro` (fonts, theme bootstrap). If this doc and the CSS disagree, the CSS wins — update this doc.

## Colors

### Raw palette

Each hue has a light-theme and dark-theme value; semantic tokens pick one per theme.

| Token | Light theme | Dark theme | Notes |
| --- | --- | --- | --- |
| `--color-gold-*` | `#8a7349` | `#d4bc8a` | Champagne accent |
| `--color-teal-*` | `#5c7385` | `#8fa3b0` | Steel accent |
| `--color-stone-*` | `#565650` | `#a7a7a2` | Muted ink |
| `--color-cream-*` | `#f3eee6` | `#eceae6` | Ink on dark |
| `--color-night-*` | — | `#050607` / `#101112` | Dark ground / elevated |
| `--color-mist-*` | `#f5f4f0` / `#ecebe6` | — | Light ground / elevated |
| `--color-black-light` | `#0c0e12` | — | Ink on light |
| `--color-blue-*` | `#194a7a` | `#476f95` | Legacy brand blue (AD-003); rarely used |

### Semantic tokens (use these in components)

| Token | Role |
| --- | --- |
| `--color-ground` | Page background |
| `--color-ground-elevated` / `--color-surface` | Panels, cards, raised surfaces |
| `--color-ink` | Primary text |
| `--color-ink-muted` | Secondary text, meta |
| `--color-accent` | Champagne — links, highlights, focus |
| `--color-accent-soft` | Steel — secondary accent |
| `--color-border` | Hairlines (ink mixed at 12–15%) |
| `--color-overlay` | Scrims behind lightboxes and modals |
| `--color-spot` | Faint gold wash for spotlight effects |

Prefer semantic tokens over raw palette values so both themes work automatically.

## Theming

- Theme is set via `data-theme="light" | "dark"` on `<html>`. The user's preference (`light` / `dark` / `system`) is stored in `localStorage` under `theme` and mirrored to `data-theme-pref`.
- An inline script in `BaseLayout.astro` applies the theme before first paint (no flash). `system` follows `prefers-color-scheme`; dark is the fallback.
- The toggle lives in the header (`src/scripts/theme-toggle`).

## Typography

- **Current:** every face token (`--font-display`, `--font-serif`, `--font-sans`, `--font-mono`) resolves to **JetBrains Mono**.
- **Previous faces** (kept commented in `global.css`, still loaded from Google Fonts): Syne (display), Instrument Serif (serif), Manrope (sans). Restore those token values to switch back.
- Scale: `--text-xs` (0.6875rem), `--text-sm` (0.8125rem), `--text-md` (1rem), then fluid `--text-lg` / `--text-xl` / `--text-2xl` via `clamp()` across 360–1280px viewports.
- Reading width: `--measure: 65ch`.

## Layout & Spacing

- Spacing scale: `--space-3xs` (0.125rem) through `--space-xl` (2.5rem) and up.
- Page width `--site-max: 80rem`; header height `--header-height: 4.25rem`.
- Corners are nearly square: `--radius: 2px`. Photo frames use `--he-frame-radius: 0.375rem`.

## Motion

- Easing: `--ease-out`, `--ease-in-out`, `--ease-expo`. Durations: `--duration-fast` (150ms), `--duration` (280ms), `--duration-slow` (560ms).
- React islands use Framer Motion. Shared primitives live in `src/components/motion/` (`Reveal`, `TextReveal`, `Magnetic`, `PhotoTilt`, `Grain`).
- Ambient background: a soft Game of Life field (`LifeField`) site-wide, kept alive by a gardener (`src/lib/game-of-life/gardener.ts`). Switch to the dotted wave (`GlyphField`) via `SITE_FIELD_MODE` in `SiteEffects.tsx`. Hidden on `/game-of-life/simulation`.
- Respect reduced motion: the `prefers-reduced-motion` block in `global.css` and `useReducedMotion()` in islands collapse animations to static states.

## Styling Approach

- Plain CSS with custom properties; one CSS file beside each component (e.g. `HomeExperience.css`).
- No CSS frameworks; no UI component libraries.
- Icons via Lucide (`lucide`, `@lucide/astro`).

## Accessibility

- Semantic landmarks and labelled sections; focus-visible styles; keyboard-reachable controls.
- Sufficient contrast in both themes — the light theme swaps accents to their darker variants for this reason.
