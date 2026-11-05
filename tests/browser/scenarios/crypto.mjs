import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FX = fileURLToPath(new URL("../fixtures/", import.meta.url));
const mobile = { width: 375, height: 800 };
const reload = async (t) => { await t.page.reload({ waitUntil: "load" }); await t.page.waitForFunction(() => !document.querySelector(".tools-mount__loading") && (document.querySelector("main")?.innerText?.length ?? 0) > 20); await t.page.waitForTimeout(200); };
const ALGOS = { MD5: "md5", SHA1: "sha1", SHA256: "sha256", SHA224: "sha224", SHA512: "sha512", SHA384: "sha384", SHA3: "sha3-512", RIPEMD160: "ripemd160" };
const hash = (a, s, enc = "hex") => crypto.createHash(a).update(s, "utf8").digest(enc);
const toBin = (hex) => [...hex].map((c) => parseInt(c, 16).toString(2).padStart(4, "0")).join("");
const fld = (t, label) => t.field(label, { exact: true });
const pickFile = async (t, name) => { await t.page.locator("main input[type=file]").setInputFiles(path.join(FX, name)); await t.page.waitForTimeout(600); };
const copyBtn = (t, name) => t.main().getByRole("button", { name }).first();
const copied = async (t, name) => { await copyBtn(t, name).click(); await t.page.waitForTimeout(120); return t.clipboard(); };

