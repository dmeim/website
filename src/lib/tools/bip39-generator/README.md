# BIP39 passphrase generator

## Name
BIP39 passphrase generator (`bip39-generator`)

## Description
Generate BIP39 mnemonic passphrases from random or pasted entropy, or recover entropy from an existing mnemonic. Supports ten BIP39 wordlists via `@scure/bip39`. All crypto runs in the browser.

## Toggles and Settings
- **Language** — English (default), Chinese simplified/traditional, Czech, French, Italian, Japanese, Korean, Portuguese, Spanish
- **Strength** — 128 / 160 / 192 / 224 / 256 bits (12 / 15 / 18 / 21 / 24 words). Default 128. Refresh uses the selected strength.

## Inputs
- **Entropy (seed)** — hex string; valid lengths are 32 / 40 / 48 / 56 / 64 characters (16–32 bytes)
- **Passphrase (mnemonic)** — 12–24 BIP39 words for the selected language (Japanese uses U+3000 separators)

## Outputs
- Live bidirectional conversion between entropy and mnemonic when input is valid
- Refresh entropy (new CSPRNG bytes at the selected strength)
- Copy entropy / Copy mnemonic

## Notes
- Uses audited `@scure/bip39` (not `@it-tools/bip39`) with tree-shaken `@scure/bip39/wordlists/*` imports
- Accepts full BIP39 entropy lengths — unlike it-tools’ 16–32 hex-char cap, 15/18/21/24-word mnemonics work
- Japanese spacing/NFKD normalization is handled by scure’s Japanese wordlist path
- Empty fields are allowed in the UI; conversion and copy require valid input

## Source
Port of [it-tools BIP39 passphrase generator](https://it-tools.tech/bip39-generator). Local reference: handy-dandy `it-tools` (`/bip39-generator`). Catalogue id: `bip39-generator`. Strength select is a deliberate improvement over the source UI.

## Files
- `src/lib/tools/bip39-generator/` — service, tests, README
- `src/components/tools/islands/Bip39Generator.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `bip39-generator`

## How to verify
```bash
npm test -- src/lib/tools/bip39-generator
npm run build
```
Open `/tools/bip39-generator`, refresh entropy at each strength, switch languages (including Japanese), edit entropy ↔ mnemonic both ways, copy both fields.
