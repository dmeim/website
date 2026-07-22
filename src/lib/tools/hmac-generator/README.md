# HMAC generator

## Name
HMAC generator (`hmac-generator`)

## Description
Compute a hash-based message authentication code (HMAC) from a plaintext message and a secret key. Choose the hashing function (MD5, SHA1, SHA256, SHA224, SHA512, SHA384, SHA3, or RIPEMD160) and how the digest is encoded (binary, hex, Base64, or Base64url). All HMAC work runs in the browser.

## Toggles and Settings
- **Hashing function** — MD5, SHA1, SHA256, SHA224, SHA512, SHA384, SHA3, or RIPEMD160 (default SHA256)
- **Output encoding** — Binary (base 2), Hexadecimal (base 16), Base64, or Base64url (default Hex)

## Inputs
- Plain text message (multiline)
- Secret key

## Outputs
- Live HMAC digest for the current message, secret, algorithm, and encoding
- Copy HMAC to the clipboard

## Notes
- Empty message and/or empty secret still produce valid HMACs (same as it-tools)
- SHA3 here matches crypto-js / it-tools (Keccak-style SHA3), not a separate Web Crypto API
- Reuses algorithm and encoding constants from `@/lib/tools/hash-text`; does **not** reuse `hashText` / `hashAll` (plain digests)
- Encoding `Bin` is derived from the hex digest via `convertHexToBin`

## Source
Port of [it-tools Hmac generator](https://it-tools.tech/hmac-generator). Local reference: handy-dandy `it-tools` (`/hmac-generator`). Catalogue id: `hmac-generator`.

## Files
- `src/lib/tools/hmac-generator/` — service, tests, README
- `src/components/tools/islands/HmacGenerator.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `hmac-generator`

## How to verify
```bash
npm test -- src/lib/tools/hmac-generator
npm run build
```
Open `/tools/hmac-generator`, enter text and a secret, switch algorithms/encodings, copy the HMAC.
