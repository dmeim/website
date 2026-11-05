# Token generator

## Name
Token generator (`token-generator`)

## Description
Generate a random string from the character classes you enable: uppercase letters, lowercase letters, numbers, and/or symbols. Useful for API tokens, passwords, and local secrets. Generation runs entirely in the browser.

## Toggles and Settings
- **Uppercase** — include `A–Z` (default on)
- **Lowercase** — include `a–z` (default on)
- **Numbers** — include `0–9` (default on)
- **Symbols** — include `.,;:!?/-"'#{([|\@)]=}*+` (default off)
- **Length** — slider / value from 1 to 512 (default 64)

## Inputs
- Character-class toggles and length control in the island UI
- Optional programmatic `alphabet` override on `createToken` (bypasses toggles)

## Outputs
- Generated token string (live, regenerates on setting changes and Refresh)
- Copy to clipboard

## Notes
- When every character class is off (and no custom alphabet is set), the output is an empty string
- Length is clamped to 1–512 in the service
- Every character is drawn independently and uniformly with `crypto.getRandomValues`. There is no `Math.random` fallback: without Web Crypto the tool fails instead of producing a weak token. it-tools shuffled a repeated alphabet pool, which is slightly less uniform
- Options persist in the URL (`length`, `uppercase`, `lowercase`, `numbers`, `symbols`), same as it-tools. The token itself is never persisted
- Duplicate symbols from the upstream list (`.` and `-`) are removed so no character is favored
- Letter alphabets include `N`/`n` (upstream it-tools omitted them)

## Source
Port of [it-tools Token generator](https://it-tools.tech/token-generator). Local reference: handy-dandy `it-tools` (`/token-generator`). Catalogue id: `token-generator`.

## Files
- `src/lib/tools/token-generator/` — service, tests, README
- `src/components/tools/islands/TokenGenerator.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `token-generator`

## How to verify
```bash
npm test -- src/lib/tools/token-generator
npm run build
```
Open `/tools/token-generator`, toggle character classes, adjust length, Copy / Refresh.
