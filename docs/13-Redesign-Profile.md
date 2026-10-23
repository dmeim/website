# Redesign: Profile (concept 5, site-wide)

Branch `feat/redesign-profile`. This is the full-site implementation of concept 5 ("Profile", `/home5`) on the shared contract in `docs/12-UI-Library-Spec.md`. Every page, tool and app runs on the `src/ui` library. Letter and Plain implement the same contract on their own branches, so pages can move between branches without code changes.

## Run it

```sh
npm install
npm run dev -- --port 4342
```

- Library showcase: `http://localhost:4342/ui` (noindex). Every component appears in both themes, Astro and React side by side.
- Live token sheet: `http://localhost:4342/colors`.
- Checks: `npx astro build && npm test`.
- Chat needs the local D1 tables. On a fresh checkout `/chat` shows "no such table: chats" until you run `npm run chat:reset-local`.

## Design language

The site reads like a refined online CV. It is flat and quiet, and colour, spacing and hairlines carry the hierarchy.

- **Type.** Inter is the only webfont. Body text is 15px at line height 1.6 with `cv11`/`ss01`, headings are weight 600 with tight tracking, and nothing is larger than 2.25rem. Small labels and section titles are 13px, weight 500, uppercase and muted.
- **Mono slot.** `--ui-font-mono` is the system stack (`ui-monospace, SF Mono, Menlo, Consolas, …`). It is used only for code, values and tool output. Loading no mono webfont keeps the page to one downloaded face and removes the old JetBrains Mono request. Tool output still needs aligned columns, which a system mono gives for free.
- **Colour.** The ground is cream (`#f6f4ef`) in light and near-black (`#111110`) in dark. `--ui-surface` is the flat tile fill and also the row hover. Ink is near-black or cream and fills primary buttons, checked controls and slider tracks.
- **Gold.** Gold (`#8a6d3b` light / `#cfb27a` dark) is used only for links, the focus ring, the gliding current marker, the live dot and tiny markers.
- **Shape.** Buttons, inputs and tiles have an 8px radius. Dialogs and popovers have 12px, and badges and the switch track are pills. Separators are 1px hairlines.
- **No shadows or gradients.** Overlays are a `--ui-popover` fill with a `--ui-line-strong` border.
- **Rows.** Rows are the main vehicle. They are separated by hairlines and have an optional 7rem label column, a weight-500 title, a muted description and trailing meta plus an arrow. On hover a linked row fills with surface, the neighbouring hairlines vanish and the arrow turns gold and moves 2px.
- **Panels.** Panels, the tool work areas, are boxless: a hairline top rule, a title row, then content. Cards are flat surface tiles.
- **Signature interaction.** A 2px gold marker glides (320ms) along a hairline to the current item:
  - the rail nav, including in-page section sub-links driven by scroll-spy;
  - the app-bar nav, horizontally;
  - the tools sidebar (current tool) and the chat list (current chat);
  - Tabs.
- **Other motion.** Hover colour and fill shifts take 160ms. The reveal fade-up is 6px over 360ms and is gated on `html.js`. Copy changes to "Copied". Under `prefers-reduced-motion` every `--ui-dur-*` collapses to 0.01ms. There is no parallax, tilt, magnetic effect or marquee.

## Site shell

`SiteHeader` derives its mode from `currentPath`, so `BaseLayout` gained no new props apart from `noindex`, which `/ui` needs.

| Mode | Routes | Desktop (≥960px) | Phone |
| --- | --- | --- | --- |
| **rail** | `/`, `/projects`, `/keys`, `/colors`, `/connect`, `/orthodox`, `/game-of-life`, `/404`, `/ui` | Sticky 320px identity rail, described below. Content sits in the column beside it. | Sticky top bar (portrait, name, menu) with a `#mobile-nav` Drawer. |
| **app** | `/tools*`, `/chat*` | 56px top bar with brand, horizontal nav (gold underline marker) and ThemeControl. `AppShell` fills the rest. | Same bar, with the Drawer. |
| **immersive** | `/game-of-life/simulation`, `/orthodox/screensaver` | No chrome; `ImmersiveStage` with a floating `Toolbar`. | Same. |

