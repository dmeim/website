# Design System

**Profile** is a refined online CV: flat and quiet, with cream or near-black ground, black and grey ink, and gold used sparingly. Colour, spacing and hairlines carry the hierarchy.

This branch implements concept 5 site-wide. Design details, decisions and known issues are in `docs/13-Redesign-Profile.md`. The token and component contract shared with the other redesign branches is `docs/12-UI-Library-Spec.md`.

Source of truth:
- Tokens: `src/ui/tokens.css`
- Element defaults: `src/ui/base.css`
- Stylesheet entry: `src/ui/index.css`, loaded once by `BaseLayout.astro`
- Fonts: `src/ui/fonts/Fonts.astro`

If this doc and the CSS disagree, the CSS wins; update this doc.

## Colors

Use only `--ui-*` tokens; components never use raw colours. Main values:

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--ui-bg` | `#f6f4ef` | `#111110` | Page ground |
| `--ui-bg-inset` | `#efece6` | `#0c0c0b` | Code blocks, read-only output |
| `--ui-surface` | `#eeebe4` | `#191917` | Flat tiles, row hover |
| `--ui-popover` | `#fbfaf7` | `#1b1b19` | Menus, dialogs, toasts (with a `--ui-line-strong` border) |
| `--ui-line` / `--ui-line-strong` | ink at 10% / 18% | cream at 10% / 18% | Hairlines |
| `--ui-text` / `--ui-text-muted` | `#171614` / `#6d6961` | `#edeae3` / `#9a968e` | Text |
| `--ui-ink` / `--ui-on-ink` | `#171614` / `#f6f4ef` | `#edeae3` / `#111110` | Primary buttons, checked controls |
| `--ui-accent` | `#8a6d3b` | `#cfb27a` | Gold: links, focus, the current marker, the live dot |
| `--ui-success` / `--ui-warning` / `--ui-danger` / `--ui-info` | muted tones + `-soft` tints | lighter tones + tints | Status |

The live, complete list is at `/colors`, which is generated from the tokens.

## Theming

- **Attributes.** The resolved theme is `data-theme="light" | "dark"` on `<html>`. The preference (`light` / `system` / `dark`) is stored in `localStorage.theme` and mirrored to `data-theme-pref`.
- **Pre-paint.** An inline script in `BaseLayout.astro` applies the theme before first paint. `system` follows `prefers-color-scheme`.
- **Subtrees.** Tokens are also declared on `[data-theme]`, so a subtree can force a theme; `/ui` uses this.
- **Controls.** `ThemeControl` (segmented sun / half / moon) is bound by `src/ui/lib/theme.ts`, which dispatches a `ui:theme` event.
- **Canvases.** Canvas code watches `data-theme` and reads the `--ui-canvas-*` tokens.

## Typography

- **Inter** is the only webfont, loaded in `Fonts.astro`. Body text is 15px at line height 1.6 with features `cv11` and `ss01`. Headings are weight 600 with tight tracking. The largest size, `--ui-fs-3xl`, is about 2.25rem.
- `--ui-font-mono` is the system monospace stack and is used only for code, values and tool output.
- Small labels and section titles are 13px, weight 500, uppercase, wide tracking and muted.

## Layout & Spacing

- **Space scale:** `--ui-space-3xs` (2px) to `--ui-space-4xl` (88px).
- **Gutter:** `--ui-gutter`, at least 16px.
- **Widths:** `--ui-content-narrow` (40rem), `--ui-content` (46rem) and `--ui-content-wide` (64rem).
- **Content pages:** a sticky 320px identity rail sits beside the content column at ≥960px. Below that, a top bar opens a drawer.
- **Corners:** 8px for controls and tiles, 12px for overlays, pills for badges. No shadows or gradients.

## Motion

- Durations are `--ui-dur-instant` / `fast` / `base` / `slow` (80 / 160 / 240 / 360ms), plus `--ui-dur-glide` (320ms) for the signature gold marker that glides to the current nav item.
- Reveals fade up 6px and are gated on `html.js`. React motion code uses `src/ui/lib/motion.ts`.
- Reduced motion: `base.css` collapses every duration, and islands use `MotionConfigProvider` / `usePrefersReducedMotion`.
- The ambient Life field is mounted but off (`AMBIENT_ENABLED` in `SiteEffects.tsx`).

## Styling Approach

- Plain CSS with custom properties, and no frameworks.
- The UI library lives in `src/ui/`:
  - Astro components in `components/`, React components in `react/`;
  - one shared stylesheet per component in `styles/`;
  - `/ui` is the showcase.
- Pages and apps build from the library. Page-unique layout CSS sits beside its component and uses `--ui-*` tokens only.
- Icons are Phosphor via `@/ui/icons` (`<Icon name="…" />`). Lucide remains installed only for the archived concept pages.

## Accessibility

- Every page has a skip link, semantic landmarks and one h1.
- Focus is a single gold `:focus-visible` ring.
- Overlays use native `<dialog>` and focus-trapped drawers.
- Icon-only buttons have accessible names.
- Both themes are tuned so muted text and gold links meet AA contrast on the ground.
