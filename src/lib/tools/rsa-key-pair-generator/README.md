# RSA key pair generator

## Name
RSA key pair generator (`rsa-key-pair-generator`)

## Description
Generate a new random RSA public/private key pair and display both as PEM. All crypto runs in the browser via the Web Crypto API (no node-forge).

## Toggles and Settings
- **Bits** — modulus length; integer in `[256, 16384]`, multiple of 8. Default `2048`.
- **Refresh key-pair** — regenerates immediately for the current valid bits value.

## Inputs
- Bits (number). Invalid values show a validation message and block generation.

## Outputs
- **Public key** — SPKI PEM (`BEGIN PUBLIC KEY`), copyable
- **Private key** — PKCS#8 PEM (`BEGIN PRIVATE KEY`), copyable

## Notes
- Uses `crypto.subtle.generateKey` with **RSA-OAEP**, `publicExponent` 65537, hash **SHA-256**, then `exportKey` as **spki** + **pkcs8**.
- Private PEM is PKCS#8 (`BEGIN PRIVATE KEY`). it-tools used node-forge PKCS#1 (`BEGIN RSA PRIVATE KEY`). Both are widely supported; OpenSSH/`ssh-keygen` and most modern tooling accept PKCS#8.
- Keys ≥4096 bits (especially ≥8192) can take a long time in the browser. Auto-regen runs when bits change only for sizes ≤4096; larger sizes need an explicit Refresh.
- Bits changes are debounced (~300ms). Stale in-flight generations are cancelled when bits change or Refresh fires again.
- Very small moduli (e.g. 256) may be rejected by some SubtleCrypto implementations even though the UI validates the it-tools range.

## Source
Port of [it-tools RSA key pair generator](https://it-tools.tech/rsa-key-pair-generator). Local reference: handy-dandy `it-tools` (`/rsa-key-pair-generator`). Catalogue id: `rsa-key-pair-generator`. Crypto backend deliberately differs (Web Crypto vs node-forge).

## Files
- `src/lib/tools/rsa-key-pair-generator/` — service, tests, README
- `src/components/tools/islands/RsaKeyPairGenerator.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `rsa-key-pair-generator`

## How to verify
```bash
npm test -- src/lib/tools/rsa-key-pair-generator
npm run build
```
Open `/tools/rsa-key-pair-generator`, confirm a 2048-bit pair on load, change bits (≤4096 auto-refreshes), try Refresh, copy both PEMs. Optionally try 8192 with Refresh and expect a longer wait.
