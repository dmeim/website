# Keys Folder

Public keys now live in `public/keys/`, so the site serves them at `/keys/ssh_ed25519.pub` and `/keys/pgp.asc`. The `/keys` page reads those same files, but its fingerprints are set by hand in `src/content/site.ts`, so update them whenever a key changes.

Never put private keys or revocation certificates in this repo.
