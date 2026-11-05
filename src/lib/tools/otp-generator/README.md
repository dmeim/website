# OTP code generator

## Name
OTP code generator (`otp-generator`)

## Description
Generate and inspect time-based one-time passwords (TOTP) from a Base32 secret. Shows the previous, current, and next codes on a 30-second period, builds an `otpauth://` key URI with QR code, and exposes helper values (hex secret, epoch, counter). HOTP/TOTP verification helpers are included in the service for parity with it-tools.

## Toggles and Settings
- Fixed algorithm SHA1, 6 digits, 30-second period (it-tools UI parity)
- Refreshable random Base32 secret (16 characters)

## Inputs
- Base32 TOTP secret (paste or generate)

## Outputs
- Previous / current / next OTP codes (copyable)
- Countdown progress within the current period
- `otpauth://totp/…` key URI and QR image
- Secret in hexadecimal, Unix epoch seconds, iteration count, and padded hex counter

## Notes
- HMAC-SHA1 uses `crypto-js` (same approach as it-tools) for deterministic sync parity with RFC-style test vectors
- Secret generation reuses `createToken` from `token-generator` with the Base32 alphabet
- QR rendering reuses the shared `qrcode` helper from `qr-code`
- Secrets are normalized before use: spaces and trailing `=` padding are dropped and letters are uppercased, so a secret copied as `jbsw y3dp` works and the key URI and QR code carry the canonical form
- Invalid secrets are rejected in the UI; empty/invalid Base32 will not produce live codes
- Leftover bits of a secret that is not a whole number of bytes are dropped (RFC 4648), so codes match real authenticators. it-tools turned them into an extra key byte, so its codes differ for secrets like 26-character ones.
- The key URI uses `dmeim.com` as its issuer.
- A secret too long for a QR code shows a notice instead; the key URI can still be copied
- Tests cover the RFC 4226 Appendix D and RFC 6238 Appendix B SHA-1 vectors

## Source
Port of [it-tools OTP code generator](https://it-tools.tech/otp-generator). Local reference: handy-dandy `it-tools` (`src/tools/otp-code-generator-and-validator/`). Catalogue id: `otp-generator`.

## Files
- `src/lib/tools/otp-generator/` — service, tests, README
- `src/components/tools/islands/OtpGenerator.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `otp-generator`

## How to verify
```bash
npm test -- src/lib/tools/otp-generator
npm run build
```
Open `/tools/otp-generator`, generate or paste a secret, copy codes, and scan the QR with an authenticator app.
