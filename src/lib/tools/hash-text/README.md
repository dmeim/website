# Hash text

## Name
Hash text (`hash-text`)

## Description
Hash a text string with MD5, SHA1, SHA256, SHA224, SHA512, SHA384, SHA3, RIPEMD160, or Keccak512. Choose how digests are encoded (binary, hex, Base64, or Base64url). All hashing runs in the browser.

## Toggles and Settings
- **Digest encoding** — Binary (base 2), Hexadecimal (base 16), Base64, or Base64url (default Hex)

## Inputs
- Cleartext string to hash (multiline)

## Outputs
- One digest per algorithm (MD5, SHA1, SHA256, SHA224, SHA512, SHA384, SHA3, RIPEMD160, Keccak512), live as you type
- Copy each digest to the clipboard

## Notes
- Empty input still produces valid empty-string digests (same as it-tools)
- **SHA3 is FIPS 202 SHA3-512**, matching `openssl dgst -sha3-512` and `node:crypto`. it-tools labels crypto-js's pre-standard Keccak-512 as SHA3, which disagrees with every standard tool; that digest stays available as **Keccak512**
- crypto-js hardcodes Keccak padding, so `hashText.service.ts` extends its hasher and corrects the domain byte. HMAC reuses it through `hmacSha3Digest`
- The digest encoding persists in the URL (`encoding`), same as it-tools. The text is never persisted
- MD5, SHA224, SHA3, Keccak512, and RIPEMD160 are not available via Web Crypto; `crypto-js` is used for full algorithm parity
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
