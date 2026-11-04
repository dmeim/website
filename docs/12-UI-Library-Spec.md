# UI Library Spec (site-wide redesign contract)

This is the canonical contract for the site-wide redesign. Three teams re-skin the whole site in parallel, each on its own branch or worktree cut from `feat/redesign-concepts`:

| Team | Reference concept | Route | Concept folder | Character |
| --- | --- | --- | --- | --- |
| **Letter** | 4 | `/home4` | `src/components/concepts/letter/` | Single column, Newsreader only, no containers, hairlines |
| **Profile** | 5 | `/home5` | `src/components/concepts/profile/` | Sticky identity column, hairline rows, Inter only |
| **Plain** | 6 | `/home6` | `src/components/concepts/plain/` | Centred, borderless filled surface panels, Manrope only |

The three designs look different, but they **expose the same tokens, files, components and props**. A component that exists in one design exists in all three, with the same API. Only the CSS values and internal markup may differ. The goal is that any page can be moved between branches without code changes, and that a later decision between the designs (or a blend) is a CSS decision rather than a rewrite.

Read `docs/11-Redesign-Concepts.md` first for the visual direction. The quiet rulebook from that doc still applies to all three: at most two typefaces (one is preferred), nothing larger than about 3.5rem, no shadows, gradients, marquees, cursor-followers, parallax or pinning, and gold used only for links, focus and one small marker. Motion stays restrained: a short fade-in on reveal, hover colour shifts, and one signature micro-interaction per design.

---

## 1. Ground rules for the teams

1. **Behaviour is frozen.** Keep all logic, state, effects, data flow, API calls, URL handling, storage keys and keyboard shortcuts exactly as they are. Only the presentation layer changes: markup structure, class names, CSS, and icons. If a fix is unavoidable, make it a separate `fix:` commit and say why.
2. **Restyle through the library.** Build pages from `src/ui/*` components. Hand-written CSS outside `src/ui/` is allowed only for layout that is unique to one page or app (for example the orthodox wall or the chat thread), and it must use `--ui-*` tokens only, with no raw colours, sizes or durations.
3. **Delete old CSS only once it is replaced.** Remove a tool's `<Name>.css` in the same commit that moves the tool onto library components. Never leave a page half on legacy classes and half on new ones at the end of a package.
4. **Do not touch:**
   - `src/content/**` (text and data);
   - `src/pages/api/**` and anything server-side;
   - `src/lib/**` service logic, except where a package explicitly lists a file;
   - `/home1`–`/home6`, `src/components/concepts/**` and `src/layouts/ConceptLayout.astro`. They stay as reference until the redesign is chosen. (Since deleted on `full-site-redesign`.)
5. **Theme mechanism is fixed.**
   - The `localStorage` key `theme` holds `"light" | "system" | "dark"`, defaulting to `"system"`.
   - The inline pre-paint script in `<head>` sets `data-theme-pref` (the preference) and `data-theme` (the resolved `light`/`dark`) on `<html>`.
   - Canvas code watches `data-theme` with a `MutationObserver`. Keep that attribute as the single source of truth.
6. **Reduced motion is respected everywhere.**
   - CSS uses `@media (prefers-reduced-motion: reduce)`.
   - React motion code uses `m` components inside `MotionRoot` (`src/ui/react/MotionRoot.tsx`), which loads Framer Motion's lighter `domAnimation` features and respects reduced motion.
   - Reveals must render their final state when motion is reduced or JS is unavailable.
7. **Astro ClientRouter is on.** Every inline or init script must stay idempotent on `astro:page-load`. Use the existing `dataset.bound` guard pattern.
8. **Accessibility is a baseline, not the priority.** Use semantic elements, keep visible `:focus-visible`, make every interactive element keyboard-reachable, give icon-only controls an accessible name, and keep ARIA attributes that JS reads (see the risks in each package).
9. **Code style:** TypeScript, double quotes, semicolons, 2-space indent, named exports, `PascalCase.tsx` / `PascalCase.astro` components, `kebab-case.ts` utilities, `@/` imports. Never add AI attribution comments.
10. **Dependencies:** none beyond what is installed, unless the team lead approves. Phosphor is installed (section 6). Lucide stays installed until package Z1 removes it.
11. **Each package ends green.** `npx astro build` passes, `npm test` passes, and both themes and mobile width have been checked in the browser.

---

## 2. File layout (identical in all three branches)

```text
src/ui/
  tokens.css              # the token contract (section 3); light + dark values
  base.css                # reset, element defaults (body, headings, p, a, code, ::selection, :focus-visible), reduced-motion
  legacy.css              # temporary aliases: old global.css tokens + .btn/.eyebrow/.section → new look (removed in Z1)
  index.css               # @imports tokens, base, legacy, and every styles/components/*.css, in that order
  styles/
    components/<name>.css # one file per component, kebab-case (button.css, segmented-control.css, ...)
    layout/<name>.css     # site-header.css, app-shell.css, page-header.css, ...
  fonts/
    Fonts.astro           # <link rel="preconnect"> + font stylesheet(s) for this design; rendered by BaseLayout
  icons/                  # DONE, shared by all three (section 6). Do not fork.
    registry.ts
    Icon.tsx
    Icon.astro
    index.ts
  lib/
    cx.ts                 # className joiner (move from tools/ui/cx.ts; keep a re-export there)
    clipboard.ts          # re-export of @/lib/tools/clipboard copyTextToClipboard
    theme.ts              # read/set theme preference; dispatches "ui:theme" (shared by ThemeControl + any React consumer)
    toast.ts              # framework-free toast bus (section 4.5)
    ids.ts                # useId fallback / id helpers for Astro
  components/             # Astro components (static, zero JS unless noted)
    <Name>.astro
    index.ts              # export { default as Button } from "./Button.astro"; ...
  react/                  # React equivalents for islands (tools, chat, orthodox, game-of-life, home)
    <Name>.tsx
    use-copy.ts           # hooks are kebab-case: use-copy.ts, use-disclosure.ts, ...
    index.ts              # named exports of every React component and hook
  index.ts                # framework-free exports only: icon types, token name list, shared prop types
src/pages/ui.astro        # the /ui showcase (noindex): every component × variant × state, in both themes
```

### Rules

- **One stylesheet per component, shared by its Astro and React versions.** Both versions render the **same DOM and class names** within a design, so one CSS file styles both. Do not use Astro scoped `<style>` for library components.
- **Global CSS loading.** `src/ui/index.css` is imported once by `BaseLayout.astro`. Islands never import library CSS themselves. Every page that hosts an island uses `BaseLayout`.
- **Class and attribute conventions (same in all designs):**
  - The block class is `ui-<kebab-name>` (for example `ui-button`, `ui-segmented-control`), with BEM elements `ui-button__icon`.
  - Variants are data attributes: `data-variant`, `data-size`, `data-tone`, `data-density`.
  - State comes from native and ARIA attributes: `:disabled`, `[aria-pressed]`, `[aria-invalid="true"]`, `[aria-current]`, `[aria-expanded]`, `[data-state="open"]`.
  - Internal elements may differ between designs; the block class, data attributes and props may not.
- **Import boundaries:**
  - `.tsx` files import only from `@/ui/react` and `@/ui/icons`. Never import `@/ui/components` (Astro) into a React file.
  - `.astro` files import from `@/ui/components` and may also render React components without a client directive for static output.
- **API parity:**
  - Every prop listed in section 4 exists with the same name and type in all three designs.
  - A design may ignore a purely visual prop value. For example, Letter may render `Card` without a box, but it must accept the prop and keep the semantics.
  - Additional props are allowed only if all three teams add them, so coordinate through the team leads.
- **Composites** (marked ◇ in section 4) are built only from library primitives and contain no design-specific CSS beyond spacing. Teams may copy a composite's `.tsx` verbatim from another branch.

---

## 3. Token contract

Every design defines **all** of these custom properties in `src/ui/tokens.css`. Names are fixed; values are the design's choice.

### Where tokens are declared

- Declare theme-dependent tokens on `:root[data-theme="light"], [data-theme="light"]` and `:root[data-theme="dark"], [data-theme="dark"]`. That way a subtree with `data-theme` re-themes itself, which the `/ui` showcase uses to render both themes side by side.
- Declare theme-independent tokens (type, space, radius, motion, z-index) on `:root`.
- Set `color-scheme: light` and `color-scheme: dark` in the matching blocks.
- **No-JS fallback:** the pre-paint script defaults to dark, but `tokens.css` must also give `:root:not([data-theme])` the light values plus `@media (prefers-color-scheme: dark)` dark values.

### 3.1 Colour (all theme-dependent)

