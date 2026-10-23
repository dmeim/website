# Unreleased — Profile redesign

The whole site moves onto a new UI library (`src/ui`) in the Profile design. The version number is left to the maintainer.

## Added
- `src/ui` component library: 70 components, Astro and React, sharing one token contract. The `/ui` showcase renders each one in both themes.
- Homepage rebuilt as the Profile concept. Its sections are Now, Work, Tools, Principles, Keys and Contact.
- Sticky identity rail on content pages. A gold marker glides to the current page and follows the in-page sections as you scroll.
- `/colors` is generated from the live design tokens.
- Copy buttons on key fingerprints and key bodies, and on tool outputs.
- Tools: loading skeleton, error boundary and focus moved to the title after client navigation.

## Changed
- Inter replaces the previous font stack. Code and output use the system monospace.
- Phosphor icons replace Lucide everywhere except the archived concept pages.
- The tools workspace, all 86 tools, the chat app, the orthodox screensaver and Game of Life are restyled. Their behaviour is unchanged.
- The ambient Life field and grain are off by default.

## Fixed
- ASCII text drawer: fonts failed to load because of a double slash in the font path.
- WordCode generator: the scroll guard works again.

## Removed
- `global.css`, the legacy alias layer, sliding-thumb styles and scripts, the old theme toggle script, the `tools/ui` kit and per-tool styles that are no longer needed.
