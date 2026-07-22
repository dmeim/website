# Email normalizer

## Name
Email normalizer (`email-normalizer`)

## Description
Normalize email addresses to a standard format for easier comparison. Useful for deduplication and data cleaning. Processes one address per line; provider-specific rules (Gmail, Googlemail, Hotmail, Live, Outlook) remove dots and/or strip `+` tags where applicable.

## Toggles and Settings
None.

## Inputs
- Raw emails (multiline, one address per line)

## Outputs
- Normalized emails (live as you type)
- Clear emails
- Copy normalized emails

## Notes
- Uses the `email-normalizer` npm package (same as it-tools)
- Empty input yields empty output
- Invalid lines become `Unable to parse email: <raw line>` (it-tools `withDefaultOnError` parity)
- Provider rules: Gmail/Googlemail (remove dots, strip plus; Googlemail → gmail.com); Hotmail/Outlook (strip plus); Live (remove dots, strip plus); other domains: trim + lowercase only
- Persistence from it-tools is not applicable (no storage in source)

## Source
Port of [it-tools Email normalizer](https://it-tools.tech/email-normalizer). Local reference: handy-dandy `it-tools` (`src/tools/email-normalizer`). Catalogue id: `email-normalizer`.

## Files
- `src/lib/tools/email-normalizer/` — service, tests, README
- `src/components/tools/islands/EmailNormalizer.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `email-normalizer`

## How to verify
```bash
npm test -- src/lib/tools/email-normalizer
npm run build
```
Open `/tools/email-normalizer`, paste emails (one per line), confirm normalization and copy/clear.
