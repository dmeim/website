# Sliding Thumb UI Primitive — Design Spec

**Date:** 2026-07-23  
**Status:** Approved (build complete feature)  
**Site:** dmeim.com (Astro 7 · React islands · plain CSS tokens)

## 1. Goal

Ship one reusable **sliding-thumb** control used by:

1. Header theme selector (equal + default chrome)
2. Chat thinking level (equal + default chrome)
3. Center header page nav (measured + ghost chrome)

Shared motion and positioning; optional chrome. Usable from Astro markup, vanilla JS, and React — not React-only and not a web component.

## 2. Non-goals

- Web component wrapper
- Mobile drawer nav thumb (`.site-nav` is desktop-only; drawer stays plain links)
- Hover-driven thumb motion on nav (see §6)
- Phased “primitive only” delivery — all three call sites ship together

## 3. Decisions summary

| Topic | Decision |
| --- | --- |
| Delivery | CSS-first classes + tiny JS positioning helper |
| Layout modes | `equal` (default) and `measured` |
| Chrome | Default (bordered track + filled pill) and `ghost` (quiet, no track chrome) |
| Theme / thinking a11y | Keep `role="radiogroup"` / `role="radio"` |
| Nav a11y | Stay links with `aria-current="page"`; thumb is decorative (`aria-hidden`) |
| Nav hover | Selection-only thumb; hover may change link color only |

## 4. API surface

### 4.1 CSS (`src/styles/sliding-thumb.css`)

Imported from `global.css` so every page gets the primitive.

| Class | Role |
| --- | --- |
| `.sliding-thumb` | Root / track |
| `.sliding-thumb__thumb` | Absolute decorative thumb |
| `.sliding-thumb__option` | Interactive child (button or link) |
| `.sliding-thumb--equal` | Equal-width grid; CSS-var positioning |
| `.sliding-thumb--measured` | Flex / free layout; JS sets x/width vars |
| `.sliding-thumb--ghost` | Quiet chrome (no bordered track fill) |

**Equal mode vars** (set on root):

- `--sliding-thumb-count` — number of options (grid columns + thumb width divisor)
- `--sliding-thumb-index` — zero-based active index

Thumb transform: `translateX(calc(var(--sliding-thumb-index) * 100%))` with width  
`calc((100% - 2 × inset) / count)`.

**Measured mode vars** (set by helper):

- `--sliding-thumb-x` — px offset of active option relative to root
- `--sliding-thumb-w` — px width of thumb (option width, optionally inset)

### 4.2 JS helper (`src/scripts/sliding-thumb.ts`)

```ts
mountSlidingThumb(root: HTMLElement, options?: SlidingThumbMountOptions): () => void
syncSlidingThumb(root: HTMLElement, options?: SlidingThumbSyncOptions): void
computeMeasuredThumbVars(rootBox, optionBox, inset?): { x: number; w: number }
```

`mountSlidingThumb`:

- Runs initial `syncSlidingThumb`
- Re-syncs on `ResizeObserver(root)`, `window` resize, and `document.fonts.ready`
- Returns a dispose function that removes listeners / observer

Call sites that change selection without remounting (theme preference, Astro view transitions) call `syncSlidingThumb` or remount on `astro:page-load`.

### 4.3 React

No required React package. `ThinkingLevelThumb` keeps its public props API and applies shared classes + equal-mode CSS vars internally.

## 5. Call-site migrations

### 5.1 Theme toggle

- Root: `theme-toggle sliding-thumb sliding-thumb--equal`
- Thumb / options: shared BEM classes (legacy `theme-toggle-*` may remain as thin sizing aliases if needed)
- On preference change: set `--sliding-thumb-index` (0 light / 1 system / 2 dark); drop `[data-theme-pref] .theme-toggle-thumb` transform rules
- Preserve radiogroup semantics and Lucide icons

### 5.2 Thinking level

- Root: `chat-thinking-toggle sliding-thumb sliding-thumb--equal`
- Style `--sliding-thumb-index` / `--sliding-thumb-count` from `THINKING_LEVELS`
- Remove duplicated thumb chrome from `ChatShell.css`; keep thinking-specific sizing / label / disabled styles

### 5.3 Site nav

- Markup: add decorative thumb; mark links as `.sliding-thumb__option`
- Classes: `site-nav sliding-thumb sliding-thumb--measured sliding-thumb--ghost`
- Mount helper from BaseLayout (or small script) on load + `astro:page-load`
- Remove `.site-nav a::after` underline rules
- Active option: `[aria-current="page"]`

## 6. Nav hover policy

**Selection-only thumb.** The current underline follows both `aria-current` and `:hover`, which fights a single shared thumb (two targets, one indicator). The thumb tracks the current page only. Hover still brightens link color via existing color transitions. Documented here so the change is intentional, not an oversight.

## 7. Visual parity

Default chrome must match today’s theme / thinking look:

- Track: `1px` border, `--radius`, `--color-ground-elevated`
- Thumb: inset `2px`, spot fill + accent inset ring, `transform` transition `0.2s ease`

Ghost (nav): transparent track; soft spot (or accent-tinted) pill behind the active label — quieter than default control chrome, still readable as “here.”

## 8. Verification

- `npm test` (pure measure helper if covered)
- `npx tsc --noEmit` / project typecheck if available
- `npm run build` (no Worker deploy)

## 9. Out of scope follow-ups

- Optional React `SlidingThumb` component for future equal-mode islands
- Mobile drawer thumb (only if nav pattern expands later)
