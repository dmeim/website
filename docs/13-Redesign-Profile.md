# Redesign: Profile (concept 5, site-wide)

The site's current design, merged to `main` from `full-site-redesign`. It is the full-site implementation of concept 5 ("Profile") on the contract in `docs/12-UI-Library-Spec.md`, and every page, tool and app runs on the `src/ui` library. The Letter and Plain alternatives were dropped; their branches are history only.

## Run it

```sh
npm install
npm run dev -- --port 4342
```

- Library showcase: `http://localhost:4342/ui` (noindex). Every component appears in both themes, Astro and React side by side.
- Live token sheet: `http://localhost:4342/colors`.
- Checks: `npx astro build && npm test`.

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
  - the tool groups under Tools in the rail (current tool, or its collapsed group);
  - Tabs.
- **Other motion.** Hover colour and fill shifts take 160ms. The reveal fade-up is 6px over 360ms and is gated on `html.js`. Copy changes to "Copied". Under `prefers-reduced-motion` every `--ui-dur-*` collapses to 0.01ms. There is no parallax, tilt, magnetic effect or marquee.

## Site shell

`SiteHeader` has two modes, set by the page's `immersive` prop; `BaseLayout` gained no new props apart from `noindex`, which `/ui` needs.

| Mode | Routes | Desktop (≥960px) | Phone |
| --- | --- | --- | --- |
| **rail** | `/`, `/projects*`, `/gallery*`, `/tools*`, `/keys`, `/colors`, `/orthodox`, `/game-of-life`, `/404`, `/ui` | Sticky 320px identity rail, described below. Content sits in the column beside it. | Sticky top bar (portrait, name, menu) with a `#mobile-nav` Drawer. |
| **immersive** | `/game-of-life/simulation`, `/orthodox/screensaver` | No chrome; `ImmersiveStage` with a floating `Toolbar`. | Same. |

The rail holds the segmented ThemeControl above the vertical SiteNav, where the current page expands into its spy Sections (and Tools into its groups). The identity sits at the top of main on every rail page (`SiteIdentity`): the portrait and the name "Dimitrios Meimaridis", both linking home (not the h1), the handle and tagline, then the contact and crypto icon rows (`IdentityLinks`). Those rows are the site's ways to reach Dimitri, so there is no Connect page; the addresses live in `contact` in `src/content/site.ts`.

The footer (`SiteFooter`) is "© <year> Dimitrios Meimaridis" on the left and the same icon rows on the right, inset `--ui-footer-inset` (24px) from the ends of its hairline. When its content box is under 30rem (a container query, so it tracks the real space rather than the viewport) the two stack on centered lines.

Scroll-spy makes the last section active once the page is scrolled to the bottom, since a short final section can never reach the spy line.

The page grid lives in `src/ui/styles/layout/site-shell.css`. Beside the rail, `Container` drops its own gutter and only caps the measure:

| Container width | Measure |
| --- | --- |
| narrow | 40rem |
| default | 46rem |
| wide | 64rem |

## Gallery

`src/assets/gallery/` is the home of every image the site uses, and other pages read from it: the Orthodox wall hangs the Icons album, project pages show `projects/<slug>/`, and the site portrait and the `/ui` figure come from Studio and Cutouts. `/gallery` lists albums as fanned stacks (cover on top, two items peeking behind; they fan wider on hover) in two spy Sections, Albums and Projects. Each album is a static page at `/gallery/<folder>` (projects at `/gallery/projects/<slug>`, with a link to the project page), not a modal.

- **Add files.** Every folder in `src/assets/gallery/` is an album, and a sub-folder is a section of it: the album page shows a heading and grid per section (Icons has one per month). Deeper nesting, or a file loose in the root, fails the build. `projects/` is the exception: each sub-folder there is a project's own album. Supported files:
  - images: jpg, jpeg, png, webp, avif, and gif (animated);
  - video: mp4, webm, mov, m4v. `.mov` only plays in Safari, so prefer mp4 (H.264) or webm;
  - audio: mp3, m4a, aac, ogg, oga, opus, wav, flac.
