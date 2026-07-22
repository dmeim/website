# Basic auth generator

## Name
Basic auth generator (`basic-auth-generator`)

## Description
Generate a base64 Basic Authorization header from a username and password. Runs entirely in the browser with native `TextEncoder` / `btoa` — no dependencies.

## Toggles and Settings
None.

## Inputs
- Username (single-line text)
- Password (single-line password field)

## Outputs
- Authorization header line: `Authorization: Basic <base64(username:password)>` (live as you type)
- Copy header to clipboard

## Notes
- Encoding is UTF-8 via `TextEncoder` then `btoa` (parity with it-tools / js-base64)
- Empty username and password still produce a header (`Authorization: Basic Og==` for `:`)
- Colons inside the password are preserved; only the first colon separates user from password in the credential string
- Credentials never leave the browser

## Source
Port of [it-tools Basic auth generator](https://it-tools.tech/basic-auth-generator). Local reference: handy-dandy `it-tools` (`/basic-auth-generator`). Catalogue id: `basic-auth-generator`.

## Files
- `src/lib/tools/basic-auth-generator/` — service, tests, README
- `src/components/tools/islands/BasicAuthGenerator.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `basic-auth-generator`

## How to verify
```bash
npm test -- src/lib/tools/basic-auth-generator
npm run build
```
Open `/tools/basic-auth-generator`, enter a username/password, confirm the header updates live, copy it, and decode the token with `atob` to verify `username:password`.
