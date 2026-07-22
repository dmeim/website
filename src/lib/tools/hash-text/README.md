# Hash text

## Name
Hash text (`hash-text`)

## Description
Hash a text string with MD5, SHA1, SHA256, SHA224, SHA512, SHA384, SHA3, or RIPEMD160. Choose how digests are encoded (binary, hex, Base64, or Base64url). All hashing runs in the browser.

## Toggles and Settings
- **Digest encoding** — Binary (base 2), Hexadecimal (base 16), Base64, or Base64url (default Hex)

## Inputs
- Cleartext string to hash (multiline)

## Outputs
- One digest per algorithm (MD5, SHA1, SHA256, SHA224, SHA512, SHA384, SHA3, RIPEMD160), live as you type
- Copy each digest to the clipboard

## Notes
- Empty input still produces valid empty-string digests (same as it-tools)
- SHA3 here matches crypto-js / it-tools (Keccak-style SHA3), not a separate Web Crypto API
- MD5, SHA224, SHA3, and RIPEMD160 are not available via Web Crypto; `crypto-js` is used for full algorithm parity
- Encoding `Bin` is derived from the hex digest via `convertHexToBin`

## Source
Port of [it-tools Hash text](https://it-tools.tech/hash-text). Local reference: handy-dandy `it-tools` (`/hash-text`). Catalogue id: `hash-text`.

## Files
- `src/lib/tools/hash-text/` — service, tests, README
- `src/components/tools/islands/HashText.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `hash-text`

## How to verify
```bash
npm test -- src/lib/tools/hash-text
npm run build
```
Open `/tools/hash-text`, enter text, switch encodings, copy digests.
