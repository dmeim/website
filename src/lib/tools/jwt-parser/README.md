# JWT parser

## Name
JWT parser (`jwt-parser`)

## Description
Parse and decode a JSON Web Token (JWT) and display its header claims, payload claims, and raw signature segment. Runs entirely in the browser via native base64url decoding and `JSON.parse` (no dependencies). Does not verify signatures.

## Toggles and Settings
None. Live decode as you type.

## Inputs
- JWT string (multiline textarea)

## Outputs
- Header claims table — claim name, IANA description, value, and friendly value (e.g. algorithm description)
- Payload claims table — same layout; `exp` / `nbf` / `iat` show a locale date/time
- Signature — raw base64url third segment (empty when absent)
- Validation error when the input is not a valid JWT

## Notes
- Default sample matches it-tools HS256 demo token
- Claim and algorithm descriptions match it-tools (RFC 7518 + IANA JWT claims)
- Nested objects/arrays are pretty-printed with indent 3
- Signature is shown but never verified

## Source
Port of [it-tools JWT parser](https://it-tools.tech/jwt-parser). Local reference: handy-dandy `it-tools` (`src/tools/jwt-parser/`). Catalogue id: `jwt-parser`.

## Files
- `src/lib/tools/jwt-parser/` — service, constants, tests, README
- `src/components/tools/islands/JwtParser.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `jwt-parser`

## How to verify
```bash
npm test -- src/lib/tools/jwt-parser
npm run build
```
Open `/tools/jwt-parser`, confirm header/payload claims and signature update live for the demo token, then try an invalid string.
