# Password strength analyser

## Name
Password strength analyser (`password-strength-analyser`)

## Description
Estimate password strength from charset size and entropy, and show a brute-force crack-time estimate at 1e9 guesses/second. Runs entirely in the browser — no network, no npm crypto deps.

## Toggles and Settings
None — analysis updates as you type.

## Inputs
- Password string (masked input in the island)
- Programmatic `getPasswordCrackTimeEstimation({ password, guessesPerSecond? })`

## Outputs
- **Crack duration** — human-friendly brute-force time (hero)
- **Password length**
- **Entropy** — bits, rounded to 2 decimal places in the UI
- **Character set size** — lower 26 + upper 26 + digits 10 + special 32 (`/\W|_/`); full set is 94
- **Score** — `min(entropy / 128, 1)` shown as `N / 100`

## Notes
- Empty password → entropy 0, charset 0, duration “Instantly”
- Strength is brute-force only; dictionary attacks are not modelled
- Lodash from the it-tools source is replaced with plain JS duration formatting

## Source
Port of [it-tools Password strength analyser](https://it-tools.tech/password-strength-analyser). Local reference: handy-dandy `it-tools` (`/password-strength-analyser`). Catalogue id: `password-strength-analyser`.

## Files
- `src/lib/tools/password-strength-analyser/` — service, tests, README
- `src/components/tools/islands/PasswordStrengthAnalyser.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `password-strength-analyser`

## How to verify
```bash
npm test -- src/lib/tools/password-strength-analyser
npm run build
```
Open `/tools/password-strength-analyser`, type a password, check crack duration and details.
