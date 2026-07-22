# Base64 file converter

## Name
Base64 file converter (`base64-file-converter`)

## Description
Convert between files and Base64. Paste Base64 (optionally with a `data:*;base64,` prefix) to preview images and download a file, or upload a file to get its Base64 data URL. Runs entirely in the browser with native `FileReader` / `btoa` / `atob` — no dependencies.

## Toggles and Settings
- **File name** — download basename (default `file`)
- **Extension** — download extension; auto-suggested when MIME can be sniffed from the Base64 input

## Inputs
- Base64 string (multiline; optional data-URI prefix; trimmed for validation)
- Optional file name + extension for download
- File upload (any type) for encode

## Outputs
- Image preview when Base64 represents an image (button-triggered)
- Downloaded file from Base64
- Base64 data URL of the uploaded file (readonly textarea) + copy

## Notes
- Validation uses the same Base64 rules as `base64-string-converter` (empty is valid; invalid shows a hint)
- MIME sniffing covers data-URI prefixes plus PNG / GIF / JPG / PDF magic signatures (it-tools parity)
- Upload encoding uses `FileReader.readAsDataURL` (parity with VueUse `useBase64`)
- Download wraps bare Base64 in a data URI when MIME cannot be sniffed, using the extension (default `txt`)

## Source
Port of [it-tools Base64 file converter](https://it-tools.tech/base64-file-converter). Local reference: handy-dandy `it-tools` (`/base64-file-converter`). Catalogue id: `base64-file-converter`.

## Files
- `src/lib/tools/base64-file-converter/` — service, tests, README
- `src/components/tools/islands/Base64FileConverter.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `base64-file-converter`

## How to verify
```bash
npm test -- src/lib/tools/base64-file-converter
npm run build
```
Open `/tools/base64-file-converter`, paste a PNG data URI and preview/download, upload a small file and copy its Base64, paste invalid Base64 to confirm the validation hint.
