# Information Architecture

## Routes

- `/` — Home/About
  - Short bio, key highlights, primary calls to action
- `/resume` — Resume details
  - Experience, skills, education, contact
- `/keys` — Public keys and usage
  - SSH (ed25519), PGP, optional minisign/age later
  - Fingerprints, copy buttons, import instructions
- `/verify` — Verify messages/signatures
  - Tabs: PGP, SSH (Ed25519)
  - Inputs: message, signature; result UI
- Future
  - `/projects`, `/projects/<slug>`
  - `/links` (cards of platforms)

## Static Endpoints (to host later in site/public)

- `/keys/ssh_ed25519.pub`
- `/keys/authorized_keys`
- `/keys/pgp.asc`
- `/.well-known/security.txt`
- Optional: `/.well-known/openpgpkey/hu/<hash>` (WKD)
