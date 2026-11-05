import crypto from "node:crypto";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
const H = (alg, s, enc = "hex") => crypto.createHash(alg).update(s, "utf8").digest(enc);
const HM = (alg, key, s, enc = "hex") => crypto.createHmac(alg, key).update(s, "utf8").digest(enc);
const sel = (t, nth, label) => t.page.locator("main select").nth(nth).selectOption({ label });
const area = (t, id) => t.page.locator(`main #${id}`).inputValue();
const setv = (t, id, v) => t.page.locator(`main #${id}`).fill(v);
const body = (t) => t.page.locator("main").innerText();
const radio = (t, text) => t.page.locator("main label", { hasText: new RegExp(`^${text}$`) }).first().click();
const firstTa = (t) => t.page.locator("main textarea").first().inputValue();
const settle = (t, ms = 400) => t.page.waitForTimeout(ms);

export default [
  { slug: "bcrypt", name: "hash then compare round trip", async run(t) {
    await t.open();
    await setv(t, "bc-clear-text", "hunter2");
    await t.page.waitForFunction(() => /^\$2[aby]\$10\$.{53}$/.test(document.querySelector("#bc-hash-output")?.value || ""), null, { timeout: 15000 });
    const h = await area(t, "bc-hash-output");
    await setv(t, "bc-compare-string", "hunter2");
    await setv(t, "bc-compare-hash", h);
    await t.page.waitForFunction(() => /Do they match\?\s*\n?Yes/.test(document.querySelector("main")?.innerText || ""), null, { timeout: 8000 });
  } },
  { slug: "uuid-generator", name: "NIL uuid", async run(t) {
    await t.open();
    await radio(t, "NIL");
    t.assert.equal(await area(t, "ug-output"), "00000000-0000-0000-0000-000000000000");
  } },
  { slug: "uuid-generator", name: "v4 quantity 3 gives 3 valid v4 uuids", async run(t) {
    await t.open();
    await radio(t, "v4");
    await setv(t, "ug-quantity", "3");
    await settle(t);
    const lines = (await area(t, "ug-output")).split("\n");
    t.assert.equal(lines.length, 3);
    for (const l of lines) t.assert.match(l, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  } },
  { slug: "uuid-generator", name: "v1 format", async run(t) {
    await t.open();
    await radio(t, "v1");
    await settle(t);
    t.assert.match(await area(t, "ug-output"), /^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  } },
  { slug: "uuid-generator", name: "v5 choice survives reload", async run(t) {
    await t.open();
    await radio(t, "v5");
    await settle(t);
    await t.page.reload({ waitUntil: "load" });
    await t.page.waitForTimeout(500);
    t.assert.match(await area(t, "ug-output"), /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-/);
  } },
  { slug: "bip39-generator", name: "128-bit zero entropy gives canonical 12 words", async run(t) {
    await t.open();
    await setv(t, "bip39-entropy", "00000000000000000000000000000000");
    await settle(t);
    t.assert.equal(await area(t, "bip39-mnemonic"), "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about");
  } },
  { slug: "bip39-generator", name: "128-bit 0x7f entropy matches BIP39 vector", async run(t) {
    await t.open();
    await setv(t, "bip39-entropy", "7f".repeat(16));
    await settle(t);
    t.assert.equal(await area(t, "bip39-mnemonic"), "legal winner thank year wave sausage worth useful legal winner thank yellow");
  } },
  { slug: "bip39-generator", name: "mnemonic converts back to entropy", async run(t) {
    await t.open();
    await setv(t, "bip39-mnemonic", "legal winner thank year wave sausage worth useful legal winner thank yellow");
    await settle(t);
    t.assert.equal(await area(t, "bip39-entropy"), "7f".repeat(16));
  } },
  { slug: "bip39-generator", name: "256-bit entropy gives 24 words", async run(t) {
    await t.open();
    await setv(t, "bip39-entropy", "00".repeat(32));
    await settle(t);
    const w = (await area(t, "bip39-mnemonic")).trim().split(/\s+/);
    t.assert.equal(w.length, 24);
    t.assert.equal(w[0], "abandon");
  } },
  { slug: "password-strength-analyser", name: "abcdefgh estimate", async run(t) {
    await t.open();
    await t.page.locator("#psa-password").fill("abcdefgh");
    await settle(t);
    const b = await body(t);
    t.assert.ok(b.includes("3 minutes, 28 seconds"), "crack time: " + b.slice(0, 300));
    t.assert.ok(b.includes("29 / 100"), "score");
    t.assert.ok(b.includes("37.6"), "entropy");
    t.assert.ok(b.includes("26"), "charset");
  } },
  { slug: "password-strength-analyser", name: "empty password is Instantly with zero entropy", async run(t) {
    await t.open();
    await settle(t);
    const b = await body(t);
    t.assert.ok(b.includes("Instantly"), "empty");
    t.assert.ok(b.includes("0 / 100"), "score 0");
  } },
  { slug: "password-strength-analyser", name: "mixed charset counts all classes (26+26+10+32)", async run(t) {
    await t.open();
    await t.page.locator("#psa-password").fill("Ab3$");
    await settle(t);
    const b = await body(t);
    t.assert.ok(b.includes("94"), "charset 94 expected, got: " + b.slice(-300));
  } },
  { slug: "url-encoder", name: "encode matches encodeURIComponent reference", async run(t) {
    await t.open();
    await t.fill("Your string", "a b&c=d/é🙂");
    await settle(t);
    t.assert.equal(await t.value("Your string encoded"), "a%20b%26c%3Dd%2F%C3%A9%F0%9F%99%82");
  } },
  { slug: "url-encoder", name: "trailing newline and spaces encoded", async run(t) {
    await t.open();
    await t.fill("Your string", "  x\n");
    await settle(t);
    t.assert.equal(await t.value("Your string encoded"), "%20%20x%0A");
  } },
  { slug: "url-encoder", name: "decode a valid string", async run(t) {
    await t.open();
    await t.fill("Your encoded string", "a%2Bb%20c%C3%A9");
    await settle(t);
    t.assert.equal(await t.value("Your string decoded"), "a+b cé");
  } },
  { slug: "url-encoder", name: "100 KB input encodes fully", async run(t) {
    await t.open();
    const big = "é".repeat(50000);
    await t.page.locator("main textarea").first().fill(big);
    await t.page.waitForTimeout(800);
    const out = await t.value("Your string encoded");
    t.assert.equal(out.length, 300000);
  } },
  { slug: "html-entities", name: "escape quotes, ampersand, angle brackets", async run(t) {
    await t.open();
    await t.fill("Your string", `<a href='x'>&"</a>`);
    await settle(t);
    t.assert.equal(await t.value("Your string escaped"), "&lt;a href=&#39;x&#39;&gt;&amp;&quot;&lt;/a&gt;");
  } },
  { slug: "html-entities", name: "unescape decodes exactly one level", async run(t) {
    await t.open();
    await t.fill("Your escaped string", "&amp;lt;b&gt;&#39;&quot;&amp;");
    await settle(t);
    t.assert.equal(await t.value("Your string unescaped"), "&lt;b>'\"&");
  } },
  { slug: "html-entities", name: "emoji and unicode pass through escape", async run(t) {
    await t.open();
    await t.fill("Your string", "é🙂<");
    await settle(t);
    t.assert.equal(await t.value("Your string escaped"), "é🙂&lt;");
  } },
  { slug: "slugify-string", name: "accents transliterated, punctuation dropped", async run(t) {
    await t.open();
    await t.fill("Your string to slugify", "  Déjà vu!! Ça va?  ");
    await settle(t);
    t.assert.equal(await t.value("Your slug"), "deja-vu-ca-va");
  } },
  { slug: "url-parser", name: "invalid URL does not crash", async run(t) {
    await t.open();
    await t.fill("Your URL to parse", "not a url");
    await settle(t);
  } },
  { slug: "jwt-parser", name: "jwt.io sample decodes header and payload", async run(t) {
    await t.open();
    await t.fill("JWT to decode", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c");
    await settle(t);
    const b = await body(t);
    t.assert.ok(b.includes("HS256"), "alg");
    t.assert.ok(b.includes("John Doe"), "name");
    t.assert.ok(b.includes("1234567890"), "sub");
  } },
  { slug: "jwt-parser", name: "UTF-8 and base64url payload decodes", async run(t) {
    await t.open();
    const p = Buffer.from(JSON.stringify({ name: "Zoë 🙂", s: "??>>" })).toString("base64url");
    await t.fill("JWT to decode", `eyJhbGciOiJub25lIn0.${p}.`);
    await settle(t);
    const b = await body(t);
    t.assert.ok(b.includes("Zoë 🙂"), "UTF-8 name not decoded: " + b.slice(-300));
  } },
  { slug: "jwt-parser", name: "malformed JWT shows error without crash", async run(t) {
    await t.open();
    await t.fill("JWT to decode", "abc");
    await settle(t);
  } },
  { slug: "http-status-codes", name: "search 'unavailable' shows 503", async run(t) {
    await t.open();
    await t.fill("Search HTTP status", "unavailable");
    await settle(t);
    t.assert.ok((await body(t)).includes("503"), "503 missing");
  } },
  { slug: "safelink-decoder", name: "decodes url parameter with nested query", async run(t) {
    await t.open();
    const orig = "https://example.com/path?a=1&b=2";
    const sl = "https://nam02.safelinks.protection.outlook.com/?url=" + encodeURIComponent(orig) + "&data=05%7C01&sdata=abc&reserved=0";
    await t.fill("Your Outlook SafeLink URL", sl);
    await settle(t);
    t.assert.equal(await t.value("Output decoded URL"), orig);
  } },
  { slug: "user-agent-parser", name: "Firefox UA on Windows", async run(t) {
    await t.open();
    await t.fill("User agent string", "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0");
    await settle(t);
    const b = await body(t);
    t.assert.ok(b.includes("Firefox") && b.includes("121.0"), "browser");
    t.assert.ok(b.includes("Gecko"), "engine");
    t.assert.ok(b.includes("Windows"), "os");
  } },
  { slug: "keycode-info", name: "pressing ArrowUp reports key and code", async run(t) {
    await t.open();
    await t.page.locator("main").click().catch(() => {});
    await t.page.keyboard.press("ArrowUp");
    await settle(t, 300);
    const b = await body(t);
    t.assert.ok(b.includes("ArrowUp"), "key name missing");
    t.assert.ok(b.includes("38"), "keyCode 38 missing");
  } },
  { slug: "device-information", name: "reports the viewport size", async run(t) {
    await t.open();
    const vw = await t.page.evaluate(() => String(window.innerWidth));
    t.assert.ok((await body(t)).includes(vw), "viewport width " + vw);
  } },
  { slug: "uuid-generator", name: "v5 DNS example.com equals uuid5", async run(t) {
    await t.open();
    await radio(t, "v5");
    await radio(t, "DNS");
    await setv(t, "ug-name", "example.com");
    await settle(t);
    t.assert.equal(await area(t, "ug-output"), "cfbff0d1-9375-5685-968c-48ce8b15ae17");
  } },
  { slug: "uuid-generator", name: "v3 URL https://dmeim.com/ equals uuid3", async run(t) {
    await t.open();
    await radio(t, "v3");
    await radio(t, "URL");
    await setv(t, "ug-name", "https://dmeim.com/");
    await settle(t);
    t.assert.equal(await area(t, "ug-output"), "37262a99-1878-3b03-8270-e1a4456dc5e8");
  } },
  { slug: "uuid-generator", name: "v5 OID 1.2.3 equals uuid5", async run(t) {
    await t.open();
    await radio(t, "v5");
    await radio(t, "OID");
    await setv(t, "ug-name", "1.2.3");
    await settle(t);
    t.assert.equal(await area(t, "ug-output"), "42d5e23b-3a02-5135-85c6-52d1102f1f00");
  } },
  { slug: "basic-auth-generator", name: "UTF-8 password header", async run(t) {
    await t.open();
    await setv(t, "basicauth-username", "user");
    await setv(t, "basicauth-password", "pässword");
    await settle(t);
    t.assert.equal(await area(t, "basicauth-header"), "Authorization: Basic dXNlcjpww6Rzc3dvcmQ=");
  } },
  { slug: "basic-auth-generator", name: "empty credentials give Og==", async run(t) {
    await t.open();
    await settle(t);
    t.assert.equal(await area(t, "basicauth-header"), "Authorization: Basic Og==");
  } },
  { slug: "basic-auth-generator", name: "colon in username kept", async run(t) {
    await t.open();
    await setv(t, "basicauth-username", "a:b");
    await setv(t, "basicauth-password", "c");
    await settle(t);
    t.assert.equal(await area(t, "basicauth-header"), "Authorization: Basic YTpiOmM=");
  } },
  { slug: "slugify-string", name: "copy disabled for empty input", async run(t) {
    await t.open();
    await settle(t);
    t.assert.ok(await t.page.locator('main button[aria-label="Copy"]').first().isDisabled());
  } },
  { slug: "url-parser", name: "splits URL with auth, port, query, hash", async run(t) {
    await t.open();
    await setv(t, "urlp-input", "https://alice:s3cr3t@example.org:8443/a/b%20c?x=1&y=two%20words#frag");
    await settle(t);
    const v = await t.page.locator("main input, main textarea").evaluateAll((els) => els.map((e) => e.value).join("\n"));
    for (const x of ["https:", "alice", "s3cr3t", "example.org", "8443", "/a/b%20c", "#frag"]) t.assert.ok(v.includes(x), "missing " + x);
  } },
  { slug: "otp-generator", name: "current TOTP equals RFC 6238 reference", async run(t) {
    await t.open();
    await setv(t, "otp-secret", "JBSWY3DPEHPK3PXP");
    await settle(t, 600);
    const now = Date.now() / 1000;
    const key = Buffer.from("48656c6c6f21deadbeef", "hex");
    const py = (tt) => {
      const c = Buffer.alloc(8); c.writeBigUInt64BE(BigInt(Math.floor(tt / 30)));
      const h = crypto.createHmac("sha1", key).update(c).digest();
      const o = h[h.length - 1] & 0xf;
      return String((h.readUInt32BE(o) & 0x7fffffff) % 1000000).padStart(6, "0");
    };
    const ok = [py(now - 30), py(now), py(now + 30)];
    const txt = await body(t);
    t.assert.ok(ok.some((x) => txt.includes(x)), `expected one of ${ok}`);
  } },
  { slug: "otp-generator", name: "issuer is dmeim.com", async run(t) {
    await t.open();
    await setv(t, "otp-secret", "JBSWY3DPEHPK3PXP");
    await settle(t, 400);
    const hrefs = await t.page.evaluate(() => [...document.querySelectorAll("a[href^='otpauth://']")].map((a) => a.getAttribute("href")).join(" "));
    t.assert.ok(hrefs.includes("issuer=dmeim.com"), "no dmeim.com issuer in key URI: " + hrefs);
  } },
  { slug: "mime-types", name: "MIME search finds image/png", async run(t) {
    await t.open();
    await setv(t, "mime-select-type", "image/png");
    await settle(t);
    t.assert.ok((await body(t)).includes(".png"), "no .png");
  } },
  { slug: "mime-types", name: "extension search finds application/pdf", async run(t) {
    await t.open();
    await setv(t, "mime-select-extension", "pdf");
    await settle(t);
    t.assert.ok((await body(t)).includes("application/pdf"), "application/pdf missing");
  } },
  { slug: "http-status-codes", name: "search 418 shows teapot", async run(t) {
    await t.open();
    await t.page.locator("input[type=search], input[type=text]").first().fill("418");
    await settle(t, 600);
    t.assert.ok(/teapot/i.test(await body(t)), "teapot missing");
  } },
  { slug: "url-encoder", name: "broken percent sequence shows message", async run(t) {
    await t.open();
    await t.fill("Your encoded string", "100%");
    await settle(t);
    t.assert.ok(/broken percent sequence/i.test(await body(t)), "no validation message");
  } },
];
