# Bcrypt

## Name
Bcrypt (`bcrypt`)

## Description
Hash a text string with bcrypt and compare a cleartext string against an existing bcrypt hash. Hashing and comparison run in the browser via `bcryptjs` (Web Crypto cannot implement bcrypt).

## Toggles and Settings
- **Salt rounds** — cost factor from 0 to 100 (default 10). Higher values are exponentially slower; prefer modest rounds for interactive typing. Very high counts (especially near 100) can take a long time even with async hashing.

## Inputs
- **Hash panel** — cleartext string to hash; salt round count
- **Compare panel** — cleartext string and a bcrypt hash to check

## Outputs
- Live bcrypt hash of the input (async, debounced while typing)
- Copy hash to the clipboard
- Compare result: Yes / No (invalid or empty hashes are treated as no match)

## Notes
- bcrypt truncates passwords longer than **72 bytes** before hashing; inputs beyond that length are not fully represented in the digest
- Empty cleartext still produces a valid empty-string hash (same as it-tools)
- Empty or malformed compare hashes never throw; the UI shows No
- Uses `bcryptjs` async `hash` / `compare` (not native Node `bcrypt`) so the tool stays browser-safe
- Salt rounds are clamped to 0–100 to match it-tools

## Source
Port of [it-tools Bcrypt](https://it-tools.tech/bcrypt). Local reference: handy-dandy `it-tools` (`/bcrypt`). Catalogue id: `bcrypt`.

## Files
- `src/lib/tools/bcrypt/` — service, tests, README
- `src/components/tools/islands/Bcrypt.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `bcrypt`

## How to verify
```bash
npm test -- src/lib/tools/bcrypt
npm run build
```
Open `/tools/bcrypt`, hash a string, copy the digest, then paste it into Compare.
