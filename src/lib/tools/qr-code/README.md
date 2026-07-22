# QR Code Generator

## Name
QR Code generator (`qr-code`)

## Description
Generate QR codes locally from text or structured presets (website, social, contact/vCard, WiFi, email, phone, SMS, location). Preview PNG, export PNG/SVG, and inspect the encoded payload. Generation stays in the browser.

## Toggles and Settings
- **QR type** — text or preset (synced to `?type=` in the URL)
- **Preset fields** — depend on type (SSID/password, contact fields, etc.)
- **Foreground / background colors**
- **Transparent background for exports**
- **Error correction level** (L/M/Q/H)
- **Quiet-zone margin** (0–10)
- **PNG size** (128–2048)

## Inputs
- Free text, or structured form values for the selected preset
- Color and export options above

## Outputs
- Live PNG preview
- Generated payload textarea (read-only for presets)
- SVG markup panel
- Copy payload / Copy SVG
- Download PNG / Download SVG

## Notes
- Invalid presets clear the preview and show the first validation error
- WiFi payloads support WPA2-EAP extras (EAP method, phase 2, identity/anonymous)
- Rendering uses the `qrcode` package via `qrCode.service.ts`

## Source
Inspired by [it-tools QR Code generator](https://it-tools.tech/qrcode-generator). Local path reference: `/Users/dimitri/Library/Mobile Documents/com~apple~CloudDocs/~/Code/handy-dandy/it-tools` (`/qrcode-generator`). Catalogue id: `qrcode-generator`.

## Files
- `src/lib/tools/qr-code/` — payload builder, WiFi payload, QR render helpers
- `src/components/tools/islands/QRCodeGenerator.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `qrcode-generator`

## How to verify
```bash
npm test -- src/lib/tools/qr-code
npm run build
```
Open `/tools/qrcode-generator`, encode text or a preset, download PNG/SVG.
