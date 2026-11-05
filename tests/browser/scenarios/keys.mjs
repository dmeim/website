import crypto from "node:crypto";
import fs from "node:fs";

const file = (name) => fs.readFileSync(new URL(`../../../public/keys/${name}`, import.meta.url), "utf8").trim();

// Computed from the key itself, so a stale fingerprint on the page fails here.
const sshFingerprint = (publicKey) =>
  `SHA256:${crypto.createHash("sha256").update(Buffer.from(publicKey.split(" ")[1], "base64")).digest("base64").replace(/=+$/, "")}`;

export default [
  {
    slug: "(keys)",
    name: "serves public keys only, and the page shows the same ones",
    async run(t) {
      const ssh = file("ssh_ed25519.pub");
      const gpg = file("pgp.asc");
      t.assert.match(ssh, /^ssh-ed25519 /);
      t.assert.match(gpg, /^-----BEGIN PGP PUBLIC KEY BLOCK-----/);

      for (const [name, expected] of [["ssh_ed25519.pub", ssh], ["pgp.asc", gpg]]) {
        const response = await t.page.request.get(`${t.BASE}/keys/${name}`);
        t.assert.equal(response.status(), 200, name);
        const body = (await response.text()).trim();
        t.assert.equal(body, expected, name);
        t.assert.ok(!body.includes("PRIVATE"), `${name} must not contain a private key`);
      }

      await t.page.goto(`${t.BASE}/keys`, { waitUntil: "load" });
      const text = await t.text();
      t.assert.ok(text.includes(ssh), "SSH public key on the page");
      t.assert.ok(text.includes(gpg.split("\n")[2]), "GPG public key on the page");
      t.assert.ok(text.includes(sshFingerprint(ssh)), "SSH fingerprint matches the key");
      t.assert.ok(!/placeholder/i.test(text), "no placeholder text left");
      await t.noOverflow();
    },
  },
];
