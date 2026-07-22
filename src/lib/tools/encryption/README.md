# Encrypt / decrypt text

## Name
Encrypt / decrypt text (`encryption`)

## Description
Encrypt clear text and decrypt ciphertext with a secret key using AES, TripleDES, Rabbit, or RC4 (via crypto-js). Ciphertext uses the OpenSSL-compatible Salted__ Base64 format. All crypto runs in the browser.

## Toggles and Settings
- **Encryption algorithm** — AES, TripleDES, Rabbit, or RC4 (default AES), independently per Encrypt / Decrypt panel

## Inputs
- **Encrypt:** plaintext (multiline), secret key, algorithm
- **Decrypt:** ciphertext (multiline), secret key, algorithm

## Outputs
- **Encrypt:** live OpenSSL Salted__ Base64 ciphertext; Copy ciphertext
- **Decrypt:** live plaintext on success, or a stable “Unable to decrypt your text” error; Copy plaintext when successful

## Notes
- Defaults match it-tools: sample lorem plaintext, secret `my secret key`, AES; decrypt panel is seeded with a ciphertext that round-trips that sample
- Each encrypt uses a random salt, so the same plaintext+secret yields different ciphertext strings
- `tryDecrypt` maps throws (e.g. Malformed UTF-8) and empty failure modes to `DECRYPT_ERROR_MESSAGE`; it does not surface crypto-js messages in the UI
- Encrypting an empty string produces non-empty ciphertext that decrypts to `""`; `tryDecrypt` treats that edge case as failure when ciphertext is non-empty

## Source
Port of [it-tools Encrypt / decrypt text](https://it-tools.tech/encryption). Local reference: handy-dandy `it-tools` (`/encryption`). Catalogue id: `encryption`.

## Files
- `src/lib/tools/encryption/` — service, tests, README
- `src/components/tools/islands/Encryption.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `encryption`

## How to verify
```bash
npm test -- src/lib/tools/encryption
npm run build
```
Open `/tools/encryption`, encrypt with each algorithm, decrypt the result, try a wrong key, copy outputs.
