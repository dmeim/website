# Redesign Concepts (/home1 – /home6)

Six homepage concepts, in two rounds, for a flatter, more professional direction. They keep the existing palette (cream/white, black/gray, gold) and the motion-forward feel, but each proposes its own type, shape language and component vocabulary. The live site is untouched; these routes exist only for comparison.

Next step: pick a direction (or a blend), then extract its tokens and components into a shared UI library and roll it out site-wide.

## How they're wired

- `src/layouts/ConceptLayout.astro` is an isolated page shell. It does **not** load `global.css`, the site header, or the ambient Life field, so each concept owns its whole look. It shares the `theme` localStorage key with the live site and sets `noindex`.
- `src/components/concepts/shared/concept-runtime.ts` handles theme buttons (`[data-theme-set]`) and scroll reveals (`[data-reveal]`, `[data-reveal-group]`), with reduced-motion fallbacks.
- `ConceptSwitcher.astro` is a review-only pill (bottom-right) to jump between concepts and the live home.
- Each concept lives in its own folder and imports content from `src/content/site.ts` and `src/content/tools.ts` (no content was changed).
- Every concept ends with a **"System — component preview"** section: buttons, fields, select, checkbox/switch, segmented control, status badges, tabs, tooltip, card, and more in that concept's style.

## The concepts

| | 1 · Ledger | 2 · Studio | 3 · Monograph |
| --- | --- | --- | --- |
| Route | `/home1` | `/home2` | `/home3` |
| Folder | `concepts/ledger/` | `concepts/studio/` | `concepts/monograph/` |
| Feel | Swiss editorial studio | Warm product / bento | Quiet-luxury publication |
| Type | Geist + Geist Mono | Inter Tight + Inter + JetBrains Mono | Instrument Serif + Inter |
| Shape | 0 radius, hairline grid, no shadows | 20px tiles, pill controls, 1px borders | Sharp rectangles, full-bleed inverted bands |
| Signature macro motion | Masked headline reveal, cursor-following work preview, tool marquee | Bento reveal, FLIP work filter, ⌘K command palette | Giant wordmark that scales on scroll, pinned horizontal work gallery, word-by-word statement highlight |
| Signature micro motion | Underline draws, row fills, count-ups | Cursor spotlight on tiles, sliding thumbs, toasts | Magnetic CTA with rotating text ring, accordion, inverted-band header |

### Round 2 — quieter concepts

Feedback on 1–3: too noisy. Concepts 4–6 follow a strict "quiet" rulebook: ≤2 typefaces, nothing above ~3.5rem, no shadows/gradients/marquees/cursor-followers/parallax/pinning, gold only for links, focus and one small marker. Motion is limited to a short fade-in on reveal, hover colour shifts, and one signature micro-interaction each.

| | 4 · Letter | 5 · Profile | 6 · Plain |
| --- | --- | --- | --- |
| Route | `/home4` | `/home5` | `/home6` |
| Folder | `concepts/letter/` | `concepts/profile/` | `concepts/plain/` |
| Feel | Single-column personal letter; writing carries it | Refined online CV; sticky identity column + list rows | Calm, centred brand page; flat filled panels |
| Type | Newsreader (serif) only | Inter only | Manrope only |
| Shape | No containers; hairlines and whitespace | Hairline-separated rows, 8px radius tiles | Borderless surface panels, 16px radius, 10px controls |
| Signature interaction | Link underline turns gold with an arrow; Copy → Copied | Scroll-spy gold marker glides along the side nav | Surface-colour hover + 0.98 press; Copy → Copied |

## Known content gaps (apply to any choice)

- `currentChapter.body` and `venues` still reference the old "Midnight Concert Hall" look and Framer Motion.
- `pedagogy` bodies and key fingerprints are lorem placeholders.
- `plannedTools()` is empty, so concepts substitute another stat for "Planned".

## Removing the concepts

Delete `src/pages/home1.astro` through `home6.astro`, `src/components/concepts/`, and `src/layouts/ConceptLayout.astro`.
