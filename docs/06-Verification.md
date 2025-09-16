# Verification — Browser and CLI

## Browser-based

- PGP: Use `openpgp` to verify inline or detached signatures
  - Inputs: message (text/file), signature (text/file)
  - Import key from `/keys/pgp.asc`
- Ed25519 (SSH): Use `noble-ed25519` (or `tweetnacl`) to verify signatures
  - Inputs: message, signature; key from `/keys/ssh_ed25519.pub`
  - Document how to produce signatures with `ssh-keygen -Y sign`

UI: Tabs (PGP/SSH), Textareas/Dropzones, Verify button, result Alert/Toast.

## CLI Snippets

PGP import and verify:

```
curl -sSL https://dmeim.com/keys/pgp.asc | gpg --import
gpg --verify message.sig message.txt
```

SSH verify (OpenSSH >= 8.2):

```
ssh-keygen -Y verify \
  -f <(curl -sSL https://dmeim.com/keys/ssh_ed25519.pub) \
  -I dmeim.com -n file -s message.sig -m message.txt
```

