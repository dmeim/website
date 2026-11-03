# Unreleased — Profile redesign

The whole site moves onto a new UI library (`src/ui`) in the Profile design. The version number is left to the maintainer.

## Added
- `src/ui` component library: 70 components, Astro and React, sharing one token contract. The `/ui` showcase renders each one in both themes.
- Homepage rebuilt as the Profile concept. Its sections are About (with buttons into the site), then Experience, Skills and Education from the resume.
- Sticky identity rail on content pages. A gold marker glides to the current page and follows the in-page sections as you scroll.
- `/colors` is generated from the live design tokens.
- Copy buttons on key fingerprints and key bodies, and on tool outputs.
- `/gallery`: albums shown as fanned stacks, each opening its own page with a preview box, per-item title and description, previous/next, download and a thumbnail grid. Albums can hold photos, animated GIFs, video and audio (with optional poster or cover art), and items can be linked by `#name`. Seeded with Studio and Cutouts albums from the portrait session.
- `/projects`: projects shown as fanned stacks of screenshots; each opens its own page with links, a media viewer, a write-up, an at-a-glance list and previous/next. Write-ups are Markdown files, so adding a project needs no code.
- Build check: fails with the file name when any output file is over Cloudflare's 25 MiB static-asset limit.
- Gallery: every image the site uses now lives in `src/assets/gallery/`. New Icons album (the Orthodox icons, by month) and a Projects row with each project's screenshots. Sub-folders become sections of their album, and an album can turn off downloads with `download: false`.
- Tools: loading skeleton, error boundary and focus moved to the title after client navigation.
- Tools: the tool groups now expand under Tools in the left nav, like Home's sections. One group opens at a time with its tools beneath it, and the gold marker follows the current tool. The phone menu has the same list.

## Changed
- The name and portrait at the top of each page link home.
- The footer is now the copyright beside the same contact and crypto icon rows as the top of the page.
- Scroll-spy: the last section lights up once the page is scrolled to the bottom.
- Gallery previews show the original file at full quality instead of a resized WebP.
- The Orthodox icon wall reads its icons from the gallery's Icons album (`src/assets/gallery/icons/`) and wall photos from `src/assets/gallery/backgrounds/`. Icon ids are unchanged, so saved custom walls keep their icons.
- Inter replaces the previous font stack. Code and output use the system monospace.
- Phosphor icons replace Lucide everywhere.
- `/tools` now uses the identity rail like the content pages, replacing the tools sidebar. The landing page is slimmed to an intro and one search across every tool.
- The tools workspace, all 86 tools, the orthodox screensaver, and Game of Life are restyled. Their behaviour is unchanged.
- The ambient Life field and grain are off by default.

## Fixed
- ASCII text drawer: fonts failed to load because of a double slash in the font path.
- WordCode generator: the scroll guard works again.

## Removed
- The always-on `SiteEffects` island (ambient field off), so content pages no longer load React (about 63 KB gzip less per page). Unused barrels, dead exports and stale selectors are gone, and `/ui`'s showcase styles load only on `/ui`.
- The rounded corners on the favicon and the iOS home-screen icon (same crop; the browser and iOS shape them), and the unused placeholder `favicon.svg`.
- The `/connect` page and its form (including the optional `PUBLIC_N8N_WEBHOOK_URL`), and the homepage Contact section. The icon rows at the top and bottom of each page are the ways to get in touch.
- The private `/chat` app and everything behind it: the `/api/chat*`, `/api/chats*` and `/api/library*` routes, the D1 (`DB`) and R2 (`CHAT_LIBRARY`) bindings and their migrations, the OpenCode, Exa and Context7 secrets, the AI SDK packages, `highlight.js` and `unpdf`, and the `app` header mode only chat used. Nothing on the site runs server-side now.
- The `/home1`–`/home6` redesign concept pages, their components and `ConceptLayout`.
- Lucide (`lucide`, `@lucide/astro`), the old `projects` and `endorsement` content, and an orphaned project placeholder image.
- Duplicate portrait files in `assets/images/photoshoot/` and `public/gpt-photoshoot/`; the site uses the gallery copies.
- The unused previous homepage (`HomeExperience`), `PhotoLightbox`, the TextReveal, Reveal, Magnetic, PhotoTilt and Grain motion helpers, content fields only they read, and all placeholder SVGs in `public/images/`.
- `global.css`, the legacy alias layer, sliding-thumb styles and scripts, the old theme toggle script, the `tools/ui` kit and per-tool styles that are no longer needed.
