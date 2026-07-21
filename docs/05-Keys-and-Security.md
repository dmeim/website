# Keys and Security

## Assets & Publishing

- Canonical keys live under `assets/keys/`:
  - `ssh_ed25519.pub`
  - `authorized_keys` (optional convenience bundle)
  - `pgp.asc`
  - Optional later: `minisign.pub`, `age.pub`
- During build, copy into `site/public/keys/` for hosting at `/keys/…`.

## Fingerprints

- SSH: display SHA256 fingerprint associated with the public key
- PGP: display 40-hex fingerprint prominently

## Security.txt

- Host at `/.well-known/security.txt`
- Include:
  - `Contact: mailto:me@dmeim.com`
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