The rail holds, from top to bottom:
- the portrait tile;
- the name "Dimitri" (a link, not the h1);
- the role line and the status dot;
- the vertical SiteNav, where the current page expands into its spy Sections;
- Email and GitHub links;
- the segmented ThemeControl.

The page grid lives in `src/ui/styles/layout/site-shell.css`. Beside the rail, `Container` drops its own gutter and only caps the measure:

| Container width | Measure |
| --- | --- |
| narrow | 40rem |
| default | 46rem |
| wide | 64rem |

## Tokens (values)

All names come from spec §3, and `src/ui/tokens.css` is the source of truth. The main values:

| Group | Values |
| --- | --- |
| Light | bg `#f6f4ef`, bg-inset `#efece6`, surface `#eeebe4`, surface-hover `#e9e5dd`, surface-active `#e3dfd6`, popover `#fbfaf7`, text `#171614`, muted `#6d6961`, subtle `#7b766e`, accent `#8a6d3b`, danger `#a3442c`, success `#3d6b48`, lines at 10% / 18% ink |
| Dark | bg `#111110`, bg-inset `#0c0c0b`, surface `#191917`, surface-hover `#1f1f1c`, surface-active `#272723`, popover `#1b1b19`, text `#edeae3`, muted `#9a968e`, subtle `#86827a`, accent `#cfb27a`, danger `#e0927a`, success `#86b994`, lines at 10% / 18% cream |
| Fields | `--ui-field` is transparent; the border is `--ui-line-field`. Read-only output uses `--ui-bg-inset`. |
| Type | 2xs 12px, xs 13px, sm 14px, md 15px, lg 17px, xl 20px, 2xl 24px, 3xl clamp to 36px |
| Space | 2px, 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 88px |
| Layout | gutter clamp(16px, 4vw, 40px); header 3.5rem; sidebar 17.5rem |
| Controls | sm 30px, md 36px, lg 44px; icons 14 / 18 / 22px |
| Radius | xs 4px, control and panel 8px, dialog 12px, pill |
| Shadow | `--ui-shadow-overlay: none` |
| Motion | 80 / 160 / 240 / 360ms; ease `cubic-bezier(0.2, 0, 0, 1)`; press scale 1; reveal distance 6px |

Profile-only extras (additive, not part of the contract): `--ui-rail-width`, `--ui-rail-gap`, `--ui-label-col` and `--ui-dur-glide`.

## Library notes

All 70 catalogue entries exist with the spec'd APIs, in `src/ui/components` (Astro) and `src/ui/react` (React). There is one stylesheet per component in `src/ui/styles/{components,layout}`.

**Barrels.** Barrels are split by group in `src/ui/{components,react}/groups/*.ts` and re-exported by the two `index.ts` files. Plain `tsc` can't resolve `.astro` modules in those barrels, which accounts for 67 TS2307 errors. Astro resolves them, and the build passes.

**Runtime helpers.** These live in `src/ui/lib/`:
- `theme.ts`: preference, `ui:theme` event, `bindThemeControls`;
- `nav-marker.ts` and `spy.ts`: the gliding marker and scroll-spy;
- `overlay.ts`: focus trap, scroll lock, Dialog and Drawer binders;
- `copy-delegate.ts`: `[data-ui-copy]` and `.ui-code-block [data-copy]`;
- `reveal.ts`, `toast.ts`, `tabs.ts`, `roving-focus.ts`, `tooltip.ts`;
- `motion.ts`: `uiEase`, `uiDur`, `fadeUp`, `stagger`.

**Composites.** ToolFrame, TransformPanel, OutputField and ReferenceList are composites. `TransformPanel` is a plain block, so consumers place it inside their own `Panel`.

**AppShell.** Chat passes `data-main-scroll="false"` on the AppShell root so that `.chat-thread` stays the scroll container. No extra prop was added.