export default [
  // ---- token generator
  { slug: "token-generator", name: "token defaults, refresh, copy", async run(t) {
    await t.open();
    const a = await t.page.locator("#tg-token").inputValue();
    t.assert.match(a, /^[A-Za-z0-9]{64}$/);
    await t.click("Refresh");
    const b = await t.page.locator("#tg-token").inputValue();
    t.assert.match(b, /^[A-Za-z0-9]{64}$/);
    t.assert.notEqual(a, b);
    t.assert.equal(await copied(t, "Copy"), b);
  } },
  { slug: "token-generator", name: "token each option changes the alphabet", async run(t) {
    await t.open();
    await t.field("Uppercase").uncheck({ force: true });
    await t.page.waitForTimeout(80);
    t.assert.match(await t.page.locator("#tg-token").inputValue(), /^[a-z0-9]+$/);
    await t.field("Lowercase").uncheck({ force: true });
    await t.page.waitForTimeout(80);
    t.assert.match(await t.page.locator("#tg-token").inputValue(), /^[0-9]+$/);
    await t.field("Symbols").check({ force: true });
    await t.field("Numbers").uncheck({ force: true });
    await t.page.waitForTimeout(80);
    t.assert.match(await t.page.locator("#tg-token").inputValue(), /^[^A-Za-z0-9]+$/);
    await t.field("Symbols").uncheck({ force: true });
    await t.page.waitForTimeout(80);
    t.assert.equal(await t.page.locator("#tg-token").inputValue(), "");
    await t.has("Length");
    t.assert.equal(await t.page.locator("#tg-token").getAttribute("placeholder"), "Enable at least one character class");
    t.assert.ok(await t.main().getByRole("button", { name: "Refresh" }).isDisabled());
  } },
  { slug: "token-generator", name: "token options persist in URL", async run(t) {
    await t.open("?length=12&symbols=true&uppercase=false");
    const v = await t.page.locator("#tg-token").inputValue();
    t.assert.equal(v.length, 12);
    t.assert.doesNotMatch(v, /[A-Z]/);
    await t.page.locator("main input[type=range]").fill("20");
    await t.page.waitForTimeout(100);
    t.assert.equal((await t.page.locator("#tg-token").inputValue()).length, 20);
    t.assert.match(t.page.url(), /length=20/);
    t.assert.match(t.page.url(), /uppercase=false/);
    await reload(t);
    t.assert.equal((await t.page.locator("#tg-token").inputValue()).length, 20);
  } },
  { slug: "token-generator", name: "token bad URL values are survived", async run(t) {
    await t.open("?length=abc&symbols=maybe");
    t.assert.match(await t.page.locator("#tg-token").inputValue(), /^[A-Za-z0-9]{64}$/);
    await t.open("?length=99999");
    t.assert.equal((await t.page.locator("#tg-token").inputValue()).length, 512);
    await t.open("?length=512&symbols=true");
    t.assert.equal((await t.page.locator("#tg-token").inputValue()).length, 512);
    await t.noOverflow();
  } },
  { slug: "token-generator", name: "token mobile layout", viewport: mobile, async run(t) { await t.open(); await t.noOverflow(); } },

  // ---- hash text
  { slug: "hash-text", name: "hash matches node crypto in every encoding", async run(t) {
    await t.open();
    const input = "héllo wörld 😀";
    await t.fill("Your text to hash", input);
    for (const [label, algo] of Object.entries(ALGOS)) t.assert.equal(await fld(t, label).inputValue(), hash(algo, input), label);
    const enc = t.field("Digest encoding");
    await enc.selectOption("Base64");
    await t.page.waitForTimeout(80);
    for (const [label, algo] of Object.entries(ALGOS)) t.assert.equal(await fld(t, label).inputValue(), hash(algo, input, "base64"), label);
    await enc.selectOption("Base64url");
    await t.page.waitForTimeout(80);
    for (const [label, algo] of Object.entries(ALGOS)) t.assert.equal(await fld(t, label).inputValue(), hash(algo, input, "base64url"), label);
    await enc.selectOption("Bin");
    await t.page.waitForTimeout(80);
    for (const [label, algo] of Object.entries(ALGOS)) t.assert.equal(await fld(t, label).inputValue(), toBin(hash(algo, input)), label);
    t.assert.match(t.page.url(), /encoding=Bin/);
    await reload(t);
    t.assert.equal(await t.field("Digest encoding").inputValue(), "Bin");
  } },
  { slug: "hash-text", name: "hash empty state and bad encoding URL", async run(t) {
    await t.open("?encoding=rot13");
    t.assert.equal(await t.field("Digest encoding").inputValue(), "Hex");
    t.assert.equal(await fld(t, "SHA256").inputValue(), hash("sha256", ""));
    t.assert.equal(await fld(t, "SHA3").inputValue(), hash("sha3-512", ""));
    t.assert.ok((await fld(t, "Keccak512").inputValue()).startsWith("0eab42de4c3ceb92"));
    await t.fill("Your text to hash", "abc");
    const expected = hash("sha256", "abc");
    t.assert.equal(expected, "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    t.assert.equal(await fld(t, "SHA256").inputValue(), expected);
    await t.page.locator("#ht-digest-SHA256").locator("xpath=ancestor::*[contains(@class,'ui-output-field')]").getByRole("button").first().click();
    await t.page.waitForTimeout(120);
    t.assert.equal(await t.clipboard(), expected);
  } },
  { slug: "hash-text", name: "hash 1MB paste stays responsive", async run(t) {
    await t.open();
    const big = "x".repeat(1024 * 1024);
    const start = Date.now();
    await t.fill("Your text to hash", big);
    t.assert.equal(await fld(t, "SHA256").inputValue(), hash("sha256", big));
    t.assert.ok(Date.now() - start < 8000, `took ${Date.now() - start}ms`);
  } },
  { slug: "hash-text", name: "hash mobile layout", viewport: mobile, async run(t) { await t.open(); await t.fill("Your text to hash", "hello"); await t.noOverflow(); } },

  // ---- bcrypt
  { slug: "bcrypt", name: "bcrypt hash verifies with Apache htpasswd", async run(t) {
    await t.open();
    await t.fill("Your string", "correct horse");
    await t.page.waitForFunction(() => document.querySelector("#bc-hash-output")?.value.startsWith("$2"), null, { timeout: 15000 });
    const hashed = await t.page.locator("#bc-hash-output").inputValue();
    t.assert.match(hashed, /^\$2[aby]\$10\$[./A-Za-z0-9]{53}$/);
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "bcrypt-")), "htpasswd");
    fs.writeFileSync(file, `u:${hashed.replace(/^\$2[ab]/, "$2y")}\n`);
    execFileSync("htpasswd", ["-vb", file, "u", "correct horse"], { stdio: "ignore" });
    t.assert.throws(() => execFileSync("htpasswd", ["-vb", file, "u", "wrong"], { stdio: "ignore" }));
    t.assert.equal(await copied(t, "Copy hash"), hashed);
  } },
  { slug: "bcrypt", name: "bcrypt rounds slider covers valid costs only and changes the cost", async run(t) {
    await t.open();
    const slider = t.page.locator("#bc-rounds");
    t.assert.equal(await slider.getAttribute("min"), "4");
    t.assert.equal(await slider.getAttribute("max"), "31");
    await slider.fill("4");
    await t.page.waitForFunction(() => document.querySelector("#bc-hash-output")?.value.startsWith("$2b$04$") || document.querySelector("#bc-hash-output")?.value.startsWith("$2a$04$"), null, { timeout: 15000 });
    const first = await t.page.locator("#bc-hash-output").inputValue();
    await t.fill("Your string", "next");
    // the previous hash must not linger while the new one is computed
    t.assert.notEqual(await t.page.locator("#bc-hash-output").inputValue(), first);
    await slider.fill("14");
    await t.page.waitForTimeout(100);
    await t.has("High salt rounds");
    await t.hasNot("Hashing failed");
    await slider.fill("4");
    await t.page.waitForFunction(() => /^\$2[ab]\$04\$/.test(document.querySelector("#bc-hash-output")?.value), null, { timeout: 30000 });
  } },
  { slug: "bcrypt", name: "bcrypt compare states with independent hashes", async run(t) {
    await t.open();
    const panel = t.main().locator("section, article, div").filter({ hasText: "Compare string with hash" }).last();
    await t.page.locator("#bc-compare-string").fill("correct horse");
    await t.page.locator("#bc-compare-hash").fill("$2y$06$N59e2V1VbQJ/1Gy.23FaHuOS6gr1pd.vGCRRzTFyXjTS5QlGUzZhi");
    await t.page.waitForTimeout(700);
    t.assert.match(await t.text(), /Do they match\?\s*Yes/);
    await t.page.locator("#bc-compare-string").fill("nope");
    await t.page.waitForTimeout(700);
    t.assert.match(await t.text(), /Do they match\?\s*No/);
    await t.page.locator("#bc-compare-hash").fill("not a hash");
    await t.page.waitForTimeout(200);
    t.assert.match(await t.text(), /Do they match\?\s*Invalid hash/);
    await t.page.locator("#bc-compare-string").fill("");
    await t.page.locator("#bc-compare-hash").fill("$2a$06$DCq7YPn5Rq63x1Lad4cll.TV4S6ytwfsfvkgY8jIucDrjc8deX1s.");
    await t.page.waitForTimeout(700);
    t.assert.match(await t.text(), /Do they match\?\s*Yes/);
    await t.page.locator("#bc-compare-hash").fill("");
    await t.page.waitForTimeout(100);
    t.assert.match(await t.text(), /Do they match\?\s*–/);
    t.assert.ok(panel);
  } },
  { slug: "bcrypt", name: "bcrypt warns about the 72 byte limit and mobile layout", viewport: mobile, async run(t) {
    await t.open();
    await t.page.locator("#bc-clear-text").fill("a".repeat(73));
    await t.page.waitForTimeout(100);
    await t.has("longer than 72 bytes");
    await t.noOverflow();
  } },

  // ---- uuid
  { slug: "uuid-generator", name: "uuid default v4, refresh, copy", async run(t) {
    await t.open();
    const a = await t.value("UUIDs");
    t.assert.match(a, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    await t.click("Refresh");
    const b = await t.value("UUIDs");
    t.assert.notEqual(a, b);
    t.assert.equal(await copied(t, "Copy"), b);
  } },
  { slug: "uuid-generator", name: "uuid every version and quantity", async run(t) {
    await t.open();
    await t.page.locator("#ug-quantity").fill("7");
    await t.page.waitForTimeout(60);
    const v4s = (await t.value("UUIDs")).split("\n");
    t.assert.equal(v4s.length, 7);
    t.assert.equal(new Set(v4s).size, 7);
    await t.main().getByRole("radio", { name: "NIL" }).check({ force: true });
    await t.page.waitForTimeout(60);
    t.assert.equal(await t.value("UUIDs"), Array(7).fill("00000000-0000-0000-0000-000000000000").join("\n"));
    await t.main().getByRole("radio", { name: "v1" }).check({ force: true });
    await t.page.waitForTimeout(60);
    const v1s = (await t.value("UUIDs")).split("\n");
    t.assert.equal(new Set(v1s).size, 7);
    for (const id of v1s) t.assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    await t.page.locator("#ug-quantity").fill("1");
    await t.main().getByRole("radio", { name: "v3" }).check({ force: true });
    await t.main().getByRole("radio", { name: "DNS" }).check({ force: true });
    await t.page.locator("#ug-name").fill("python.org");
    await t.page.waitForTimeout(60);
    t.assert.equal(await t.value("UUIDs"), "6fa459ea-ee8a-3ca4-894e-db77e160355e");
    await t.main().getByRole("radio", { name: "v5" }).check({ force: true });
    await t.page.waitForTimeout(60);
    t.assert.equal(await t.value("UUIDs"), "886313e1-3b8a-5372-9b90-0c9aee199e5d");
  } },
  { slug: "uuid-generator", name: "uuid invalid namespace shows a message and no output", async run(t) {
    await t.open();
    await t.main().getByRole("radio", { name: "v5" }).check({ force: true });
    await t.page.locator("#ug-namespace").fill("not-a-uuid");
    await t.page.waitForTimeout(80);
    t.assert.equal(await t.value("UUIDs"), "");
    await t.has("Enter a valid namespace UUID");
    t.assert.ok(await copyBtn(t, "Copy").isDisabled());
    await t.page.locator("#ug-namespace").fill(" 6ba7b810-9dad-11d1-80b4-00c04fd430c8");
    await t.page.waitForTimeout(80);
    await t.has("Enter a valid namespace UUID");
    await t.page.locator("#ug-namespace").fill("6ba7b810-9dad-11d1-80b4-00c04fd430c8");
    await t.page.waitForTimeout(80);
    await t.hasNot("Enter a valid namespace UUID");
    t.assert.notEqual(await t.value("UUIDs"), "");
  } },
  { slug: "uuid-generator", name: "uuid settings persist and quantity input is typable", async run(t) {
    await t.open();
    const qty = t.page.locator("#ug-quantity");
    await qty.click();
    await qty.fill("");
    t.assert.equal(await qty.inputValue(), "");
    await qty.pressSequentially("25");
    await t.page.waitForTimeout(60);
    t.assert.equal(await qty.inputValue(), "25");
    t.assert.equal((await t.value("UUIDs")).split("\n").length, 25);
    await qty.fill("500");
    await t.page.waitForTimeout(60);
    t.assert.equal((await t.value("UUIDs")).split("\n").length, 50);
    await qty.blur();
    await t.page.waitForTimeout(60);
    t.assert.equal(await qty.inputValue(), "50");
    await t.main().getByRole("radio", { name: "v1" }).check({ force: true });
    await t.page.waitForTimeout(60);
    await reload(t);
    t.assert.equal(await t.page.locator("#ug-quantity").inputValue(), "50");
    t.assert.equal((await t.value("UUIDs")).split("\n")[0][14], "1");
    await t.page.evaluate(() => { localStorage.setItem("tools:uuid-generator:version", '"v99"'); localStorage.setItem("tools:uuid-generator:quantity", '"x"'); });
    await reload(t);
    t.assert.equal((await t.value("UUIDs")).split("\n").length, 1);
    t.assert.equal((await t.value("UUIDs"))[14], "4");
  } },
  { slug: "uuid-generator", name: "uuid mobile layout", viewport: mobile, async run(t) { await t.open(); await t.main().getByRole("radio", { name: "v5" }).check({ force: true }); await t.page.waitForTimeout(60); await t.noOverflow(); } },

  // ---- ulid
  { slug: "ulid-generator", name: "ulid defaults, refresh, copy", async run(t) {
    await t.open();
    const before = Date.now();
    const a = await t.value("ULIDs");
    t.assert.match(a, /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/);
    const decode = (s) => [...s.slice(0, 10)].reduce((n, c) => n * 32 + "0123456789ABCDEFGHJKMNPQRSTVWXYZ".indexOf(c), 0);
    t.assert.ok(Math.abs(decode(a) - before) < 120000, "timestamp is current");
    await t.click("Refresh");
    const b = await t.value("ULIDs");
    t.assert.notEqual(a, b);
    t.assert.equal(await copied(t, "Copy"), b);
  } },
  { slug: "ulid-generator", name: "ulid quantity, JSON format, and persistence", async run(t) {
    await t.open();
    await t.page.locator("#ulid-quantity").fill("5");
    await t.page.waitForTimeout(60);
    t.assert.equal((await t.value("ULIDs")).split("\n").length, 5);
    await t.main().getByRole("radio", { name: "JSON" }).check({ force: true });
    await t.page.waitForTimeout(60);
    const parsed = JSON.parse(await t.value("ULIDs"));
    t.assert.equal(parsed.length, 5);
    for (const id of parsed) t.assert.match(id, /^[0-9A-HJKMNP-TV-Z]{26}$/);
    await reload(t);
    t.assert.equal(JSON.parse(await t.value("ULIDs")).length, 5);
    const qty = t.page.locator("#ulid-quantity");
    await qty.fill("");
    t.assert.equal(await qty.inputValue(), "");
    await qty.fill("100000");
    await t.page.waitForTimeout(60);
    t.assert.equal(JSON.parse(await t.value("ULIDs")).length, 100);
  } },

  // ---- encryption
  { slug: "encryption", name: "encryption sample state and openssl interop both ways", async run(t) {
    await t.open();
    t.assert.equal(await t.page.locator("#enc-plaintext-out").inputValue(), "Lorem ipsum dolor sit amet");
    await t.page.locator("#enc-plaintext").fill("señor 😀 secret");
    await t.page.locator("#enc-secret").fill("hunter2");
    await t.page.waitForTimeout(60);
    const ct = await t.page.locator("#enc-ciphertext-out").inputValue();
    t.assert.match(ct, /^U2FsdGVkX1/);
    const pt = execFileSync("openssl", ["enc", "-d", "-aes-256-cbc", "-md", "md5", "-a", "-A", "-pass", "pass:hunter2"], { input: ct + "\n" }).toString();
    t.assert.equal(pt, "señor 😀 secret");
    const wrapped = execFileSync("openssl", ["enc", "-aes-256-cbc", "-md", "md5", "-a", "-salt", "-pass", "pass:hunter2"], { input: "y".repeat(90) }).toString();
    await t.page.locator("#enc-ciphertext-in").fill(wrapped);
    await t.page.locator("#enc-decrypt-secret").fill("hunter2");
    await t.page.waitForTimeout(60);
    t.assert.equal(await t.page.locator("#enc-plaintext-out").inputValue(), "y".repeat(90));
  } },
  { slug: "encryption", name: "encryption every algorithm round trips through the UI", async run(t) {
    await t.open();
    await t.page.locator("#enc-plaintext").fill("round trip 🔐");
    for (const algo of ["AES", "TripleDES", "Rabbit", "RC4"]) {
      await t.page.locator("#enc-encrypt-algo").selectOption(algo);
      await t.page.locator("#enc-decrypt-algo").selectOption(algo);
      await t.page.waitForTimeout(60);
      const ct = await t.page.locator("#enc-ciphertext-out").inputValue();
      await t.page.locator("#enc-ciphertext-in").fill(ct);
      await t.page.waitForTimeout(60);
      t.assert.equal(await t.page.locator("#enc-plaintext-out").inputValue(), "round trip 🔐", algo);
    }
  } },
  { slug: "encryption", name: "encryption wrong key and garbage show only an error", async run(t) {
    await t.open();
    await t.page.locator("#enc-decrypt-secret").fill("wrong key");
    await t.page.waitForTimeout(80);
    await t.has("Unable to decrypt your text");
    t.assert.equal(await t.page.locator("#enc-plaintext-out").count(), 0);
    await t.page.locator("#enc-decrypt-secret").fill("my secret key");
    await t.page.locator("#enc-ciphertext-in").fill("!!! not ciphertext !!!");
    await t.page.waitForTimeout(80);
    await t.has("Unable to decrypt your text");
    await t.page.locator("#enc-ciphertext-in").fill("");
    await t.page.waitForTimeout(80);
    await t.hasNot("Unable to decrypt");
    t.assert.equal(await t.page.locator("#enc-plaintext-out").inputValue(), "");
  } },
  { slug: "encryption", name: "encryption mobile layout", viewport: mobile, async run(t) { await t.open(); await t.noOverflow(); } },

  // ---- bip39
  { slug: "bip39-generator", name: "bip39 reference vectors both ways", async run(t) {
    await t.open();
    t.assert.match(await t.page.locator("#bip39-entropy").inputValue(), /^[0-9a-f]{32}$/);
    t.assert.equal((await t.page.locator("#bip39-mnemonic").inputValue()).split(" ").length, 12);
    await t.page.locator("#bip39-entropy").fill("80808080808080808080808080808080");
    await t.page.waitForTimeout(60);
    t.assert.equal(await t.page.locator("#bip39-mnemonic").inputValue(), "letter advice cage absurd amount doctor acoustic avoid letter advice cage above");
    await t.page.locator("#bip39-mnemonic").fill("legal winner thank year wave sausage worth useful legal winner thank yellow");
    await t.page.waitForTimeout(60);
    t.assert.equal(await t.page.locator("#bip39-entropy").inputValue(), "7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f");
    t.assert.equal(await copied(t, "Copy entropy"), "7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f");
    t.assert.equal(await copied(t, "Copy mnemonic"), "legal winner thank year wave sausage worth useful legal winner thank yellow");
    await t.page.locator("#bip39-entropy").fill("0".repeat(64));
    await t.page.waitForTimeout(60);
    t.assert.equal(await t.page.locator("#bip39-mnemonic").inputValue(), `${"abandon ".repeat(23)}art`);
    t.assert.equal(await t.page.locator("#bip39-strength").inputValue(), "256");
  } },
  { slug: "bip39-generator", name: "bip39 invalid input clears the other side", async run(t) {
    await t.open();
    await t.page.locator("#bip39-entropy").fill("abc");
    await t.page.waitForTimeout(60);
    await t.has("Entropy length must be");
    t.assert.equal(await t.page.locator("#bip39-mnemonic").inputValue(), "");
    t.assert.ok(await copyBtn(t, "Copy mnemonic").isDisabled());
    await t.page.locator("#bip39-entropy").fill("zzzz");
    await t.page.waitForTimeout(60);
    await t.has("hexadecimal string");
    await t.page.locator("#bip39-entropy").fill("");
    await t.page.locator("#bip39-mnemonic").fill("not a real mnemonic");
    await t.page.waitForTimeout(60);
    await t.has("Invalid mnemonic");
    t.assert.equal(await t.page.locator("#bip39-entropy").inputValue(), "");
    await t.click("Refresh entropy");
    t.assert.match(await t.page.locator("#bip39-entropy").inputValue(), /^[0-9a-f]{32}$/);
    await t.hasNot("Invalid mnemonic");
  } },
  { slug: "bip39-generator", name: "bip39 language and strength change the output", async run(t) {
    await t.open();
    await t.page.locator("#bip39-entropy").fill("0".repeat(32));
    await t.page.locator("#bip39-language").selectOption("spanish");
    await t.page.waitForTimeout(60);
    t.assert.equal(await t.page.locator("#bip39-mnemonic").inputValue(), `${"ábaco ".repeat(11)}abierto`.normalize("NFKD"));
    await t.page.locator("#bip39-language").selectOption("japanese");
    await t.page.waitForTimeout(60);
    const ja = await t.page.locator("#bip39-mnemonic").inputValue();
    t.assert.ok(ja.includes("　"), "japanese uses ideographic spaces");
    await t.hasNot("Invalid mnemonic");
    await t.page.locator("#bip39-mnemonic").fill(ja);
    await t.page.waitForTimeout(60);
    t.assert.equal(await t.page.locator("#bip39-entropy").inputValue(), "0".repeat(32));
    await t.page.locator("#bip39-language").selectOption("english");
    await t.page.locator("#bip39-strength").selectOption("192");
    await t.page.waitForTimeout(60);
    t.assert.match(await t.page.locator("#bip39-entropy").inputValue(), /^[0-9a-f]{48}$/);
    t.assert.equal((await t.page.locator("#bip39-mnemonic").inputValue()).split(" ").length, 18);
  } },
  { slug: "bip39-generator", name: "bip39 mnemonic pasted before picking its language", async run(t) {
    await t.open();
    await t.page.locator("#bip39-mnemonic").fill(`${"ábaco ".repeat(11)}abierto`.normalize("NFKD"));
    await t.page.waitForTimeout(60);
    await t.has("Invalid mnemonic");
    await t.page.locator("#bip39-language").selectOption("spanish");
    await t.page.waitForTimeout(60);
    await t.hasNot("Invalid mnemonic");
    t.assert.equal(await t.page.locator("#bip39-entropy").inputValue(), "0".repeat(32));
  } },
  { slug: "bip39-generator", name: "bip39 mobile layout", viewport: mobile, async run(t) { await t.open(); await t.noOverflow(); } },

  // ---- hmac
  { slug: "hmac-generator", name: "hmac matches node crypto for each function and encoding", async run(t) {
    await t.open();
    const msg = "héllo 😀", key = "clé 🔑";
    await t.page.locator("#hmac-plain-text").fill(msg);
    await t.page.locator("#hmac-secret").fill(key);
    for (const [label, algo] of Object.entries(ALGOS)) {
      await t.page.locator("#hmac-algorithm").selectOption(label);
      await t.page.waitForTimeout(40);
      t.assert.equal(await t.page.locator("#hmac-output").inputValue(), crypto.createHmac(algo, key).update(msg).digest("hex"), label);
    }
    await t.page.locator("#hmac-algorithm").selectOption("SHA256");
    const d = crypto.createHmac("sha256", key).update(msg).digest();
    await t.page.locator("#hmac-encoding").selectOption("Base64");
    await t.page.waitForTimeout(40);
    t.assert.equal(await t.page.locator("#hmac-output").inputValue(), d.toString("base64"));
    await t.page.locator("#hmac-encoding").selectOption("Base64url");
    await t.page.waitForTimeout(40);
    t.assert.equal(await t.page.locator("#hmac-output").inputValue(), d.toString("base64url"));
    await t.page.locator("#hmac-encoding").selectOption("Bin");
    await t.page.waitForTimeout(40);
    t.assert.equal(await t.page.locator("#hmac-output").inputValue(), toBin(d.toString("hex")));
  } },
  { slug: "hmac-generator", name: "hmac RFC 4231 vector, empty state, and copy", async run(t) {
    await t.open();
    t.assert.equal(await t.page.locator("#hmac-output").inputValue(), crypto.createHmac("sha256", "").update("").digest("hex"));
    t.assert.equal(await t.page.locator("#hmac-algorithm").inputValue(), "SHA256");
    await t.page.locator("#hmac-plain-text").fill("what do ya want for nothing?");
    await t.page.locator("#hmac-secret").fill("Jefe");
    await t.page.waitForTimeout(60);
    const v = "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843";
    t.assert.equal(await t.page.locator("#hmac-output").inputValue(), v);
    await t.page.locator(".ui-output-field").getByRole("button").first().click();
    await t.page.waitForTimeout(120);
    t.assert.equal(await t.clipboard(), v);
  } },
  { slug: "hmac-generator", name: "hmac mobile layout", viewport: mobile, async run(t) { await t.open(); await t.noOverflow(); } },

  // ---- rsa
  { slug: "rsa-key-pair-generator", name: "rsa default pair is valid per node crypto and openssl", async run(t) {
    await t.open();
    await t.page.waitForFunction(() => document.querySelector("#rsa-private-key")?.value.includes("END PRIVATE KEY"), null, { timeout: 60000 });
    const pub = await t.page.locator("#rsa-public-key").inputValue();
    const priv = await t.page.locator("#rsa-private-key").inputValue();
    const k = crypto.createPublicKey(pub);
    t.assert.equal(k.asymmetricKeyDetails.modulusLength, 2048);
    t.assert.equal(k.asymmetricKeyDetails.publicExponent, 65537n);
    const signature = crypto.sign("sha256", Buffer.from("x"), crypto.createPrivateKey(priv));
    t.assert.ok(crypto.verify("sha256", Buffer.from("x"), k, signature), "private and public key match");
    const check = execFileSync("openssl", ["rsa", "-check", "-noout"], { input: priv, stdio: ["pipe", "pipe", "ignore"] }).toString();
    t.assert.match(check, /RSA key ok/);
    t.assert.equal(await copied(t, "Copy public key"), pub);
    t.assert.equal(await copied(t, "Copy private key"), priv);
  } },
  { slug: "rsa-key-pair-generator", name: "rsa bits change, refresh, and invalid bits", async run(t) {
    await t.open();
    await t.page.waitForFunction(() => document.querySelector("#rsa-private-key")?.value.includes("END PRIVATE KEY"), null, { timeout: 60000 });
    const first = await t.page.locator("#rsa-public-key").inputValue();
    await t.page.locator("#rsa-bits").fill("1024");
    await t.page.waitForFunction(() => document.querySelector("#rsa-public-key")?.value.includes("END PUBLIC KEY"), null, { timeout: 60000 });
    const small = await t.page.locator("#rsa-public-key").inputValue();
    t.assert.equal(crypto.createPublicKey(small).asymmetricKeyDetails.modulusLength, 1024);
    await t.click("Refresh key pair");
    await t.page.waitForFunction((old) => { const v = document.querySelector("#rsa-public-key")?.value; return v && v !== old; }, small, { timeout: 60000 });
    t.assert.notEqual(first, small);
    await t.page.locator("#rsa-bits").fill("1001");
    await t.page.waitForTimeout(80);
    await t.has("multiple of 8");
    await t.hasNot("key pair ready");
    t.assert.equal(await t.page.locator("#rsa-public-key").inputValue(), "");
    t.assert.equal(await t.page.locator("#rsa-private-key").inputValue(), "");
    t.assert.ok(await copyBtn(t, "Copy private key").isDisabled());
    t.assert.ok(await t.main().getByRole("button", { name: "Refresh key pair" }).isDisabled());
    await t.page.locator("#rsa-bits").fill("");
    await t.page.waitForTimeout(80);
    await t.has("multiple of 8");
  } },
  { slug: "rsa-key-pair-generator", name: "rsa very small size fails gracefully or works", async run(t) {
    await t.open();
    await t.page.waitForFunction(() => document.querySelector("#rsa-private-key")?.value.includes("END PRIVATE KEY"), null, { timeout: 60000 });
    await t.page.locator("#rsa-bits").fill("256");
    await t.page.waitForTimeout(1500);
    const pub = await t.page.locator("#rsa-public-key").inputValue();
    if (pub) t.assert.equal(crypto.createPublicKey(pub).asymmetricKeyDetails.modulusLength, 256);
    else await t.has("could not generate a 256-bit key");
    await t.page.locator("#rsa-bits").fill("8192");
    await t.page.waitForTimeout(100);
    await t.has("Auto-refresh is off");
  }, allowConsoleErrors: true },
  { slug: "rsa-key-pair-generator", name: "rsa mobile layout", viewport: mobile, async run(t) { await t.open(); await t.page.waitForFunction(() => document.querySelector("#rsa-private-key")?.value.includes("END PRIVATE KEY"), null, { timeout: 60000 }); await t.noOverflow(); } },

  // ---- password
  { slug: "password-strength-analyser", name: "password it-tools vector and details", async run(t) {
    await t.open();
    await t.has("Instantly");
    await t.page.locator("#psa-password").fill("ABCabc123!@#");
    await t.page.waitForTimeout(60);
    t.assert.equal((await t.page.getByTestId("crack-duration").locator(".ui-stat__value").textContent()).trim(), "15,091 millennia, 3 centuries");
    const body = await t.text();
    t.assert.match(body, /Password length\s*12/);
    t.assert.match(body, /Character set size\s*94/);
    t.assert.match(body, /Entropy\s*78\.66/);
    t.assert.match(body, /61 \/ 100/);
  } },
  { slug: "password-strength-analyser", name: "password short, huge, emoji, and hidden by default", async run(t) {
    await t.open();
    const pw = t.page.locator("#psa-password");
    t.assert.equal(await pw.getAttribute("type"), "password");
    await pw.fill("abc");
    await t.page.waitForTimeout(40);
    await t.has("Instantly");
    await pw.fill("a".repeat(300));
    await t.page.waitForTimeout(40);
    await t.has("Effectively forever");
    await t.hasNot("Infinity");
    await t.hasNot("NaN");
    t.assert.match(await t.text(), /100 \/ 100/);
    await pw.fill("😀😀😀");
    await t.page.waitForTimeout(40);
    t.assert.match(await t.text(), /Password length\s*3/);
    await pw.fill("");
    await t.page.waitForTimeout(40);
    await t.has("Instantly");
    t.assert.match(await t.text(), /Password length\s*0/);
  } },
  { slug: "password-strength-analyser", name: "password mobile layout", viewport: mobile, async run(t) { await t.open(); await t.page.locator("#psa-password").fill("ABCabc123!@#ABCabc123!@#ABCabc123!@#"); await t.noOverflow(); } },

  // ---- pdf
  { slug: "pdf-signature-checker", name: "pdf signed fixture shows certificate details", async run(t) {
    await t.open();
    await pickFile(t, "signed.pdf");
    await t.page.waitForFunction(() => document.querySelector("main")?.innerText.includes("Signature 1 certificates"), null, { timeout: 15000 });
    await t.has("signed.pdf");
    await t.has("8.4 KB");
    await t.has("Certificate 1");
    await t.has("Audit Signer");
    await t.has("Audit Org");
    await t.has("Not before");
    await t.hasNot("No signatures found");
    await t.main().getByText("View PEM certificate").click();
    await t.page.waitForTimeout(100);
    const pem = fs.readFileSync(path.join(FX, "cert.pem"), "utf8");
    const body = pem.split("\n").filter((l) => l && !l.startsWith("-----")).join("");
    const shown = (await t.text()).replace(/\s+/g, "");
    t.assert.ok(shown.includes(body), "shows the same certificate that signed the file");
  } },
  { slug: "pdf-signature-checker", name: "pdf unsigned, garbage, corrupt, and unsupported messages", async run(t) {
    await t.open();
    await t.hasNot("No signatures found");
    await pickFile(t, "unsigned.pdf");
    await t.has("No signatures found in the provided file.");
    await pickFile(t, "garbage.pdf");
    await t.has("No signatures found in the provided file.");
    await t.has("garbage.pdf");
    await pickFile(t, "corrupt.pdf");
    await t.has("could not be read");
    await pickFile(t, "unsupported.pdf");
    await t.has("cannot read");
    await pickFile(t, "signed.pdf");
    await t.has("Signature 1 certificates");
    await t.hasNot("cannot read");
    await pickFile(t, "unsigned.pdf");
    await t.hasNot("Signature 1 certificates");
    await pickFile(t, "unsigned.pdf");
    await t.has("No signatures found");
  } },
  { slug: "pdf-signature-checker", name: "pdf mobile layout", viewport: mobile, async run(t) { await t.open(); await pickFile(t, "signed.pdf"); await t.has("Signature 1"); await t.noOverflow(); } },

  { slug: "pdf-signature-checker", name: "pdf checker load failure is friendly", allowConsoleErrors: true, async run(t) {
    await t.page.route("**/_astro/pdf-signature-reader.*.js", (route) => route.abort());
    await t.open();
    await pickFile(t, "signed.pdf");
    await t.has("could not load");
    await t.hasNot("Failed to fetch");
  } },

  // ---- word code
  { slug: "word-code-generator", name: "word code generate, digits, position, case, copy", async run(t) {
    await t.open();
    await t.page.waitForTimeout(300);
    await t.has("Choose your settings");
    await t.click("Generate");
    const lines = (await t.page.locator("#wc-output").inputValue()).split("\n");
    t.assert.equal(lines.length, 20);
    for (const l of lines) t.assert.match(l, /^\D.*\d{2}$/);
    t.assert.equal(await copied(t, "Copy codes"), lines.join("\n"));
    await t.page.locator("#wc-digits").fill("4");
    await t.page.locator("#wc-results").fill("5");
    await t.click("Generate");
    const four = (await t.page.locator("#wc-output").inputValue()).split("\n");
    t.assert.equal(four.length, 5);
    for (const l of four) t.assert.match(l, /\d{4}$/);
    await t.page.locator("#wc-position").selectOption("start");
    await t.page.waitForTimeout(60);
    for (const l of (await t.page.locator("#wc-output").inputValue()).split("\n")) t.assert.match(l, /^\d{4}\D/);
    await t.page.locator("#wc-word-case").selectOption("uppercase");
    await t.page.waitForTimeout(60);
    const up = await t.page.locator("#wc-output").inputValue();
    t.assert.equal(up, up.toUpperCase());
    await t.page.locator("#wc-word-case").selectOption("lowercase");
    await t.page.waitForTimeout(60);
    const low = await t.page.locator("#wc-output").inputValue();
    t.assert.equal(low, low.toLowerCase());
    await t.page.locator("#wc-word-case").selectOption("random");
    await t.page.waitForTimeout(60);
    const rand = await t.page.locator("#wc-output").inputValue();
    await t.page.locator("#wc-word-case").selectOption("random");
    t.assert.equal(rand.toLowerCase(), low);
  } },
  { slug: "word-code-generator", name: "word code output formats", async run(t) {
    await t.open();
    await t.page.waitForTimeout(300);
    await t.page.locator("#wc-results").fill("3");
    await t.click("Generate");
    await t.main().getByRole("radio", { name: "Separated line" }).check({ force: true });
    await t.page.waitForTimeout(60);
    const out = () => t.page.locator("#wc-output").inputValue();
    t.assert.equal((await out()).split(",").length, 3);
    await t.main().getByRole("checkbox", { name: "Spaces after separators" }).check({ force: true });
    await t.page.waitForTimeout(60);
    t.assert.equal((await out()).split(", ").length, 3);
    await t.page.locator("#wc-sep").selectOption("custom");
    await t.page.locator("#wc-custom-sep").fill("|");
    await t.page.waitForTimeout(60);
    t.assert.equal((await out()).split("| ").length, 3);
    await t.main().getByRole("radio", { name: "One per line" }).check({ force: true });
    await t.page.waitForTimeout(60);
    t.assert.equal((await out()).split("\n").length, 3);
  } },
  { slug: "word-code-generator", name: "word code selection, extra words, and errors", async run(t) {
    await t.open();
    await t.page.waitForTimeout(300);
    await t.main().getByText("Word selection").first().click();
    await t.page.waitForTimeout(100);
    await t.click("Clear selection");
    await t.click("Generate");
    await t.has("Select at least one category");
    t.assert.equal(await t.page.locator("#wc-output").count(), 0);
    await t.page.locator("#wc-extra-words").fill("sunflower, moonbeam\nsunflower");
    await t.page.locator("#wc-results").fill("2");
    await t.main().getByRole("checkbox", { name: "Allow words to repeat" }).uncheck({ force: true });
    await t.click("Generate");
    const words = (await t.page.locator("#wc-output").inputValue()).split("\n").map((l) => l.replace(/\d+$/, "")).sort();
    t.assert.deepEqual(words, ["moonbeam", "sunflower"]);
    await t.page.locator("#wc-results").fill("3");
    await t.click("Generate");
    await t.has("requested count exceeds");
    t.assert.equal(await t.page.locator("#wc-output").count(), 0);
    await t.page.locator("#wc-results").fill("5000");
    await t.main().getByRole("checkbox", { name: "Allow words to repeat" }).check({ force: true });
    await t.click("Generate");
    t.assert.equal(await t.page.locator("#wc-results").inputValue(), "1000");
    t.assert.equal((await t.page.locator("#wc-output").inputValue()).split("\n").length, 1000);
    await t.page.locator("#wc-digits").fill("99");
    await t.click("Generate");
    t.assert.equal(await t.page.locator("#wc-digits").inputValue(), "8");
    t.assert.match((await t.page.locator("#wc-output").inputValue()).split("\n")[0], /\d{8}$/);
  } },
  { slug: "word-code-generator", name: "word code length filter", async run(t) {
    await t.open();
    await t.page.waitForTimeout(300);
    await t.main().getByLabel("Maximum Word length").fill("4");
    await t.page.waitForTimeout(60);
    await t.click("Generate");
    for (const l of (await t.page.locator("#wc-output").inputValue()).split("\n")) t.assert.ok(l.replace(/\d+$/, "").length <= 4, l);
    await t.has("up to 4 letters");
    await t.main().getByLabel("Minimum Word length").fill("4");
    await t.page.waitForTimeout(60);
    await t.click("Generate");
    for (const l of (await t.page.locator("#wc-output").inputValue()).split("\n")) t.assert.equal(l.replace(/\d+$/, "").length, 4, l);
    await t.click("Reset word length");
    await t.hasNot("up to 4 letters");
  } },
  { slug: "word-code-generator", name: "word code mobile layout", viewport: mobile, async run(t) { await t.open(); await t.page.waitForTimeout(300); await t.click("Generate"); await t.noOverflow(); await t.main().getByRole("radio", { name: "Separated line" }).check({ force: true }); await t.page.waitForTimeout(60); await t.noOverflow(); } },
];
