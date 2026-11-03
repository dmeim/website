---
title: Verification lab
summary: In-browser checks for PGP and SSH (Ed25519) signatures against the keys published here.
status: wip
order: 3
year: Planned
tags: [Security, OpenPGP, SSH]
---

## The idea

Publishing fingerprints is only half of it. This lab will let anyone paste or
drop a message and a signature and check it, in the browser, against the keys
on [/keys](/keys), without installing anything.

## Planned

- **PGP:** verify inline and detached signatures with OpenPGP.js.
- **SSH:** verify `ssh-keygen -Y sign` signatures made with an Ed25519 key.
- **CLI snippets** for doing the same with `gpg` and `ssh-keygen`.

Nothing leaves the page: keys, messages, and signatures stay in the browser.
