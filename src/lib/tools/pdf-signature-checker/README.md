# PDF signature checker

## Name
PDF signature checker (`pdf-signature-checker`)

## Description
Verify digital signatures embedded in a PDF and inspect the certificate chain for each signature (validity period, issuer, subject, PEM).

## Toggles and Settings
None — choose a PDF and the checker runs automatically.

## Inputs
- PDF file (`.pdf`) via file picker / drag-and-drop.

## Outputs
- Per-signature certificate tables: validity period, issued by, issued to, expandable PEM.
- Soft failures (unsigned / unreadable / unsupported SubFilter) surface as an error status.

## Notes
- Uses `pdf-signature-reader` (node-forge + vendored Buffer). Loaded only via dynamic `import()` inside the client island handler — never resolved during Worker SSR.
- Node `tls` is aliased to a stub (`rootCertificates: undefined`) so the library falls back to its bundled root CA list.
- No global Buffer polyfill; the library vendors Buffer under `packages/buffer`.
- Bundle impact is non-trivial (~node-forge + root CA JSON); kept client-only with `client:only="react"`.

## Source
Port of [it-tools PDF signature checker](https://it-tools.tech/pdf-signature-checker). Local reference: handy-dandy `it-tools` (`/pdf-signature-checker`). Catalogue id: `pdf-signature-checker`.

## Files
- `src/lib/tools/pdf-signature-checker/` — service, types, tests, README
- `src/shims/node-tls.ts` — Vite alias target for `tls`
- `src/components/tools/islands/PdfSignatureChecker.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `pdf-signature-checker`

## How to verify
```bash
npm test -- src/lib/tools/pdf-signature-checker
npm run build
```
Open `/tools/pdf-signature-checker`, upload an unsigned PDF (expect error), then a signed PDF (expect certificate tables and expandable PEM).
