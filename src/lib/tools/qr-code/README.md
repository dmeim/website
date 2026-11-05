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
- **Quiet-zone margin** (0–10, default 4)
- **PNG size** (128–2048, default 1024)

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
- Replaces both it-tools QR tools. WiFi covers no password, WPA, WEP, and WPA2-EAP, hidden networks, all 17 it-tools EAP methods, phase 2, and identity or anonymous
- WiFi payloads end in `;;` per the ZXing format even when hidden, where it-tools emits a single `;`, and open networks keep `H:true`
- WiFi download names use the SSID only, so the password never lands in a file name; contact, email, phone, SMS, and location downloads use the preset name
- Colors and Export options sit in collapsed sections; open them to reach those fields
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
