# Information Architecture

## Routes

- `/` — Home/About
  - Short bio, key highlights, primary calls to action
- `/orthodox` — Orthodox icons landing (nav item ☦, between Home and Projects)
  - `/orthodox/screensaver` — full-screen wall of icons; tap the wall for settings (collection, count, layout, border, rotation, background); the panel closes after 12s idle. The Custom layout has an arranging mode (drag, resize, add, and remove cards, and lock a card to an icon or a group)
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