- **Posters and cover art.** An image with the same name as a video or audio file (`clip.mp4` + `clip.jpg`) becomes its poster or cover art and is not listed on its own. Without one, the thumbnail shows a film or music glyph. Two images or two media files with the same name in one folder fail the build.
- **Words and order.** `src/content/gallery.ts` gives albums a title, description, cover, section order (`sections`), section headings (`sectionLabels`) and `download: false` to hide the download button, and items a title, description and alt text, keyed by file name without the extension (`<section>/<stem>` inside a sub-folder; that is also the item's `#` link). Icons takes its month order from `collectionOrder` in `src/content/orthodox.ts`. Items listed there come first in that order; the rest follow by file name. Missing entries fall back to a title from the file name. Metadata that names a folder, item or cover that does not exist fails the build.
- **Album page.** A fixed-height preview box (portrait and landscape swap without the page jumping) holding an image, a video player or an audio player with cover art, then the item's title and description, a counter, previous/next and a download button, then a square thumbnail grid. Thumbnails of video, audio and GIFs carry a small kind badge. Clicking a thumbnail swaps the preview in place (the page does not scroll), pauses anything playing and sets `#<file-stem>` so the item can be linked. ← and → step through the album, except while a player or form control has focus.
- **Full quality.** The preview box shows the original file, and every album offers it for download unless it sets `download: false`. Only the 480w grid and stack thumbnails are resized (WebP). `src/lib/gallery/assets.ts` holds the one pair of globs (`src/assets/gallery/**`): originals are emitted byte-for-byte through `?url` imports. `loadFolder("projects")` hands the projects loader its files. Grouping, pairing and ordering live in `src/lib/gallery/catalog.ts` with tests beside it (including a check that the literal glob lists match the supported extensions).
- **Cloudflare limits.** Workers Static Assets serves files up to 25 MiB each, and 20,000 files per deploy on Workers Free (100,000 on Paid). There is no total-size limit. Each still produces two files (the original and a thumbnail); video and audio produce one. The Orthodox wall adds its own 1200w and 240w WebPs per icon. The build is currently about 1,200 files and 490 MB, most of it the icon originals. The `cloudflare-asset-limits` integration in `astro.config.ts` fails the build naming any output file over 25 MiB and logs the file count, warning above 90% of the free cap. Media over 25 MiB needs re-encoding or hosting in R2.
- **Seed content.** Studio and Cutouts are the generated portraits from the photoshoot; the duplicate copies that used to sit in `assets/images/photoshoot/` and `public/gpt-photoshoot/` are gone. The `reference-*` source photos stay in `assets/images/photoshoot/`, unpublished. Icons is the Orthodox icon set, moved from `src/assets/orthodox/icons/` with its month folders and file names unchanged, so icon ids (`<Month>/<stem>`) and custom-wall locks still match.

## Projects

`/projects` uses the gallery's fanned stacks in a landscape shape (cards anchored to the top of each screenshot), with the status dot in the caption and the summary underneath. Each project is a static page at `/projects/<slug>`. The homepage Work list links to the same pages.

- **Write-up.** One Markdown file per project in `src/content/projects/<slug>.md`, validated by the `projects` collection in `src/content.config.ts`. Frontmatter: `title`, `summary`, `status` (`live` / `wip` / `archived`), optional `order`, `year`, `role`, `tags`, `links` (each `{ label, href, kind: site | source | other }`; the first is the primary button), `cover` and `media` (words for media files, keyed by file stem, same shape as gallery items). The body is the write-up.
- **Media.** Photos, GIFs and video go in `src/assets/gallery/projects/<slug>/` and follow every gallery rule. Each project with media is also an album on `/gallery`. Rules: same file types, posters by matching name, untouched downloads, the 25 MiB limit. A folder with no matching `.md`, or `media`/`cover` in a project with no folder, fails the build.
- **Page.** Breadcrumbs, the title and summary, status, year and role, link buttons (opening in a new tab), then the gallery viewer with landscape thumbnails when there is media, then the write-up beside an "at a glance" list (status, when, role, built with; it sits below the write-up under 1100px), then previous/next links.
- **Code.** Loading and sorting live in `src/lib/projects/projects.ts`; media pairing and ordering live in `src/lib/projects/catalog.ts` with tests beside it. `FanStack.astro` and `AlbumViewer.astro` in `src/components/gallery/` are shared with the gallery.
- **Seed content.** dmeim.com and Georgios Zerdalis have screenshots taken from production builds (light theme, reduced motion, 2x). Verification lab and Edge experiments have no media yet and show a code glyph. The old `projects` array in `src/content/site.ts` is gone; Markdown is the only source.

## Tools

`/tools` and `/tools/[slug]` use the rail shell. `ToolsShell` (React, `client:only`) renders only the stage; the navigation lives in the rail.

- **Rail tree** (`src/ui/components/SiteNavTools.astro`, rendered by the vertical `SiteNav` under the current Tools item). The 11 groups are sub-items with tool counts, and one group is open at a time with its tools beneath it, the same way Home shows its sections. On a tool page its group is open on load. The gold marker sits on the current tool, or on its group while that group is collapsed (the marker now follows the deepest visible `aria-current`). WIP tools are listed but cannot be clicked. The phone menu gets the same tree.
- **Switching** (`src/ui/lib/tools-nav.ts`). While `ToolsShell` is mounted, a plain click on a tool link sends `tools:select`; the shell swaps the tool in place with `history.pushState(null, …)` and answers with `tools:route`, which every copy of the tree follows, and the phone menu closes. Back and forward work the same way. Modified clicks open the static page as normal.
- **Landing** (`ToolCatalog`): a page header with counts and one search across every tool. Results appear as you type and show their group. Nothing else is listed, because the rail already holds the groups.

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

- `/` is the Profile homepage, rebuilt on the library from `src/components/home/*`. It has four spy Sections: About (the h1 summary and a button for each page in the site nav, in the same order, built from `defaultNavItems`), Experience, Skills and Education. The buttons are the homepage's only pointers into the rest of the site; there are no Projects, Tools, Stack or Principles sections. Experience, Skills (one labelled list: Platforms, Systems, Tools, Coding, Hardware, Strengths, Languages) and Education come from Dimitri's 2026 resume, kept as data in `src/content/resume.ts` without the address, phone or email; Experience and Education entries put the dates in the list rows' 7rem label column. The full keys live only on `/keys`. The old `HomeExperience` homepage, `PhotoLightbox` and the unused motion helpers (TextReveal, Reveal, Magnetic, PhotoTilt, Grain) are deleted; `src/components/motion/` keeps only `MotionConfigProvider`. Content fields only they read (hero CTAs and sentence, image fields, pedagogy bodies) and every placeholder SVG in `public/images/` are gone too.
- `/colors` is generated from `uiColorTokenNames`. It shows a light and a dark swatch per token, with the resolved values read at runtime.
- There is no ambient field or grain. `SiteEffects`, `LifeField` and `GlyphField` were removed: with the field off they still loaded React on every content page (about 63 KB gzip) to render nothing. Content pages now ship no React unless a page has its own island.
- Dark-mode portrait contrast, a known rough edge of the concept, is fixed: in dark the portrait tile uses a lighter mix of text into bg.
- Legacy CSS is gone: `global.css`, `legacy.css`, `sliding-thumb.*`, `theme-toggle.ts`, `site-nav-thumb.ts`, the `tools/ui` adapters and `toolIsland.css`. About 20 slim per-tool stylesheets remain for layout unique to one tool, and they use `--ui-*` tokens only.
- Lucide (`lucide`, `@lucide/astro`) is uninstalled and out of `CLOUDFLARE_SSR_OPTIMIZE_DEPS`; the concept pages were its last users and are deleted.
- Copy feedback across the tools is now `CopyButton`'s "Copied" swap instead of per-tool "X copied." status lines.

## Behaviour notes (review these)

Behaviour was kept frozen; the presentational side effects are listed here.

- **Small UI-only changes:**
  - **Tools:** some element ids changed where no code or test used them. Inputs no longer `autoFocus` inside `TransformPanel`. In ListConverter the options now sit between the input and the output.
  - **Panel titles:** "Docker run → Compose" became "Docker run to Compose".
  - **OTP generator:** the refresh button is now a small icon in the Secret field's label row, so it is easy to miss.
- **AsciiTextDrawer fix:** this is a real bug fix in `src/lib/tools/ascii-text-drawer/asciiTextDrawer.service.ts`, made in its own `fix:` commit. The font path ended in `/`, so figlet requested `fonts//Standard.flf` and got a 404. It had been broken since the tool was added.
- **WordCode scroll guard:** tools now scroll with the page, so the guard checks the heading against the window instead of a `tools-stage__body` container.

## Known issues / not verified

- These camera paths could not be tested in the browser pane: recording, photo capture and device switching. The permission-denied state was checked.
- Fullscreen and wake lock on `/orthodox/screensaver` are blocked in the test pane and were not exercised.
- Arrow-key movement on native radio SegmentedControls was not driven by synthetic events, so it relies on native behaviour.
- The orthodox wall background is a user-selectable preset applied inline; some presets are gradients. These are content, so they are exempt from the no-gradients rule.

## Package checklist

All of these are done: F0–F3 (library and `/ui`), L1, H1, P1, P2, S1, T1–T9 (all 86 tools off the adapters), C1–C3, O1–O2, G1, Z1 and Z2, which covered the QA sweep, the fixes and the release note.
