# Outlook SafeLink decoder

## Name
Outlook SafeLink decoder (`safelink-decoder`)

## Description
Decode Outlook SafeLink-wrapped URLs to the original destination. Extracts the `url` query parameter from `*.safelinks.protection.outlook.com` links via the native `URL` API (no dependencies).

## Toggles and Settings
None. Live decode as you type.

## Inputs
- Outlook SafeLink URL string (single line; may include HTML `&amp;` separators from email HTML)

## Outputs
- Original destination URL (copyable)
- Validation error when the host is not an Outlook SafeLinks domain, the string is not a URL, or the link has no `url` parameter

## Notes
- Requires a host matching `*.safelinks.protection.outlook.com`; the host is checked, not the text of the link
- HTML-encoded query separators (`&amp;`) are unescaped first, so `url` is found in any position
- A link copied without its protocol is read as `https://`
- Runs entirely in the browser; no network requests

## Source
Port of [it-tools Outlook SafeLink decoder](https://it-tools.tech/safelink-decoder). Local reference: handy-dandy `it-tools` (`/safelink-decoder`). Catalogue id: `safelink-decoder`.

## Files
- `src/lib/tools/safelink-decoder/` — service, tests, README
- `src/components/tools/islands/SafelinkDecoder.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `safelink-decoder`

## How to verify
```bash
npm test -- src/lib/tools/safelink-decoder
npm run build
```
Open `/tools/safelink-decoder`, paste a SafeLink, confirm the destination appears and copies.