**Deviations, kept small:**
- `SiteHeader` has an extra optional `menuId` prop (default `mobile-nav`), so the showcase can render several headers.
- Astro `ListRow` takes `badge` as an object, since Astro can't pass a node.
- The `Drawer` has no `closeLabel` prop.
- A non-dismissible `Dialog` hides its close button.
- The `Progress` countdown keeps running under reduced motion, because it is a functional timer.
- `TransformPanel` doesn't forward `autoFocus` or an output placeholder.
- `OutputField` and `ReferenceList` don't forward arbitrary `data-*` or `id` attributes to the inner control.
- A single-value `Slider` puts its `id` on the range input.

## Decisions made during the run

- `/` is the Profile homepage, rebuilt on the library from `src/components/home/*`. It has six spy Sections: Now, Work, Tools, Principles, Keys and Contact. `HomeExperience` and `PhotoLightbox` stay in the repo unused; their CSS was moved onto tokens so the build stays clean.
- `/colors` is generated from `uiColorTokenNames`. It shows a light and a dark swatch per token, with the resolved values read at runtime.
- The ambient LifeField and the grain are off (`AMBIENT_ENABLED = false` in `SiteEffects`), with the mount and the hidden-route list kept. The Life and Glyph fields read `--ui-ambient`.
- Dark-mode portrait contrast, a known rough edge of the concept, is fixed: in dark the portrait tile uses a lighter mix of text into bg.
- Legacy CSS is gone: `global.css`, `legacy.css`, `sliding-thumb.*`, `theme-toggle.ts`, `site-nav-thumb.ts`, the `tools/ui` adapters and `toolIsland.css`. About 20 slim per-tool stylesheets remain for layout unique to one tool, and they use `--ui-*` tokens only.
- Lucide stays installed, and stays in `CLOUDFLARE_SSR_OPTIMIZE_DEPS`, because the concept pages still import it. Nothing else uses it.
- Copy feedback across the tools is now `CopyButton`'s "Copied" swap instead of per-tool "X copied." status lines.

## Behaviour notes (review these)

Behaviour was kept frozen; the presentational side effects are listed here.

- **Small UI-only changes:**
  - **Tools:** some element ids changed where no code or test used them. Inputs no longer `autoFocus` inside `TransformPanel`. In ListConverter the options now sit between the input and the output.
  - **Panel titles:** "Docker run → Compose" became "Docker run to Compose".
  - **OTP generator:** the refresh button is now a small icon in the Secret field's label row, so it is easy to miss.
- **Chat Escape listener:** the composer's capture-phase Escape listener now calls only `preventDefault`, not `stopImmediatePropagation`. This lets library popovers dismiss and restore focus. `ChatShell` already ignores an Escape that was prevented.
- **Chat code blocks:** the markup string in `src/lib/chat/markdown.ts` follows the `.ui-code-block` contract (`data-chat-copy` plus `data-copy`), and its test was updated. This is a markup-only change.
- **AsciiTextDrawer fix:** this is a real bug fix in `src/lib/tools/ascii-text-drawer/asciiTextDrawer.service.ts`, made in its own `fix:` commit. The font path ended in `/`, so figlet requested `fonts//Standard.flf` and got a 404. It had been broken since the tool was added.
- **WordCode scroll guard:** `tools-stage__body` was re-added to the tools AppShell scroll container, so WordCode's existing scroll guard works again.

## Known issues / not verified

- Chat was checked only up to the UI. The local D1 had no tables, so the chat list rows, the per-chat StatusDot, the thread with real messages and streaming were not seen live. The markdown, thinking and metrics components were render-checked in a throwaway test.
- These camera paths could not be tested in the browser pane: recording, photo capture and device switching. The permission-denied state was checked.
- Fullscreen and wake lock on `/orthodox/screensaver` are blocked in the test pane and were not exercised.
- Arrow-key movement on native radio SegmentedControls was not driven by synthetic events, so it relies on native behaviour.
- The orthodox wall background is a user-selectable preset applied inline; some presets are gradients. These are content, so they are exempt from the no-gradients rule.

## Package checklist

All of these are done: F0–F3 (library and `/ui`), L1, H1, P1, P2, S1, T1–T9 (all 86 tools off the adapters), C1–C3, O1–O2, G1, Z1 and Z2, which covered the QA sweep, the fixes and the release note.
