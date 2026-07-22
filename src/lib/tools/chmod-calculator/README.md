# Chmod calculator

## Name
Chmod calculator (`chmod-calculator`)

## Description
Compute Unix file-mode octal and symbolic representations from owner / group / public read-write-execute checkboxes, and show a ready-to-copy `chmod` command. Pure client-side logic — no npm dependency.

## Toggles and Settings
Nine permission checkboxes (owner / group / public × read / write / execute). No other settings.

## Inputs
- Owner (u): Read (4), Write (2), Execute (1)
- Group (g): Read (4), Write (2), Execute (1)
- Public (o): Read (4), Write (2), Execute (1)

## Outputs
- Octal mode string (e.g. `755`)
- Symbolic mode string (e.g. `rwxr-xr-x`)
- Command: `chmod <octal> path` (copyable)

## Notes
- Octal digits use classic bits: read=4, write=2, execute=1
- Symbolic uses `rwx` with `-` for unset bits (nine characters, no leading file-type char)
- Initial state is all unset → `000` / `---------` / `chmod 000 path`
- No sticky/setuid/setgid bits (matches it-tools)

## Source
Port of [it-tools Chmod calculator](https://it-tools.tech/chmod-calculator). Local reference: handy-dandy `it-tools` (`/chmod-calculator`). Catalogue id: `chmod-calculator`.

## Files
- `src/lib/tools/chmod-calculator/` — service, types, tests, README
- `src/components/tools/islands/ChmodCalculator.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `chmod-calculator`

## How to verify
```bash
npm test -- src/lib/tools/chmod-calculator
npm run build
```
Open `/tools/chmod-calculator`, toggle permissions, confirm octal/symbolic update, and copy the `chmod` command.