| Token | Intent |
| --- | --- |
| `--ui-bg` | Page ground (cream in light, near-black in dark). |
| `--ui-bg-inset` | Recessed ground: code blocks, wells, table headers. |
| `--ui-surface` | Filled panel or card (Plain's panel; may equal `--ui-bg` in Letter). |
| `--ui-surface-hover` | Hover fill for interactive rows and cards. |
| `--ui-surface-active` | Pressed or selected fill (current nav item, selected row, segmented thumb). |
| `--ui-field` | Input, select and textarea fill. |
| `--ui-field-hover` | Field hover fill. |
| `--ui-popover` | Background of popovers, menus, tooltips and dialogs. |
| `--ui-overlay` | Scrim behind dialogs and drawers (colour with alpha). |
| `--ui-line` | Hairline border and divider. |
| `--ui-line-strong` | Emphasised border: hover outline, table header rule. |
| `--ui-line-field` | Field border (may be `transparent` in a filled design). |
| `--ui-text` | Primary text. |
| `--ui-text-muted` | Secondary text: ledes, descriptions. |
| `--ui-text-subtle` | Tertiary text: labels, eyebrows, placeholders, meta. |
| `--ui-text-disabled` | Disabled text. |
| `--ui-ink` | Strong fill for primary buttons and solid badges (near-black in light, cream in dark). |
| `--ui-ink-hover` | Hover state of `--ui-ink`. |
| `--ui-on-ink` | Text and icons on `--ui-ink`. |
| `--ui-accent` | Gold, for marks, the focus ring, the current marker and the live dot. |
| `--ui-accent-hover` | Gold hover. |
| `--ui-accent-soft` | Tinted gold background (selected badge, highlight). |
| `--ui-accent-text` | Gold usable as text on `--ui-bg` (AA contrast); used for links. |
| `--ui-on-accent` | Text on a solid gold fill. |
| `--ui-success`, `--ui-success-soft` | Success foreground and tinted background. |
| `--ui-warning`, `--ui-warning-soft` | Warning foreground and tinted background. |
| `--ui-danger`, `--ui-danger-soft` | Error and destructive foreground and tinted background. |
| `--ui-info`, `--ui-info-soft` | Neutral-informational foreground and tinted background. |
| `--ui-live` | Colour of the live/pulsing status dot (usually `--ui-success` or `--ui-accent`). |
| `--ui-diff-add`, `--ui-diff-add-soft` | Inserted text or lines (TextDiff, JsonDiff, RegexTester highlights). |
| `--ui-diff-remove`, `--ui-diff-remove-soft` | Removed text or lines. |
| `--ui-highlight` | Match highlight background (RegexTester, search hits). |
| `--ui-selection` | `::selection` background. |
| `--ui-focus-ring` | Focus ring colour. |
| `--ui-canvas-bg` | Canvas background: game-of-life grid. |
| `--ui-canvas-cell` | Live cell or primary canvas mark. |
| `--ui-canvas-grid` | Canvas grid lines. |
| `--ui-ambient` | Ambient LifeField/GlyphField glyph colour. |

### 3.2 Typography

| Token | Intent |
| --- | --- |
| `--ui-font-body` | Body family (Newsreader / Inter / Manrope). |
| `--ui-font-display` | Headings (may equal body). |
| `--ui-font-mono` | Code, values and output. A system mono stack is fine. |
| `--ui-fs-2xs` | Smallest size: badge and meta. |
| `--ui-fs-xs` | Labels, eyebrows, small print. |
| `--ui-fs-sm` | Secondary text and controls. |
| `--ui-fs-md` | Body (base). |
| `--ui-fs-lg` | Lede and h4. |
| `--ui-fs-xl` | h3. |
| `--ui-fs-2xl` | h2 and section titles. |
| `--ui-fs-3xl` | h1 and page titles; no larger than about 3.5rem. |
| `--ui-fw-regular`, `--ui-fw-medium`, `--ui-fw-semibold` | Weights. |
| `--ui-lh-tight`, `--ui-lh-snug`, `--ui-lh-normal`, `--ui-lh-relaxed` | Line heights. |
| `--ui-tracking-tight`, `--ui-tracking-normal`, `--ui-tracking-wide` | Letter spacing (`wide` is for eyebrows and labels). |
| `--ui-measure` | Reading width (about 65ch). |

### 3.3 Space and layout

| Token | Intent |
| --- | --- |
| `--ui-space-3xs` … `--ui-space-4xl` | Ten steps: `3xs 2xs xs sm md lg xl 2xl 3xl 4xl`. |
| `--ui-gutter` | Page side padding (at least 16px on mobile). |
| `--ui-content-narrow` | Reading column (Letter's main column, prose pages). |
| `--ui-content` | Default page width. |
| `--ui-content-wide` | Wide pages: tools catalog, projects. |
| `--ui-section-gap` | Vertical rhythm between page sections. |
| `--ui-header-height` | Site header height. App shells use it to fill the viewport. |
| `--ui-sidebar-width` | App shell sidebar width (tools, chat). |
| `--ui-control-sm`, `--ui-control-md`, `--ui-control-lg` | Control heights for buttons, inputs and segmented controls. |
| `--ui-icon-sm`, `--ui-icon-md`, `--ui-icon-lg` | Icon sizes; target about 14, 18 and 22px. |

### 3.4 Shape, border, elevation

| Token | Intent |
| --- | --- |
| `--ui-border-width` | Hairline width (1px). |
| `--ui-radius-xs` | Badge, kbd, checkbox. |
| `--ui-radius-control` | Buttons, inputs, segmented controls. |
| `--ui-radius-panel` | Cards and panels. |
| `--ui-radius-dialog` | Dialogs, drawers, popovers. |
| `--ui-radius-pill` | Pills and the switch track. |
| `--ui-shadow-overlay` | Elevation for popovers and dialogs. Quiet designs may use `none` and rely on `--ui-line`. |

### 3.5 Motion

| Token | Intent |
| --- | --- |
| `--ui-dur-instant` | About 80ms: press feedback. |
| `--ui-dur-fast` | 160–180ms: hover and colour shifts. |
| `--ui-dur-base` | About 240ms: drawers, popovers, the segmented thumb. |
| `--ui-dur-slow` | About 400ms: reveal fade-in. |
| `--ui-ease-out`, `--ui-ease-in-out`, `--ui-ease-emphasized` | Easing curves. |
| `--ui-press-scale` | Active scale (Plain uses 0.98; others may use 1). |
| `--ui-reveal-distance` | Translate distance for reveal (0–8px). |

`base.css` sets every `--ui-dur-*` to `0.01ms` and `--ui-reveal-distance` to `0` under `prefers-reduced-motion: reduce`. React motion code reads the same values from `src/ui/lib/motion.ts`, which every team defines with the same export names (`uiEase`, `uiDur`, `fadeUp`, `stagger`).

### 3.6 Focus

| Token | Intent |
| --- | --- |
| `--ui-focus-width` | Ring width (about 2px). |
| `--ui-focus-offset` | Ring offset. |

`base.css` defines a single `:focus-visible` rule using `--ui-focus-ring`, `--ui-focus-width` and `--ui-focus-offset`. Components do not redefine focus styles unless the control is visually inset (a switch, for example).

### 3.7 Z-index layers

These values are the same in all designs:

| Token | Value | Use |
| --- | --- | --- |
| `--ui-z-ambient` | -1 | Life/Glyph field canvas |
| `--ui-z-base` | 0 | |
| `--ui-z-sticky` | 10 | Sticky identity column, sticky table headers |
| `--ui-z-header` | 50 | Site header |
| `--ui-z-drawer` | 60 | Mobile nav, app sidebars on mobile, plus their scrim |
| `--ui-z-popover` | 70 | Menus, popovers, select listboxes |
| `--ui-z-dialog` | 80 | Dialogs, photo lightbox |
| `--ui-z-toast` | 90 | Toaster |
| `--ui-z-tooltip` | 95 | Tooltips |
| `--ui-z-grain` | 100 | Noise overlay, if a design keeps it (pointer-events: none) |

### 3.8 Legacy alias layer (`src/ui/legacy.css`)

So that unmigrated areas and canvas code keep working, the foundation package maps the old `global.css` names onto the new tokens:

- `--color-gold`, `--color-surface`, `--color-border`, `--color-ink`, `--color-black`, `--color-cream`, `--color-ground`, `--color-accent`, `--color-overlay`, `--color-spot`, `--header-height`, `--duration*` and `--ease-*` become `var(--ui-…)` aliases.
- Global `.btn`, `.btn--primary`, `.btn--ghost`, `.eyebrow`, `.section*` and `.sliding-thumb*` are restyled to match the design.

The file is deleted in Z1, once nothing references those names. The canvas readers are migrated to `--ui-*` in their own packages:

| Canvas | Reads today |
| --- | --- |
| GameOfLifeSimulation | `--color-surface`, `--color-gold`, `--color-border` |
| LifeField / GlyphField | `--color-black`, `--color-cream`, `--color-ink` |

---

## 4. Component catalogue

**Legend:**
- **A** = Astro component in `src/ui/components/`.
- **R** = React component in `src/ui/react/`.
- **◇** = composite (built from primitives only).
- All components accept `class` (Astro) or `className` (React), spread the remaining native attributes onto the root (or onto the native control, for form controls), and support `id`.
- React components accept `ref` as a prop (React 19), are controlled when given `value`/`checked`/`open`, and are uncontrolled otherwise.
- Icon props take an `IconName` from `@/ui/icons`.
- "Used by" names the main current consumers; it is not exhaustive.

### 4.1 Foundations and text

| # | Component | A/R | Props | Notes and accessibility | Used by |
| --- | --- | --- | --- | --- | --- |
| 1 | **Icon** | A+R (done) | `name: IconName`, `size?: number \| string` (default `1em`), `weight?: IconWeight`, `mirrored?`, `label?` | Decorative (`aria-hidden`) unless `label` is set, in which case it gets `role="img"`. Lives in `src/ui/icons`. | everywhere |
| 2 | **Link** | A+R | `href`, `external?: boolean` (adds `target="_blank" rel="noopener noreferrer"` plus an `arrow-up-right` icon), `arrow?: "none" \| "right" \| "up-right"`, `tone?: "default" \| "quiet" \| "accent"`, children | Signature hover lives here: Letter's gold underline with arrow, Plain's colour shift. External links get a visually-hidden "(opens in new tab)". | prose, footer, connect, keys, regex memo, attributions |
| 3 | **Eyebrow** | A+R | `as?: "p" \| "span" \| "div"`, children | Small uppercase label. Replaces the global `.eyebrow` (about 26 files). | page headers, cards, tools header |
| 4 | **Prose** | A+R | `as?`, `size?: "sm" \| "md"`, children (or `html` in R for trusted, pre-sanitised strings) | Styles raw HTML: headings, lists, tables, `code`, `pre`, blockquote, hr. Class contract `.ui-prose` so generated markdown (chat) can use it. | writeups (orthodox, game-of-life landings), chat MarkdownBody, MarkdownToHtml preview |
| 5 | **Code** | A+R | `children` | Inline `<code>`. It is also the default `code` style in `base.css`. | hints, keys, examples |
| 6 | **CodeBlock** | A+R | `code: string` (or children), `label?: string` (filename or caption), `language?: string` (data only, no highlighter required), `copy?: boolean` (default true), `wrap?: boolean`, `maxHeight?: string` | `<figure>` + `<pre><code>`. The copy button uses CopyButton. **Class contract** for generated HTML: `.ui-code-block` wraps `pre`, and a `[data-copy]` button inside is handled by a delegated listener (chat keeps `[data-chat-copy]` working by adding `data-copy` alongside it). | keys page (fingerprint and key body), GitMemo, RegexMemo, Crontab, chat code blocks |
| 7 | **Kbd** | A+R | `keys?: string[]` (renders a combo with separators) or children | `<kbd>`. | chat empty-state hints, KeycodeInfo, shortcut hints |
| 8 | **VisuallyHidden** | A+R | `as?`, children | Replaces `.visually-hidden`, `.sr-only` and similar. Chat's hidden file inputs must keep using it (not `display:none`). | everywhere |
| 9 | **SkipLink** | A | `href?: string` (default `#main`) | First focusable element in BaseLayout. Currently missing; add it. | BaseLayout |
| 10 | **Divider** | A+R | `orientation?: "horizontal" \| "vertical"`, `label?: string` | `<hr>` or `role="separator"`. | sections, menus, toolbars |

### 4.2 Actions

| # | Component | A/R | Props | Notes and accessibility | Used by |
| --- | --- | --- | --- | --- | --- |
| 11 | **Button** | A+R | `variant?: "primary" \| "secondary" \| "ghost" \| "danger"` (default `secondary`), `size?: "sm" \| "md" \| "lg"` (default `md`), `href?` (renders `<a>`), `iconStart?: IconName`, `iconEnd?: IconName`, `loading?: boolean`, `pressed?: boolean` (toggle; sets `aria-pressed`), `fullWidth?`, `type?` (default `"button"`), `disabled?` | `loading` sets `aria-busy`, shows a Spinner, and keeps the width stable. A disabled link renders `aria-disabled` and drops its `href`. Replaces `.btn*`, `ToolButton`, `.chat-btn`, `.ow-toolbar__btn` and the connect form's `.btn-primary`. | everywhere (about 200 buttons) |
| 12 | **IconButton** | A+R | `icon: IconName`, `label: string` (required; used as `aria-label` and the tooltip text), `variant?: "ghost" \| "secondary" \| "primary" \| "danger"` (default `ghost`), `size?: "sm" \| "md" \| "lg"`, `pressed?`, `href?`, `tooltip?: boolean` (default true), `iconWeight?` | Square hit target of at least 32px (`md` is 36px or more). | chat (about 25), tools sidebar, orthodox card controls, dialogs and drawers (close), theme control |
| 13 | **CopyButton** | A+R | `value: string` or (R only) `getValue: () => string`, `label?: string` (default "Copy"), `copiedLabel?: string` (default "Copied"), `appearance?: "button" \| "icon" \| "inline"`, `size?`, `variant?` (as Button), `onCopied?: () => void`, `resetAfter?: number` (default 1600ms) | Uses `src/ui/lib/clipboard.ts` (which wraps `copyTextToClipboard`). It swaps label and icon (`copy` → `check`) and announces the change through its own visually-hidden `aria-live="polite"` region. This **replaces the per-tool "Copied" ToolStatus pattern** (more than 60 tools). The Astro version ships a tiny inline script bound via `data-ui-copy`. | 60+ tools, keys page (new), concepts, chat code |
| 14 | **ButtonGroup** | A+R | `align?: "start" \| "end" \| "between" \| "stretch"`, `wrap?: boolean` (default true), `attached?: boolean` (joined segments), `label?: string` (gives `role="group"` + `aria-label`) | Replaces `ToolActionRow` and `.tool-actions`. | tools, dialogs, forms |
| 15 | **Toolbar** | R (+A) | `label: string`, `orientation?: "horizontal" \| "vertical"`, `placement?: "inline" \| "floating-top" \| "floating-bottom"`, children | `role="toolbar"` with roving tabindex across its buttons (arrow keys). `floating-*` positions it over an immersive stage. | game-of-life bar, orthodox EditToolbar, HtmlWysiwyg toolbar, chat header actions |

### 4.3 Forms

All field controls share the same **field wrapper contract**. When given `label`, `hint` or `error`, a control renders inside a Field and wires `aria-describedby` and `aria-invalid` automatically. When `error` is set, `aria-invalid="true"` is applied.

| # | Component | A/R | Props | Notes and accessibility | Used by |
| --- | --- | --- | --- | --- | --- |
| 16 | **Field** | A+R | `label?: string`, `htmlFor?`/`id`, `hint?`, `error?`, `required?`, `optional?: boolean` (shows "optional"), `labelHidden?: boolean`, `layout?: "stack" \| "inline"`, `span?: "auto" \| "full"`, `trailing?` (slot or node beside the label, e.g. a CopyButton), children | Generates `${id}-hint` and `${id}-error`. Replaces `ToolField`, `.form-group` and `.p-field`/`.pl-field`/`.lt-field`. | all forms |
| 17 | **Input** | A+R | Native input attributes, plus Field props, `size?: "sm" \| "md" \| "lg"`, `mono?: boolean`, `iconStart?: IconName`, `suffix?: string \| node`, `clearable?: boolean` + `onClear?` (`search` type shows the clear button by default), `revealable?: boolean` (password show/hide toggle) | Types in use: text, search, email, password, number, tel, url, `datetime-local`, date. Read-only output inputs use `readOnly` and get the "output" look via `[readonly]`. | about 150 inputs across tools, connect form, chat search and rename, orthodox picker search |
| 18 | **Textarea** | A+R | Native textarea attributes, plus Field props, `mono?`, `rows?`, `resize?: "vertical" \| "none"`, `autoGrow?: boolean` (R; min/max rows via `minRows`/`maxRows`) | Read-only output textareas get the output look. The chat composer keeps its own autosize JS; give it `resize="none"` and do not add `autoGrow`. | about 110 textareas in tools, connect message, chat composer and edit |
| 19 | **Select** | A+R | Native select attributes, plus Field props, `size?`, `options?: Array<{ value: string; label: string; disabled?: boolean; group?: string }>` or children `<option>` | Always a **native** `<select>`, restyled with a chevron icon. No custom listbox. | about 35 selects: tools, chat model settings, orthodox collection and group |
| 20 | **Checkbox** | A+R | `label: string \| node`, `description?`, `checked?`, `defaultChecked?`, `indeterminate?` (R), `disabled?`, `invalid?`, `onChange?` (native) | Native checkbox, custom visual. Replaces `ToolCheck` (non-toggle) and chat MCP tool rows. | about 50 tools, chmod matrix (`labelHidden`), chat MCP |
| 21 | **Switch** | A+R | Same props as Checkbox plus `labelPosition?: "start" \| "end"` | Native `<input type="checkbox" role="switch">`. Replaces `ToolCheck toggle`. | tools options, chat MCP server toggles, orthodox settings |
| 22 | **RadioGroup** | A+R | `name`, `legend: string`, `legendHidden?`, `options: Array<{ value; label; description?; disabled? }>`, `value?`, `defaultValue?`, `onChange?(value)`, `orientation?: "vertical" \| "horizontal"` | `<fieldset>` + native radios. | WordCodeGenerator radio rows, QR options |
| 23 | **SegmentedControl** | A+R | `name`, `label: string`, `labelHidden?`, `options: Array<{ value: string; label: string; icon?: IconName; iconOnly?: boolean; disabled?: boolean; swatch?: string }>`, `value?`, `defaultValue?`, `onChange?(value)`, `size?`, `equal?: boolean` (equal-width segments), `indicator?: "slide" \| "fill"` (design default) | Native radios in a `<fieldset>`: arrow keys move the selection, Tab enters and leaves. `swatch` renders a small colour chip (orthodox border colours). The **sliding indicator** is a CSS variable contract: `--ui-seg-index` and `--ui-seg-count` on the root, set by the component (React) or by `data-ui-segmented` script (Astro). Measured widths are allowed when `equal` is false. This replaces `sliding-thumb.css` for the theme toggle, ThinkingLevelThumb, orthodox SegmentedChoice (switch from `aria-pressed` buttons to radios, keeping the same `onChange`), and the Uuid/Ulid/MacAddress raw segment buttons. | theme control, chat thinking level, orthodox (4 uses), Uuid, Ulid, MacAddressGenerator |
| 24 | **Slider** | A+R | `label`, `min`, `max`, `step?`, `value?: number \| [number, number]`, `defaultValue?`, `onChange?(value)`, `showValue?: boolean` (renders `<output>`), `formatValue?(n) => string`, `marks?: number[]` | A single value uses a native `<input type="range">`. A tuple renders two thumbs (the dual range in LoremIpsum); each thumb is its own native range with its own `aria-label` ("Minimum …", "Maximum …"). | Token length, Bcrypt cost, WordCode, LoremIpsum (5, two of them dual), game-of-life speed, orthodox icon count |
| 25 | **ColorInput** | R (+A) | `label`, `value: string` (hex), `onChange(hex)`, `hint?`, `error?`, `allowText?: boolean` (default true; a paired hex text input) | A swatch button wraps native `<input type="color">`, paired with a mono text input. | QRCode (2), SvgPlaceholder (2), ColorConverter |
| 26 | **FileDrop** | R | `label`, `accept?`, `multiple?`, `onFiles(files: File[])`, `hint?`, `error?`, `disabled?`, `children?` (preview area), `compact?: boolean` (button only, no drop zone) | A keyboard-reachable button opens the native picker, and the zone accepts drag-drop (`data-state="dragging"`). The native input stays in the DOM, visually hidden. | Base64FileConverter, PdfSignatureChecker. Chat keeps its own hidden inputs. |
| 27 | **FormGrid** | A+R | `columns?: 1 \| 2 \| 3 \| "auto"` (auto = responsive min-width tracks), `gap?: "sm" \| "md" \| "lg"` | Replaces `ToolFormGrid` (including `exportLayout`, which becomes `columns={3}`). | tools, connect form |
| 28 | **Fieldset** | A+R | `legend: string`, `description?`, `legendHidden?`, children | Replaces `ToolNested` (whose `title` prop becomes `legend`). | QR sub-forms, ListConverter, EtaCalculator, PercentageCalculator, BenchmarkBuilder export |

### 4.4 Data display

| # | Component | A/R | Props | Notes and accessibility | Used by |
| --- | --- | --- | --- | --- | --- |
| 29 | **Badge** | A+R | `tone?: "neutral" \| "accent" \| "success" \| "warning" \| "danger" \| "info"`, `variant?: "soft" \| "outline" \| "solid"`, `size?: "sm" \| "md"`, `icon?: IconName`, children | Also covers tags and chips. Not interactive (wrap it in a Button if it needs to be). | WIP badges (sidebar, catalog), project tags, mime/uap tags, chat tool chips and attachment kinds, card lock kind |
| 30 | **StatusDot** | A+R | `status: "live" \| "wip" \| "archived" \| "idle" \| "busy" \| "success" \| "error"`, `pulse?: boolean` (default: true only for `live` and `busy`), `label?: string` (visible text), `labelHidden?: boolean` | **Live/pulsing indicator, required in all three designs.** The pulse is a CSS animation that becomes static under reduced motion. When the label is hidden, the dot carries `role="img"` with `aria-label`. | project status, chat "generating" per conversation, chat generating line, future uptime marks |
| 31 | **Card** | A+R | `as?: "div" \| "article" \| "section" \| "li"`, `href?` (whole card becomes the link; the inner title is the accessible name), `tone?: "default" \| "inset"`, `padding?: "none" \| "sm" \| "md" \| "lg"`, `interactive?`. Slots/props: `media`, `eyebrow`, `title`, default (body), `footer` | Letter may render it as a hairline-separated block with no box. Only one link per card (no nested interactive elements in a linked card). | project cards, device info cards, GitMemo/RegexMemo/HTTP status entries, crontab helper cards, key blocks |
| 32 | **Panel** | A+R | `title?: string`, `titleId?`, `description?`, `headingLevel?: 2 \| 3`, `actions?` (slot/node, trailing in the header), `aria-live?`, `animate?: boolean` (R; default true; fade-up reveal) | `<section aria-labelledby>`. A titled container for a work area. Replaces `ToolPanel` + `ToolSectionHeading`. | every tool, orthodox settings sections, chat settings |
| 33 | **List** / **ListRow** | A+R | `List`: `as?: "ul" \| "ol" \| "div"`, `divided?: boolean`, `density?: "compact" \| "normal"`, `label?`. `ListRow`: `title`, `description?`, `label?` (leading eyebrow, e.g. a year or category), `icon?: IconName`, `media?` (thumb), `meta?` (trailing text or node), `status?` (StatusDot props), `badge?` (Badge props or node), `href?` / `onSelect?` (R), `current?: boolean` (`aria-current`), `selected?: boolean` (`aria-pressed` or `aria-selected` in pickers), `disabled?`, `actions?` (R node: IconButtons revealed on hover/focus, always visible on touch), `mono?`, `arrow?: boolean` | The row is the main vehicle for Profile's signature. In R, `actions` must stay outside the row's link or button (sibling, not nested). | tools catalog items, tools sidebar items, chat list, archive and library rows, projects list, orthodox picker rows (keep `aria-pressed`), HTTP status codes, reference lists |
| 34 | **KeyValue** | A+R | `items: Array<{ label: string; value: string \| node; mono?: boolean; copy?: boolean \| string; tone?: "default" \| "muted" \| "success" \| "danger"; hint?: string }>`, `layout?: "rows" \| "grid" \| "inline"`, `density?` | `<dl>`. Each row gets a CopyButton (`appearance="icon"`) when `copy` is set. This is the "label, value, copy" pattern hand-rolled in about 20 tools. | UrlParser, DeviceInformation, Jwt claims, PasswordStrength details, PdfSignature, Phone, IBAN, MacLookup, Case/Color/Date/Base converter rows, keys page meta, game-of-life stats, chat metrics |
| 35 | **Stat** / **StatGrid** | A+R | `Stat`: `label`, `value: string \| number`, `size?: "md" \| "lg" \| "xl"`, `mono?`, `hint?`, `live?: boolean` (`aria-live="polite"` on the value). `StatGrid`: `items: StatProps[]` or children, `columns?: "auto" \| 2 \| 3 \| 4` | Big display value. | TextStatistics tiles, RandomPort, KeycodeInfo, OTP code, Chronometer, PasswordStrength score, 404 code, game-of-life generation and population |
| 36 | **Table** | A+R | `caption?: string`, `captionHidden?`, `density?: "compact" \| "normal"`, `stickyHeader?`, `striped?`, `scroll?: boolean` (default true), children (native `thead`/`tbody`/`tr`/`th`/`td`); cells take `data-mono`, `data-align="end"`, `data-tone` | A scroll wrapper (`tabindex="0"`, `role="region"`, `aria-label` = caption) plus the styled native table. Replaces six-plus hand-rolled `*-table-wrap` blocks. | MimeTypes, Jwt, Crontab, Chmod (matrix), RegexTester groups, Ipv4 ×3, Ipv6Ula, BenchmarkBuilder results |
| 37 | **Disclosure** | A+R | `summary: string \| node`, `meta?` (count or badge on the summary line), `open?`, `defaultOpen?`, `onToggle?(open)`, `level?: "section" \| "inline"`, children | Native `<details>`/`<summary>` with a rotating `caret-down` icon. Animate the height only if the design wants to, and respect reduced motion. | tools sidebar categories, catalog categories, chat ThinkingBlock, QR/WordCode advanced options, PdfSignature details |
| 38 | **Quote** | A | `cite?: string`, `source?: string`, children | `<figure><blockquote>` + `<figcaption>`. | home mentor quote, endorsements |
| 39 | **Figure** | A+R | `src`, `alt`, `caption?`, `ratio?: string`, `frame?: boolean`, `priority?`. In Astro it takes an `ImageMetadata` or a string and uses `astro:assets` `<Image>`. | Media frame used for the home and projects imagery. Photo lightbox triggers wrap it. | home, projects, orthodox landing |
| 40 | **Swatch** | A+R | `color: string`, `label?`, `code?: string` (token name), `value?: string` (hex shown), `size?: "sm" \| "md" \| "lg"`, `selected?`, `as?: "div" \| "button"` | Colour sample. As a button it supports `aria-pressed`. | /colors grid, orthodox background picker, ColorConverter preview |

### 4.5 Feedback

| # | Component | A/R | Props | Notes and accessibility | Used by |
| --- | --- | --- | --- | --- | --- |
| 41 | **Notice** | A+R | `tone?: "neutral" \| "info" \| "success" \| "warning" \| "danger" \| "accent"`, `variant?: "inline" \| "callout"` (default `inline`), `title?`, `icon?: IconName \| false` (defaults by tone), `actions?` (slot/node), `live?: "polite" \| "assertive" \| "off"` (default `polite`; `assertive` for danger callouts), `role?` | `inline` is a single status line and **replaces `ToolStatus`** (tone mapping: `default`→`neutral`, `error`→`danger`, `success`→`success`, `accent`→`accent`). `callout` is a boxed message with an optional title and actions. Keep `role="status"`/`role="alert"` semantics. | about 230 ToolStatus uses, ToolHint (`tone="neutral"` with `live="off"`), keys notice, chat error banner, connect form status, orthodox empty notes |
| 42 | **Toast** / **Toaster** | A+R | `toast({ message: string; tone?: Notice tone; action?: { label: string; onClick: () => void }; duration?: number })` from `src/ui/lib/toast.ts` (framework-free). `Toaster.astro` renders the live region once in BaseLayout; `Toaster.tsx` exists for the `/ui` showcase and tests. | `aria-live="polite"` region and `role="status"` items. Pause on hover/focus; dismiss with Escape. Under reduced motion, no slide. **Not used on the current site**, but required so every design ships it; use it for chat background-generation and export results if a package wants to. | optional everywhere |
| 43 | **Spinner** | A+R | `size?: "sm" \| "md" \| "lg"`, `label?: string` (default "Loading") | Uses `circle-notch` (or design CSS) with a visually-hidden label; static under reduced motion. | ToolMount fallback, chat status spinner, AsciiTextDrawer font load, Button `loading` |
| 44 | **Skeleton** | A+R | `width?`, `height?`, `lines?: number`, `radius?: "control" \| "panel" \| "pill"` | `aria-hidden`; the container sets `aria-busy`. Shimmer is optional and off under reduced motion. | tools shell before hydration (`client:only` currently shows blank), chat list loading |
| 45 | **Progress** | A+R | `value?: number`, `max?: number` (default 100), `indeterminate?`, `label: string`, `labelHidden?`, `size?: "sm" \| "md"`, `duration?: number` (ms; countdown mode, an animated fill with `key`-restart semantics), `tone?` | Native `<progress>` or `role="progressbar"`. The `duration` mode replaces the orthodox `.ow-panel__timer` keyframe and the OTP countdown. | OTP countdown, orthodox auto-close timer, Bcrypt/RSA busy states (indeterminate), camera recording time |
| 46 | **EmptyState** | A+R | `icon?: IconName`, `title: string`, `description?`, `action?` (slot or `{ label, href \| onClick }`), `size?: "sm" \| "md" \| "lg"` | Replaces `ToolEmpty`, `chat-empty`, `chat-empty--hero` (use `lg`) and `.ow-empty`. | tools (no results, no capture), catalog no match, chat empty, archive/library empty, orthodox |
| 47 | **Tooltip** | A+R | `content: string`, `placement?: "top" \| "bottom" \| "start" \| "end"`, `delay?: number`, children (the trigger) | `role="tooltip"`, linked with `aria-describedby`. Shown on hover and on `:focus-visible`; Escape hides it. CSS-first, with no positioning library; flip via `placement`. Never the only source of essential information. | IconButton labels, the orthodox nav glyph, chat metrics, StatusDot |

### 4.6 Overlays

| # | Component | A/R | Props | Notes and accessibility | Used by |
| --- | --- | --- | --- | --- | --- |
| 48 | **Dialog** | R (+A) | `open`, `onClose()`, `title: string`, `titleHidden?`, `description?`, `size?: "sm" \| "md" \| "lg" \| "full"`, `footer?` (node), `closeLabel?` (default "Close"), `dismissible?: boolean` (default true), children | Native `<dialog>` with `showModal()`, which gives the focus trap, Escape and inert background. Restores focus to the opener on close. A backdrop click closes it when `dismissible` is true. The Astro version is a `<dialog>` with `data-ui-dialog` and a tiny opener script. | chat LibraryPickerModal. PhotoLightbox should adopt its focus handling but keeps its custom shared-element layout. |
| 49 | **Drawer** | R+A | `open`, `onClose()`, `side?: "start" \| "end" \| "bottom"`, `title: string`, `titleHidden?`, `modal?: boolean` (default true below the breakpoint), `width?`, children | Slides with `--ui-dur-base`. Focus trap and focus return when modal. Body scroll lock. The scrim sits at `--ui-z-drawer`. | mobile site nav (A; keep ids `#nav-toggle`/`#mobile-nav`), tools sidebar (mobile), chat sidebar (mobile), orthodox settings and lock panels (as `side="end"`, non-modal sheet, keeping framer-motion presence) |
| 50 | **Popover** | R | `open?`, `onOpenChange?(open)`, `trigger: ReactElement` (gets `aria-expanded` and `aria-controls`), `placement?: "top" \| "bottom" \| "top-start" \| "bottom-start" \| "top-end" \| "bottom-end"`, `label: string` (`role="dialog"` `aria-label`), children | Closes on outside click and Escape, and returns focus to the trigger. Must keep the trigger and content inside one wrapper element. Chat's outside-click detection relies on that (`chat-composer__attach`). | chat model settings and MCP tools popovers |
| 51 | **Menu** | R | `trigger: ReactElement`, `label: string`, `items: Array<{ id: string; label: string; icon?: IconName; onSelect(): void; disabled?: boolean; tone?: "default" \| "danger"; shortcut?: string[] }>`, `placement?` | `role="menu"` / `menuitem`. Arrow keys, Home/End, typeahead and Escape. Focus goes to the first item on open. | chat attach menu (Images / File / Library); row overflow actions if a design wants them |
| 52 | **Tabs** | A+R | `label: string`, `items: Array<{ id: string; label: string; icon?: IconName; badge?: string; disabled?: boolean }>`, `value?`, `defaultValue?`, `onChange?(id)`, `activation?: "auto" \| "manual"`, panels via `renderPanel(id)` (R) or `panel-<id>` slots (A) | WAI-ARIA tabs: arrow keys and Home/End. The indicator follows the SegmentedControl motion. **Not used on the current site**, but required (all three concepts define it). Candidates: Encryption (encrypt/decrypt) and Base64 (string/file) if a package chooses; never at the cost of behaviour changes. | `/ui`, optional |

### 4.7 Navigation and site chrome

| # | Component | A/R | Props | Notes and accessibility | Used by |
| --- | --- | --- | --- | --- | --- |
| 53 | **SiteHeader** | A | `currentPath: string`, `items?: NavItem[]` (default from `src/content/site.ts` or the existing BaseLayout list), `immersive?: boolean` | Brand, SiteNav, ThemeControl and mobile toggle. Keep `id="nav-toggle"`, `id="mobile-nav"`, `data-open`, `.is-open` and `aria-expanded`, or update the inline nav script in the same commit. Must not break `body:has(.he)` home header behaviour (WP H1 owns that). | every page |
| 54 | **SiteNav** | A | `items: Array<{ href: string; label: string; glyph?: string; ariaLabel?: string }>`, `currentPath`, `orientation?: "horizontal" \| "vertical"` | `aria-current="page"`. The Orthodox item keeps the "☦︎" glyph with `aria-label` and a Tooltip. A sliding current-marker is optional per design; if used, it goes through the same `--ui-seg-*` measuring script, not `sliding-thumb.ts`. | header, mobile drawer, footer |
| 55 | **ThemeControl** | A (+R) | `appearance?: "segmented" \| "cycle" \| "text"` (design default), `size?` | Options light / system / dark with icons `sun` / `circle-half` / `moon`. Writes `localStorage.theme`, updates `data-theme-pref` and `data-theme`, follows the OS while on "system", and dispatches a `ui:theme` event. Rendered as markup (no more `#theme-toggle-host` + DOM building in `theme-toggle.ts`), bound by `src/ui/lib/theme.ts`. | header, `/ui` |
| 56 | **SiteFooter** | A | `immersive?: boolean` (renders nothing) | Copyright line, contact link, optional secondary nav. | every non-immersive page |
| 57 | **Breadcrumbs** | A+R | `items: Array<{ label: string; href?: string }>` | `<nav aria-label="Breadcrumb">` + `<ol>`, last item `aria-current="page"`. **Not used today.** Candidate: the tools stage eyebrow ("Tools / Category"). | tools stage (optional), `/ui` |
| 58 | **SideNav** | A+R | `label: string`, `sections: Array<{ id: string; title: string; badge?: string; count?: number; collapsible?: boolean; open?: boolean; items: Array<{ id: string; href?: string; label: string; badge?: string; disabled?: boolean; current?: boolean }> }>`, `header?` (slot or node: search, "All tools"), `onNavigate?(item, event)` (R; lets ToolsShell keep its click interception), `onToggleSection?(id, open)` (R), `spy?: boolean` (A; scroll-spy marker for in-page anchors, Profile's signature) | Collapsible sections use Disclosure. Current item has `aria-current="page"`. The scroll-spy marker uses `--ui-spy-y` and `--ui-spy-h`. | tools sidebar, chat sidebar nav block, in-page section nav (long pages, `/ui`) |

### 4.8 Layout primitives and shells

| # | Component | A/R | Props | Notes | Used by |
| --- | --- | --- | --- | --- | --- |
| 59 | **Container** | A+R | `width?: "narrow" \| "default" \| "wide" \| "full"`, `as?` | Max width from `--ui-content-*` plus `--ui-gutter`. | every page |
| 60 | **Stack** / **Cluster** / **Grid** | A+R | `Stack`: `gap?: SpaceStep`, `as?`, `align?`. `Cluster`: `gap?`, `align?`, `justify?`, `wrap?`. `Grid`: `min?: string` (auto-fill track), `columns?: number`, `gap?` | `SpaceStep` = `"3xs" \| … \| "4xl"`, mapped to tokens. | layout everywhere |
| 61 | **Section** | A | `id?`, `title?`, `eyebrow?`, `intro?`, `link?: { label: string; href: string }`, `headingLevel?: 2 \| 3`, `spy?: boolean` (registers with SideNav spy), `as?` | Merges Letter `Section`, Profile `Section` and Plain `SectionHead`. Replaces the `.section*` classes. | home, projects, keys, colors, landings, `/ui` |
| 62 | **SectionHeading** | A+R | `title`, `titleId?`, `description?`, `trailing?` (slot or node), `level?: 2 \| 3 \| 4` | A lightweight heading row. Replaces `ToolSectionHeading` where it is used outside a Panel. | tools, chat settings |
| 63 | **PageHeader** | A+R | `eyebrow?`, `title: string`, `titleId?`, `lede?`, `meta?` (slot or node), `actions?` (slot or node), `align?: "start" \| "center"`, `reveal?: boolean` (default true) | Replaces `PageIntro` (keeps the TextReveal/Reveal motion behind `reveal`), the tools stage header and the catalog header. The `h1` lives here. | /projects, /keys, /colors, /connect, /404, landings, tools stage + catalog |
| 64 | **Reveal** | A+R | A: attributes `data-reveal`, `data-reveal-group` (children get `--reveal-index`). R: the existing `@/components/motion/Reveal` API (`as`, `delay`, `y`), restyled through tokens | `src/ui/lib/reveal.ts` is the Astro runtime (port of `concept-runtime.ts` reveal). Content is visible without JS. | sections, home |
| 65 | **AppShell** | R (+A wrapper) | `sidebar: ReactNode`, `sidebarLabel: string`, `sidebarOpen: boolean`, `onSidebarOpenChange(open)`, `header?: ReactNode`, `children` (main), `breakpoint?: number` (default 900) | Fills from `--ui-header-height` to the bottom of the viewport. Desktop: sidebar column + main. Below the breakpoint: the sidebar becomes a Drawer with a scrim. Keeps the `data-sidebar-open` attribute on the root (tools and chat CSS and JS key on it). The main area is the scroll container unless the app opts out (chat: `.chat-thread` must stay the scroller). | tools shell, chat shell |
| 66 | **ImmersiveStage** | R | `label: string`, `idle?: boolean` (sets `data-idle`; hides the cursor and auto-hide controls), `toolbar?: ReactNode` (Toolbar `placement="floating-*"`), `children` (canvas or wall) | Full-viewport stage for BaseLayout `immersive` pages. Controls fade on idle but stay reachable by keyboard (`:focus-within` reveals them). | game-of-life simulation, orthodox screensaver |

### 4.9 Composites (◇) for tools

These are built from the primitives above. Each team implements them (or copies them between branches) with identical APIs.

| # | Component | Props | Replaces | Used by |
| --- | --- | --- | --- | --- |
| 67 | **ToolFrame** ◇ (R) | `layout?: "single" \| "split" \| "stack"` (split = two equal columns ≥ 900px), `stagger?: boolean`, children (Panels) | `ToolIsland` + `ToolWorkspace` | every tool |
| 68 | **TransformPanel** ◇ (R) | `input: { label: string; value: string; onChange(v: string): void; placeholder?: string; mono?: boolean; rows?: number }`, `output: { label: string; value: string; mono?: boolean; rows?: number }`, `error?: string`, `options?: ReactNode` (Fieldset/FormGrid between input and output), `actions?: ReactNode` (extra buttons; CopyButton for the output is built in), `swap?: () => void`, `hint?: ReactNode` | The input → output + copy + status pattern hand-built in about 30 tools | T1 converters, T2 text tools, MarkdownToHtml, Docker, BasicAuth |
| 69 | **OutputField** ◇ (A+R) | `label`, `value: string`, `multiline?: boolean`, `rows?`, `mono?` (default true), `copy?: boolean` (default true), `placeholder?`, `hint?`, `error?` | Read-only input/textarea + copy button + "Copied" status | generators (Token, UUID, ULID, BIP39, RSA, Hash, HMAC, Bcrypt), OG meta, OTP secret |
| 70 | **ReferenceList** ◇ (R) | `searchLabel: string`, `query: string`, `onQueryChange(q)`, `count?: number` (live result count), `empty?: EmptyStateProps`, children (List/Cards/Table) | Search + list + empty pattern | HttpStatusCodes, MimeTypes, GitMemo, RegexMemo, EmojiPicker (grid), tools catalog search |

**Catalogue size:** 70 numbered entries (66 primitives and shells plus 4 composites). A few entries export more than one name (List/ListRow, Stat/StatGrid, Toast/Toaster, Stack/Cluster/Grid).

### 4.10 App-specific pieces each design must style

These are not library components. They are app-local markup that the relevant package restyles with tokens and primitives:

- **Chat:**
  - message bubble (user / assistant), inline message editor;
  - thinking block (via Disclosure), tool-call chips (Badge per `chat-tool-chip--{state}`), message metrics (KeyValue `inline` + icons);
  - attachment chips with remove (Badge + IconButton);
  - composer row, jump-to-latest (IconButton floating), generating line (Spinner + Notice).
- **Orthodox:**
  - wall, boards and their 4 border variants (`data-border`);
  - editable card (remove IconButton, lock Badge-button, resize handle `[data-resize]`);
  - hint toast, trigger button.
- **Home** (`HomeExperience`): hero portrait, chapter, appointments, venues bleed, bio, quote, pedagogy pins, closing CTA, photo lightbox.
- **Game of life:** canvas stage (colours via `--ui-canvas-*`).

---

## 5. Layout shells (what each team provides)

1. **Site layout:** `BaseLayout.astro` keeps its props (`title`, `description`, `immersive`). It renders:
   - `<head>`: meta, `Fonts.astro`, the theme pre-paint script (unchanged keys and attributes), and `index.css`.
   - `SkipLink`, `SiteHeader`, then `<main id="main">`, then `SiteFooter` (hidden when immersive), `Toaster`, and `SiteEffects` (ambient field, colours via `--ui-ambient`).
   - The ambient field and grain are design decisions. The quiet rulebook suggests very low opacity or none, but the `SiteEffects` mount and its hidden-route list stay.
2. **Page header and section:** every content page starts with `PageHeader` inside a `Container`, and its body is a sequence of `Section`s.
3. **Tools shell:** `ToolsShell` becomes `AppShell`:
   - **sidebar:** `SideNav` with header slot (an "All tools" ListRow-link, an `Input type="search"` with clear), categories as collapsible sections with `count`, and a WIP `Badge`.
   - **main:** either `ToolCatalog` (a `PageHeader` with count meta, a `ReferenceList` search with live count, category `Disclosure`s containing `List` of `ListRow`s) or the stage (a `PageHeader` with the tool title and description, optional `Breadcrumbs`, then `ToolMount`).
   - **Keep:** `history.pushState(null, …)`, the popstate handler, the `astro:before-preparation` interception, `document.title` updates, modifier-click passthrough and Escape-to-close.
   - **Add:** a `Skeleton` in the `ToolMount` `Suspense` fallback, and move focus to the stage `h1` after client navigation (a11y fix, no behaviour change).
4. **Chat shell:** `ChatShell` becomes `AppShell`:
   - **sidebar:** new-chat Button, a search toggle Input, chat `List` with `ListRow` (StatusDot `busy` while generating, actions archive/delete), and Library/Archive nav rows.
   - **main:** pane header (IconButton menu on mobile, editable title Input, Toolbar of IconButtons), thread (scroll container `.chat-thread`), composer.
   - **Keep:** the `data-sidebar-open` drawer and every keyboard shortcut listed in package C1.
5. **Immersive app pages:** `/game-of-life/simulation` and `/orthodox/screensaver` use `BaseLayout immersive` plus `ImmersiveStage`:
   - Game of Life: a floating dock overlay with a Toolbar (back IconButton, Start/Pause, Step, Random, and Clear Buttons, and a Fullscreen IconButton where the browser supports it), a compact generation and population readout, and the speed `Slider`. The Slider sits outside the Toolbar so its arrow keys are not taken by the Toolbar's roving focus. Space starts or pauses, the right arrow steps, and F toggles fullscreen when focus is on the board. After 6 seconds without pointer or keyboard activity the dock and cursor hide (`use-auto-hide.ts`, ImmersiveStage `idle`); a countdown `Progress` line along the dock's bottom edge shows the time left. The screen stays awake while the simulation runs.
   - Orthodox: the trigger Button, settings `Drawer side="end"` (non-modal sheet) with Fieldset groups (Icons, Frame, and Timing), SegmentedControls, Select, Slider, Swatch buttons, and Progress (countdown), plus the floating edit Toolbar. The card lock sheet uses SegmentedControl and a search `Input`.

---

## 6. Icons: Phosphor

### Package choice

Icons come from **`@phosphor-icons/react`**, used only at development time (a dev dependency). `npm run icons` (`scripts/build-icons.mjs`) renders each listed icon in the four weights the site uses (regular, bold, fill, light) and writes the inner SVG markup to `src/ui/icons/glyphs-island.ts` and `glyphs-page.ts`. Nothing from Phosphor ships to the browser.

- **React islands** import `Icon` from `@/ui/icons`. It only accepts `IslandIconName`, so the browser bundle carries just those glyphs (77 icons, about 31 KB gzipped, down from about 87 KB for the full Phosphor components in six weights).
- **Astro** uses `src/ui/icons/Icon.astro`, which renders inline `<svg>` at build from both glyph files plus the web3icons token marks. It accepts every `IconName` and ships zero JS.
- **Rejected:**
  - `@phosphor-icons/core` raw SVGs: a 9,000-file glob or per-weight `?raw` imports, with no type safety.
  - `@phosphor-icons/web`: an icon font or CSS loaded at runtime.
  - Importing Phosphor's React components directly: lookup by name defeats tree-shaking, so every island shipped every icon in all six weights.

### API

```astro
---
import Icon from "@/ui/icons/Icon.astro";
---
<Icon name="copy" />
<Icon name="check-circle" weight="fill" size={20} label="Copied" class="my-icon" />
```

```tsx
import { Icon } from "@/ui/icons";
<Icon name="magnifying-glass" />
```

- Props: `name: IconName`, `size` (default `1em`), `weight` (`thin | light | regular | bold | fill | duotone`), `mirrored`, `label`, plus `class`/`className`.
- Without a `label` the icon gets `aria-hidden="true"`; with one it gets `role="img"` and `aria-label`.
- Every icon has class `ui-icon` and `data-icon="<name>"`, so a design can size icons by context with CSS (`.ui-button .ui-icon { width: var(--ui-icon-sm); height: var(--ui-icon-sm); }`).

### Adding icons

`src/ui/icons/registry.ts` is a **closed set** keyed by Phosphor's kebab-case name. To use a new icon, add its name to `islandIconNames` (React) or `pageIconNames` (Astro only), in alphabetical order, then run `npm run icons`. This is the one shared file all three teams may append to. Expect trivial merge conflicts, and resolve them by keeping both entries.

**Exception: crypto token marks.** Every cryptocurrency mark comes from [web3icons](https://github.com/0xa3k5/web3icons) (`@web3icons/react`, MIT), never Phosphor, so the set never mixes packs. `src/ui/icons/token-icons.tsx` imports each mark by its deep path (`@web3icons/react/icons/tokens/TokenBTC`) so only used icons ship, forces the `mono` variant so it inherits `currentColor`, and wraps it in Phosphor's props. Registry keys are `token-<ticker>` (`token-btc`, `token-eth`, `token-sol`, `token-xrp`, `token-doge`). To add another token, wrap it there, add the key, and add its ticker to the web3icons list in `CLOUDFLARE_SSR_OPTIMIZE_DEPS` (`astro.config.ts`); otherwise the dev server discovers it mid-request and throws "Invalid hook call". Everything that is not a crypto mark stays Phosphor.

### Weight convention (same in all designs)

| Weight | When to use |
| --- | --- |
| `regular` | Default everywhere. |
| `bold` | Icons rendered at ≤ 14px (inside `sm` buttons, badges, inline metrics) so the stroke holds up. |
| `fill` | Selected, current or pressed states (current nav item icon, `pressed` toggles) and tone icons inside `Notice` callouts and `StatusDot`-adjacent marks (`check-circle`, `warning-circle`, `x-circle`, `info`). |
| `thin`, `light`, `duotone` | Not used. |

### Lucide → Phosphor mapping

The "Where" column is current usage. All icons below are already in the registry.

| Lucide | Phosphor (`name`) | Where / role |
| --- | --- | --- |
| Archive | `archive` | chat sidebar: archive chat, Archive nav |
| ArchiveRestore | `box-arrow-up` | chat ArchivePane: restore |
| ArrowDown | `arrow-down` | chat: jump to latest, output tokens |
| ArrowUp | `arrow-up` | chat: input tokens |
| ArrowRight | `arrow-right` | concepts: link arrows, CTAs; replaces "→" glyphs in UrlEncoder, BasicAuth, DockerRun, Ipv6Ula, Numeronym labels |
| ArrowUpRight | `arrow-up-right` | external links |
| Activity | `pulse` | concepts (status/live) |
| AtSign | `at` | concepts (contact) |
| Bell | `bell` | concepts (notice demo) |
| Brain | `brain` | chat: model/thinking settings, reasoning tokens |
| Check | `check` | chat save, orthodox Done, CopyButton "copied" state |
| ChevronDown | `caret-down` | Select chevron, Disclosure, concepts |
| ChevronLeft / ChevronRight | `caret-left` / `caret-right` | chat MCP drill-in/back, pagination (Ipv4 subnet blocks) |
| CircleAlert | `warning-circle` | Notice danger/warning |
| CircleCheck | `check-circle` | Notice success |
| Clock | `clock` | chat metrics: duration |
| Code2 | `code` | connect: social/code link |
| Copy | `copy` | CopyButton |
| CornerDownLeft | `arrow-elbow-down-left` | Kbd "Enter" hint, concepts |
| Download | `download-simple` | chat export, tool downloads (QR, SVG, Docker, Camera, Base64File) |
| Eye | `eye` | concepts; Input `revealable` (with `eye-slash`) |
| File | `file` | chat attach file |
| FileText | `file-text` | concepts; PdfSignature |
| Gauge | `gauge` | chat metrics: tokens/s |
| GitBranch | `git-branch` | concepts (projects) |
| GitFork | `git-fork` | chat fork chat / fork here |
| Globe | `globe` | concepts (contact) |
| Images | `images` | chat attach images |
| Info | `info` | Notice info, concepts |
| KeyRound | `key` | concepts (keys) |
| Layers | `stack` | orthodox lock kind "group" |
| Library | `books` | chat Library nav / attach from library |
| Mail | `envelope-simple` | connect: email |
| MapPin | `map-pin` | connect: location |
| Menu | `list` | mobile nav toggle (if a design swaps the CSS bars), app shell sidebar toggle (replaces the "Menu" text buttons) |
| MessageCirclePlus | `note-pencil` | chat new chat (Phosphor has no chat-plus; `chat-circle` is in the registry if a design prefers it) |
| Monitor | `monitor` | concepts theme "system" (site uses `circle-half`) |
| Moon | `moon` | theme dark |
| Pin | `push-pin` | orthodox lock kind "pinned" |
| Plus | `plus` | chat attach, orthodox add card, BenchmarkBuilder add suite |
| Quote | `quotes` | concepts (quote) |
| RefreshCw | `arrows-clockwise` | chat regenerate/retry; replaces "↻" in WordCodeGenerator and the regenerate buttons |
| ScrollText | `scroll` | chat sidebar |
| Search | `magnifying-glass` | tools sidebar, chat search, orthodox picker, catalog search |
| Send | `paper-plane-right` | chat send |
| Settings | `gear` | concepts |
| Settings2 | `sliders-horizontal` | concepts; orthodox settings trigger (optional icon) |
| ShieldCheck | `shield-check` | concepts (keys/security) |
| Shuffle | `shuffle` | orthodox lock kind "shuffle", Shuffle button |
| SquarePen | `pencil-simple` | chat rename / edit message |
| Sun | `sun` | theme light |
| SunMoon | `circle-half` | theme system |
| Toolbox | `toolbox` | tools sidebar "All tools" |
| Trash2 | `trash` | chat delete, archive delete, Benchmark remove |
| Wrench | `wrench` | chat MCP tools button, tool chips |
| X | `x` | close/clear/remove everywhere |

There are also **glyph and CSS icons to replace:**

| Current | Replacement |
| --- | --- |
| CSS `::before`/`::after` chevrons on `<summary>` | `caret-down` in Disclosure |
| CSS hamburger bars | Design's choice: `list`, or keep CSS bars inside `IconButton` |
| "→" label glyphs | `arrow-right` |
| "↻" | `arrows-clockwise` |
| "×" close glyphs | `x` |

**Keep the "☦︎" Orthodox nav glyph.** It is content, and Phosphor's `cross` is a Latin cross.

**Extra icons pre-registered for the catalogue:** `arrow-counter-clockwise` (reset), `arrows-left-right` (swap), `arrow-left`, `arrow-square-out`, `calendar`, `camera`, `caret-up`, `clipboard-text`, `circle-notch` (Spinner), `corners-in`/`corners-out` (fullscreen), `dots-three`, `eye-slash`, `funnel`, `house`, `image`, `keyboard`, `link`, `lock`/`lock-open`, `minus`, `palette`, `pause`/`play`/`stop`/`skip-forward` (game-of-life, chronometer, camera), `question`, `record`, `sidebar-simple`, `timer`, `upload-simple`, `video-camera`, `warning`, `x-circle`.

---

## 7. `/ui` showcase page

`src/pages/ui.astro`, `noindex`, not in the nav. It uses `BaseLayout` and `SideNav spy` for in-page navigation. It must:

- render **every** component in section 4, in every variant, size and state: default, hover is not needed, focus (via a "show focus" toggle adding `.ui-show-focus`), disabled, invalid, loading, pressed/selected, empty, long-content overflow;
- render each group twice side by side, wrapped in `data-theme="light"` and `data-theme="dark"` containers (this is why tokens are declared on `[data-theme]` too);
- mount the React versions in one `client:visible` island per group (`src/ui/react/showcase/*.tsx`), so Astro and React parity is visible on the same page;
- list every registered icon (from `iconNames`) at `regular`, `bold` and `fill`;
- show the token sheet: colour swatches with names, the type scale, spacing, radii and motion samples.

The `/ui` page is the acceptance surface: a team lead reviews a design by opening `/ui` on the three branches side by side.

---

## 8. Work packages

Each package is sized so that one sub-agent can finish it while reading under about 150K tokens. Line counts are current `.tsx` + `.css` totals. Each team runs the same packages on its own branch, in this order. Packages on the same row of the ordering can run in parallel within a team once their dependencies are merged.

**Order:**
1. F0
2. F1 → F2 → F3
3. L1
4. In parallel: H1, P1, P2, S1
5. S1 → T1–T9 (in parallel)
6. C1 → C2 → C3
7. O1 → O2
8. G1
9. Z1 → Z2

### Foundation

**F0 · Tokens, base and plumbing.**
- Files: `src/ui/tokens.css`, `base.css`, `legacy.css`, `index.css`, `fonts/Fonts.astro`, `lib/{cx,clipboard,theme,toast,ids,motion,reveal}.ts`, `src/ui/index.ts`, and a `/ui` page skeleton with the token sheet and icon grid.
- Wire `index.css` and `Fonts.astro` into `BaseLayout.astro`, replacing the Google Fonts `<link>` for JetBrains Mono. `global.css` stays imported until Z1, but `legacy.css` loads after it so the old names resolve to the new values.
- Read: `src/styles/global.css`, `sliding-thumb.css`, `BaseLayout.astro`, your concept's CSS, and `concept-runtime.ts`.
- Risks:
  - The theme pre-paint script must keep `localStorage.theme`, `data-theme-pref` and `data-theme`.
  - Canvas code reads `--color-*` (see 3.8), so keep the aliases.

**F1 · Actions and form controls (A+R).**
- Components 1–28: Link, Eyebrow, Prose, Code, CodeBlock, Kbd, VisuallyHidden, SkipLink, Divider, Button, IconButton, CopyButton (+ `use-copy.ts`), ButtonGroup, Toolbar, Field, Input, Textarea, Select, Checkbox, Switch, RadioGroup, SegmentedControl, Slider, ColorInput, FileDrop, FormGrid, Fieldset.
- Add them to `/ui`.
- Risk: SegmentedControl replaces the sliding-thumb. Keep `scripts/sliding-thumb.ts` and its test until L1 and C3 stop using it.

**F2 · Display, feedback and overlays (A+R).**
- Components 29–52: Badge, StatusDot, Card, Panel, List/ListRow, KeyValue, Stat/StatGrid, Table, Disclosure, Quote, Figure, Swatch, Notice, Toast/Toaster, Spinner, Skeleton, Progress, EmptyState, Tooltip, Dialog, Drawer, Popover, Menu, Tabs.
- Add them to `/ui`.
- Risk: Dialog and Drawer focus handling. Test keyboard-only, and test on iOS Safari for `<dialog>` and scroll lock.

**F3 · Navigation, layout and composites.**
- Components 53–70: SiteHeader, SiteNav, ThemeControl, SiteFooter, Breadcrumbs, SideNav, Container, Stack/Cluster/Grid, Section, SectionHeading, PageHeader, Reveal, AppShell, ImmersiveStage, ToolFrame, TransformPanel, OutputField, ReferenceList.
- Complete `/ui`.

### Layout

**L1 · Site chrome.**
- `BaseLayout.astro`: SkipLink, SiteHeader, SiteNav, mobile Drawer, ThemeControl, SiteFooter and Toaster.
- `src/scripts/theme-toggle.ts` and `site-nav-thumb.ts` become `src/ui/lib/theme.ts` plus the SiteNav marker.
- `src/components/react/{SiteEffects,LifeField,GlyphField}.tsx`: switch to `--ui-ambient`.
- `src/components/react/PageIntro.*` becomes a thin wrapper over PageHeader (or callers move to PageHeader).
- Risks:
  - The mobile nav script ids, attributes, focus trap and resize auto-close.
  - ClientRouter re-binding.
  - The `body:has(.he)` fixed header on home.
  - `is-immersive` / `site-main--immersive` classes that chat, tools and the immersive pages depend on, and `--ui-header-height` (chat and tools fill below the header).
  - Hidden-route list for the ambient field.

### Home and static pages

**H1 · Home** (`/`).
- Files: `HomeExperience.tsx` (975) + `.css` (1091), `PhotoLightbox/*` (about 820), `motion/*`.
- Restyle the sections with tokens and primitives (Section, Quote, Figure, Button, Link). Reduce motion to the design's rulebook: remove parallax and magnetic effects only by changing props or CSS, not logic.
- Lightbox: keep its keyboard handling (Esc, ←, →) and the `[data-photo-shell]` shared-element lookup. Add focus restore (a11y fix).
- Risks: framer-motion `LayoutGroup` and shared layout IDs, `useScroll` transforms, the lightbox portal and `html.photo-lightbox-open`.
- Content is fixed. The known content gaps listed in doc 11 are out of scope.

**P1 · Content pages.**

| Page | Work | Risks |
| --- | --- | --- |
| `/projects` | PageHeader, List or Card, StatusDot, Badge tags, Figure | |
| `/keys` | Notice callout, Card per key, KeyValue meta, CodeBlock with copy (new and harmless: copy is additive UI) | |
| `/colors` | Swatch grid | The hex values are hard-coded and out of sync with `global.css`. Generate the swatches from the new tokens, or keep the page's data as-is: the team lead decides, and this is flagged as an open question. |
| `/404` | Stat `xl`, PageHeader, Button | |

**P2 · Connect and landings.**
- `/connect` (`ConnectInfo.astro`, `ConnectForm.astro`): Field, Input and Textarea, Button `loading`, Notice for status, Phosphor icons.
  - Keep `#connect-form`, `#connect-form-status`, `#connect-form-submit`, `data-webhook-url`, the field `name`s, `novalidate` + `setCustomValidity`, the `form-status--*` / `data-kind` hooks (or update the script in the same commit), and the POST to `PUBLIC_N8N_WEBHOOK_URL`.
  - Risk: external webhook. Do not submit real data during testing.
- `/orthodox` landing (`pages/orthodox/index.astro`): keep `[data-orthodox-launch]` and its `requestFullscreen` inline script.
- `/game-of-life` landing: Prose rules list.

### Tools

**S1 · Tools shell and kit adapters.**
- Files: `ToolsShell.tsx` + `.css` (812), `ToolsSidebar.tsx` (since replaced by the rail's `SiteNavTools.astro`), `ToolCatalog.tsx`, `ToolMount.tsx`, `pages/tools/*`, `src/components/tools/ui/*` (about 450), `islands/toolIsland.css` (373).
- **Key move:** re-implement the `tools/ui` kit exports as thin adapters over `@/ui/react`, so all 86 tools pick up the new design immediately. The kit's props stay the same:
  - `ToolButton` → Button
  - `ToolStatus` → Notice inline
  - `ToolCheck` → Checkbox/Switch
  - `ToolPanel` + `ToolSectionHeading` → Panel
  - `ToolField`/`ToolInput`/`ToolSelect`/`ToolTextarea` → Field/Input/Select/Textarea
  - `ToolFormGrid` → FormGrid
  - `ToolNested` → Fieldset
  - `ToolEmpty` → EmptyState
  - `ToolHint` → Notice neutral `live="off"`
  - `ToolIsland`/`ToolWorkspace` → ToolFrame
  - `ToolActionRow` → ButtonGroup

  The batches below then replace per-tool CSS and raw elements and drop the adapters.
- Add an error boundary around `ToolMount` (a failed chunk currently crashes the shell). This is presentational and does not change behaviour.
- Risks:
  - `client:only="react"` (no SSR, so add a Skeleton).
  - `pushState(null)` + popstate + the `astro:before-preparation` interception.
  - Duplicate search state in the sidebar and catalog (keep both).
  - `islands/index.ts` barrel: do not import it from the shell (it would defeat code splitting).

**T1 · Data-format converters and formatters (15, about 2.0K lines).**
- Tools: YamlToJsonConverter, YamlToToml, JsonToYamlConverter, JsonToToml, TomlToJson, TomlToYaml, XmlToJson, JsonToXml, MarkdownToHtml, JsonPrettify, JsonMinify, JsonToCsv, XmlFormatter, YamlPrettify, SqlPrettify.
- Almost all of them map onto TransformPanel; the formatter options use FormGrid + Input number + Checkbox.
- Risks: clipboard only. Keep `aria-invalid` on bad input. (These tools do not persist settings; only BenchmarkBuilder and HtmlWysiwygEditor use `localStorage`.)

**T2 · Text and encoding converters (13, about 2.1K).**
- Tools: Base64StringConverter, TextToNatoAlphabet, TextToBinary, TextToUnicode, UrlEncoder, HtmlEntities, CaseConverter, SlugifyString, NumeronymGenerator, StringObfuscator, EmailNormalizer, SafelinkDecoder, ListConverter.
- Use TransformPanel; the two-way tools use ToolFrame `split`. Use KeyValue with `copy` for the Case rows. ListConverter options go in a Fieldset.
- Risks: clipboard.

**T3 · Numbers, dates, units, maths (9, about 2.0K).**
- Tools: DateConverter, BaseConverter, RomanNumeralConverter, ColorConverter, TemperatureConverter, PercentageCalculator, MathEvaluator, EtaCalculator, ChmodCalculator.
- Use KeyValue with copy rows, ColorInput + Swatch, Table for the chmod matrix (Checkbox `labelHidden`), and Fieldset for the three percentage calculators.
- Risks: DateConverter `setInterval` live clock, mathjs payload, clipboard.

**T4 · Cryptography and generators (12, about 3.1K).**
- Tools: TokenGenerator, HashText, Bcrypt, UuidGenerator, UlidGenerator, Encryption, Bip39Generator, HmacGenerator, RsaKeyPairGenerator, PasswordStrengthAnalyser, BasicAuthGenerator, OtpGenerator.
- Use OutputField, Slider, and SegmentedControl (Uuid/Ulid version and format). Use Progress for OTP countdown and as the indeterminate busy state for Bcrypt and RSA. Use Stat for the password score and the OTP code.
- Risks:
  - Bcrypt and RSA block the main thread (the setTimeout yield must be kept).
  - OTP `setInterval` and QR image generation.
  - The @scure/bip39 wordlists payload.
  - Password inputs: never log values.

**T5 · Files, media output, custom (5, about 2.9K).**
- Tools: Base64FileConverter, PdfSignatureChecker, QRCodeGenerator (839), SvgPlaceholderGenerator, WordCodeGenerator (915).
- Use FileDrop, Figure/img preview + download Buttons, ColorInput, Disclosure for advanced options, RadioGroup (WordCode), and KeyValue + Card for certificates.
- Risks:
  - FileReader and `arrayBuffer`, blob/data URL downloads (`@/lib/tools/download`), and the `qrcode` lib.
  - `pdf-signature-reader` with the `tls` shim (do not touch the alias in `astro.config.ts`).
  - The WordCode large word lists.

**T6 · Device, capture and timing (6, about 2.0K).**
- Tools: CameraRecorder (834), DeviceInformation, KeycodeInfo, UserAgentParser, Chronometer, BenchmarkBuilder.
- Risks:
  - `getUserMedia`, `enumerateDevices`, `MediaRecorder`, canvas snapshots and blob URLs (CameraRecorder): test permission-denied and no-device paths, and keep the `<video>` elements and refs.
  - The KeycodeInfo global `keydown` listener (the new focus styles must not steal keys).
  - The Chronometer and BenchmarkBuilder `requestAnimationFrame` loops.
  - BenchmarkBuilder `localStorage`.
  - Navigator reads.

**T7 · Web and dev references (10, about 2.5K).**
- Tools: HttpStatusCodes, MimeTypes, GitMemo, RegexMemo, CrontabGenerator, JwtParser, UrlParser, OgMetaGenerator, DockerRunToDockerComposeConverter, RandomPortGenerator.
- Use ReferenceList, Table, CodeBlock, KeyValue, Card, and Stat `xl`.
- Risks: clipboard, and the Docker compose file download.

**T8 · Editors, diffs and text analysis (8, about 2.9K).**
- Tools: HtmlWysiwygEditor, RegexTester, TextDiff, JsonDiff, TextStatistics, LoremIpsumGenerator, AsciiTextDrawer, EmojiPicker.
- Use Toolbar with `pressed` IconButtons for the tiptap toolbar, `--ui-diff-*` and `--ui-highlight` tokens, Slider (including dual-range), StatGrid, and a ReferenceList grid for emoji.
- Risks:
  - tiptap: the editor DOM and ProseMirror classes, and HtmlWysiwyg `localStorage`.
  - The RegexTester highlight overlay alignment: font metrics must match between the textarea and the overlay, so both must use `--ui-font-mono` at the same size and line height.
  - figlet font loading.
  - Emoji grid DOM size.

**T9 · Network and data parsing (8, about 2.1K).**
- Tools: Ipv4SubnetCalculator, Ipv4AddressConverter, Ipv4RangeExpander, MacAddressLookup, MacAddressGenerator, Ipv6UlaGenerator, PhoneParserAndFormatter, IbanValidatorAndParser.
- Use Table, KeyValue (copy, tone `muted` for unknown, `danger` for errors), SegmentedControl (MacGen separator and case), and IBAN examples as `Button variant="ghost" size="sm"`.
- Risks: the libphonenumber-js `max` payload, the OUI database size, and `crypto.subtle`.

### Chat

The chat packages run sequentially. They share `ChatShell.css` (1924 lines) and `ChatPane.tsx`. Start C1 by splitting `ChatShell.css` mechanically into `chat-shell.css`, `chat-thread.css` and `chat-composer.css` (a pure move, its own commit).

**C1 · Shell, sidebar and secondary panes.**
- Files: `pages/chat/index.astro`, `ChatShell.tsx` (read for structure; edit markup only), `ChatSidebar.tsx`, `ArchivePane.tsx`, `LibraryPane.tsx`, `LibraryPickerModal.tsx` → Dialog.
- Build with AppShell, List/ListRow, StatusDot `busy`, EmptyState and IconButton.
- Risks:
  - `useChat` (`@ai-sdk/react`) and the transport.
  - The `/api/chat*` and `/api/library*` calls in `api.ts`.
  - `history.replaceState` for `?c=`.
  - `data-sidebar-open`.
  - Keyboard shortcuts: Esc; ⌘/Ctrl+Shift+O; ⌘/Ctrl+/; bare `/`; Enter, Shift+Enter and ⌘+Enter in the composer; Enter and Esc in the title field.
  - Search input focus via ref.
  - Server-side auth gating (no UI).

**C2 · Thread and messages.**
- Files: `ChatPane.tsx` (header + thread parts), `MarkdownBody.tsx`, `messageUtils.ts` (markup strings only), `ThinkingBlock.tsx`, `MessageMetrics.tsx`.
- Apply Prose to markdown, the `.ui-code-block` contract with `[data-chat-copy]` kept, Disclosure, Badge tool chips (`chat-tool-chip--${state}` dynamic class: keep it or map it to `data-tone`), KeyValue inline metrics, and IconButton jump-to-latest.
- Risks:
  - `.chat-thread` must remain the scroll container (`atBottom` maths and the `threadEndRef` sentinel).
  - The ThinkingBlock inner scroller auto-scroll.
  - The delegated copy listener.
  - Streaming re-renders: no layout thrash from new animations.

**C3 · Composer and settings.**
- Files: the composer part of `ChatPane.tsx`, `ComposerStatusBar.tsx`, `ThinkingLevelThumb.tsx` → SegmentedControl, `ModelSettingsPanel.tsx` → Popover + Select, `McpSettingsPanel.tsx` → Switch/Checkbox rows + caret drill-in, the attach Menu, and attachment Badges.
- Risks:
  - Textarea autosize sets the inline `height` (keep `max-height`/`overflow` compatible).
  - Popovers rely on the wrapper `contains()` for outside-click, the window Escape listener in the capture phase, and `menusLocked`.
  - Hidden file inputs triggered by refs.
  - After C3, `sliding-thumb.css` has no consumers left (L1 removed the site ones).

### Orthodox and Game of Life

**O1 · Orthodox wall, boards and edit mode.**
- Files: `OrthodoxScreensaver.tsx` (markup), `IconBoard.tsx`, `EditToolbar.tsx`, `EditableCard.tsx`, and the stage/wall/board/card/toolbar/trigger/hint sections of `OrthodoxScreensaver.css`. Use ImmersiveStage and the Toolbar `floating`.
- Do not edit the hooks (`useFullscreen` and `useWakeLock`, now shared in `src/ui/react/use-fullscreen.ts` and `use-wake-lock.ts`, `useIdle`, `useAutoClose`, `useCardGesture`, `useWallBoards`, `useScreensaverSettings`, `useElementSize`).
- Risks:
  - Fullscreen (webkit fallbacks, exit on `astro:before-swap`), wake lock and idle auto-hide.
  - `useCardGesture` ignores pointerdown on `button` (`closest("button")`) and resizes via `closest("[data-resize]")`. Cards must keep those elements and attributes, and the arrow-key moves.
  - Keep the data attributes `data-idle`, `data-arranging`, `data-editing`, `data-dragging`, `data-border`, `data-kind` and `data-missing`.
  - The inline `--board-w` style and the inline background.
  - The framer-motion jiggle in IconBoard.
  - `onWallClick` checks `event.target === currentTarget`, so do not wrap the wall in extra elements.

**O2 · Orthodox panels.**
- Files: `ScreensaverSettings.tsx`, `SegmentedChoice.tsx` → SegmentedControl (keep the `onChange` contract; swatch chips via `swatch`), `CardLockPanel.tsx`, and the panel/field/segment/select/range/backgrounds/picker CSS.
- Use Drawer (non-modal sheet) and Progress `duration` for the auto-close timer (it restarts via `key={cycle}`).
- Risks:
  - CardLockPanel scrolls to `[aria-pressed="true"]` inside its list, so picker rows keep `aria-pressed`.
  - `localStorage` `orthodox-screensaver:v1`.
  - The Escape cascade (picker → editing → panel).

**G1 · Game of Life simulation.**
- Files: `GameOfLifeSimulation.tsx` (markup lines about 312–389) + `.css` (188).
- Use ImmersiveStage, Toolbar, Button `pressed` (Start/Pause), Slider (keep `#gol-sim-fps`, 1–60), StatGrid and Link (Exit).
- Switch the canvas colour reads from `--color-surface`/`--color-gold`/`--color-border` to `--ui-canvas-bg`/`--ui-canvas-cell`/`--ui-canvas-grid`. This is the only logic-adjacent edit allowed: a token name swap in the `getComputedStyle` calls. Keep the hex fallbacks.
- Risks:
  - The `requestAnimationFrame` loop.
  - The ResizeObserver on `.gol-sim__stage`, which needs a definite flex size.
  - Pointer capture painting and the suppressed context menu.
  - The `data-theme` MutationObserver redraw.

### Wrap-up

**Z1 · Cleanup.**
- Remove `lucide` and `@lucide/astro` from `package.json`, along with `chat/LucideIcon.tsx`, `src/scripts/theme-toggle.ts`, `site-nav-thumb.ts`, `sliding-thumb.ts` + its test, `src/styles/sliding-thumb.css`, `legacy.css`, the remaining `global.css` (fold anything still needed into `base.css`), `toolIsland.css`, the `tools/ui` adapters (once no island imports them; otherwise keep them as re-exports), every per-tool `.css`, and `islands/index.ts` if it is unused.
- Remove `"lucide"` and `"@lucide/astro"` from `CLOUDFLARE_SSR_OPTIMIZE_DEPS`.
- `grep` for `--color-`, `.btn`, `.eyebrow` and `sliding-thumb` outside `src/components/concepts/` and `ConceptLayout`, which must return nothing.
- Keep the concepts untouched. They still import Lucide, so **keep the Lucide packages installed if the concepts are still present**, and remove them only when the concepts are deleted. Flag this to the lead.

**Z2 · QA pass.**
- Check every route in both themes, at 375px and desktop, keyboard-only, and with reduced motion.
- Check `/ui` against the three designs.
- Run `npx astro build` and `npm test`.
- Write a short release note for the redesign under `docs/release-notes/` per the repo's release process; the lead decides the version.

### Route and area coverage checklist

| Route / area | Package |
| --- | --- |
| BaseLayout chrome (all pages) | L1 |
| `/` | H1 |
| `/projects`, `/keys`, `/colors`, `/404` | P1 |
| `/connect`, `/orthodox`, `/game-of-life` | P2 |
| `/tools`, `/tools/[slug]` shell | S1 |
| 86 tool islands | T1–T9 |
| `/chat` | C1–C3 |
| `/orthodox/screensaver` | O1, O2 |
| `/game-of-life/simulation` | G1 |
| `/ui` | F0–F3 |
| `/home1`–`/home6`, `/api/**` | untouched |

---

## 9. Open questions for the team leads

1. **`/colors`:** keep the hand-maintained palette (currently out of sync with `global.css`), or generate it from the design's `--ui-*` tokens? Recommendation: generate from tokens, since the page then documents the live design.
2. **Ambient field and grain:** the quiet rulebook argues for removing or heavily dimming LifeField and the noise overlay. The mount stays either way; each team decides the opacity, and `0` is allowed.
3. **Home motion:** HomeExperience uses parallax, magnetic buttons and photo tilt, which the quiet rulebook bans. Disabling them via props or CSS is in scope; deleting the motion components is not (that is a later cleanup). (Done on `full-site-redesign`: HomeExperience, PhotoLightbox and the unused motion components are deleted.)
4. **Icon weight per design:** the convention fixes `regular` as the default. If Letter wants `light` to sit with Newsreader, that requires all three to agree (a per-design default weight would break API parity) and a one-line change to the `Icon` default.
5. **Tabs, Toast and Breadcrumbs** are in the contract but unused today. They ship in the library and `/ui`; adopting them on pages is optional and must not change behaviour.
6. **Lucide removal (Z1)** depends on whether the concept pages are deleted first.
