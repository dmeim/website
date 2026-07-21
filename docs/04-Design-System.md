# Design System

## Colors

Primary palette:

- `#d1dbe4` (50)
- `#a3b7ca` (200)
- `#7593af` (400)
- `#476f95` (600)
- `#194a7a` (800)

Roles (initial):

- Primary: 600 with foreground white
- Secondary: 200 for subtle surfaces
- Accent: 400 for hovers, badges
- Muted: 50 for backgrounds, separators

## Typography

- Prefer a purposeful, non-default font stack (avoid Inter/Roboto/Arial/system-only defaults as the sole identity)
- Fluid type scale; responsive leading and spacing

## Styling Approach

- Plain CSS with CSS custom properties for theme tokens
- Light and dark modes; dark respects user preference with a manual toggle
- No CSS frameworks; no UI component libraries
- Icons via Lucide

## Motion & A11y

- Reduced motion friendly animations; micro-interactions only
- Focus-visible styles; keyboard accessible controls
- Sufficient contrast in both light and dark modes
