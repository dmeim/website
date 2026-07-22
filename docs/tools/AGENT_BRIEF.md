# Tools port — agent brief

Short contract for future it-tools → dmeim.com ports. Phase 0 established the shared kit and Vitest harness; follow this for each new tool.

## Checklist
1. Find the source tool under the it-tools checkout (path below) and note its inputs/outputs/toggles.
2. Add `src/lib/tools/<id>/` with pure service module(s) + `*.service.test.ts` + `README.md` (template below).
3. Build the React island under `src/components/tools/islands/` using **only** the shared kit in `src/components/tools/ui/` and `toolIsland.css` tokens. Tool-specific CSS is for unique chrome only (preview frames, galleries, etc.).
4. Prefer native Web Crypto / platform APIs. Add an npm dependency only when native cannot cover the behavior.
5. Hand off shared wiring to the parent: catalogue entry in `src/content/tools.ts`, mount in `src/pages/tools/[slug].astro`, and any `package.json` dependency — **do not edit those unless the parent asked you to**.
6. Run `npm test` for the new service tests; run `npm run build` when practical.
7. Do **not** deploy (`wrangler deploy` / Cloudflare publish) unless explicitly requested.
8. Attribution: **do not** add per-tool credits. The only credit is the catalogue lede line on `/tools`.

## README template
Each `src/lib/tools/<id>/README.md` must include:

- **Name**
- **Description**
- **Toggles and Settings**
- **Inputs**
- **Outputs**
- **Notes**
- **Source** (it-tools path / URL; note custom if not a port)
- **Files**
- **How to verify**

## Don’t touch shared wiring
Leave these to the parent agent unless instructed otherwise:

- `src/content/tools.ts` (ids/groups/status/routes)
- `src/pages/tools/[slug].astro` (island mounts)
- Root `package.json` dependency adds (parent may ask you to propose them)

Light title tweaks (1–3 words) are OK when the parent updates the catalogue.

## it-tools path
Read-only behavior source:

`/Users/dimitri/Library/Mobile Documents/com~apple~CloudDocs/~/Code/handy-dandy/it-tools`

Match groups/ids already listed in `src/content/tools.ts`.

## Native-first deps
- Prefer Web Crypto, `TextEncoder`, `URL`, Canvas, MediaStream, etc.
- Introduce npm libs only when required for correctness (e.g. QR encoding already uses `qrcode`).
- Keep UI on Midnight Concert Hall CSS variables + Framer Motion presets from the tools UI kit — no Tailwind, no component libraries.

## Test requirement
Every tool ships with Vitest service tests matching:

`src/lib/tools/**/*.service.test.ts`

Run with `npm test`. Cover pure helpers and edge cases (validation, clamping, encoding). UI islands stay thin.
