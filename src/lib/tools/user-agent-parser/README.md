# User-agent parser

## Name
User-agent parser (`user-agent-parser`)

## Description
Detect and parse Browser, Engine, OS, CPU, and Device type/model from a user-agent string. Uses `ua-parser-js` for parity with it-tools.

## Toggles and Settings
None. Live parse as you type. On first load the input is primed with the current browser’s `navigator.userAgent`.

## Inputs
- User-agent string (multiline textarea)

## Outputs
- **Browser** — name, version
- **Engine** — name, version
- **OS** — name, version
- **Device** — model, type, vendor
- **CPU** — architecture
- Missing fields show a short fallback message (same wording as it-tools)

## Notes
- Empty / whitespace-only input yields empty sections (does **not** fall back to the current browser UA while parsing)
- Client mount seeds the textarea from `navigator.userAgent` after hydration to avoid SSR mismatch
- Depends on `ua-parser-js` (^1.0.35)

## Source
Port of [it-tools User-agent parser](https://it-tools.tech/user-agent-parser). Local reference: handy-dandy `it-tools` (`/user-agent-parser`). Catalogue id: `user-agent-parser`.

## Files
- `src/lib/tools/user-agent-parser/` — service, tests, README
- `src/components/tools/islands/UserAgentParser.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `user-agent-parser`

## How to verify
```bash
npm test -- src/lib/tools/user-agent-parser
npm run build
```
Open `/tools/user-agent-parser`, confirm sections update live, clear the field and see fallbacks, paste a mobile UA and check Device fields.
