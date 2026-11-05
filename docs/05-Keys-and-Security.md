# Keys and Security

## Assets & Publishing

- Public keys live in `public/keys/` and are served at `/keys/…`:
  - `ssh_ed25519.pub`
  - `pgp.asc`
  - Optional later: `authorized_keys`, `minisign.pub`, `age.pub`
- The `/keys` page reads these same files. Its fingerprints are set by hand in `src/content/site.ts`, so update them when a key changes.
- Private keys and revocation certificates never go in this repo.

## Fingerprints

- SSH: display SHA256 fingerprint associated with the public key
- PGP: display 40-hex fingerprint prominently

## Security.txt

- Host at `/.well-known/security.txt`
- Include:
  - `Contact: mailto:hello@dmeim.com`
  - `Encryption: https://dmeim.com/keys/pgp.asc`
  - `Preferred-Languages: en`
  - Optional `Expires:`

## Headers (at Cloudflare edge)

- Content-Security-Policy: default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'
- Strict-Transport-Security: max-age=31536000; includeSubDomains; preload (handled at TLS layer)
- X-Content-Type-Options: nosniff
- Referrer-Policy: no-referrer-when-downgrade (or stricter)
- Permissions-Policy: minimal required features

## WKD (Later)

- Optional OpenPGP Web Key Directory under `/.well-known/openpgpkey/hu/<hash>`
- Document steps when enabling

