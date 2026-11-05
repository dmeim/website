import crypto from "node:crypto";
const nodeHotp = (keyAscii, counter) => {
  const buf = Buffer.alloc(8); buf.writeBigUInt64BE(BigInt(counter));
  const h = crypto.createHmac("sha1", Buffer.from(keyAscii)).update(buf).digest();
  const o = h[19] & 0xf;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1000000).padStart(6, "0");
};
const seg = (o) => Buffer.from(JSON.stringify(o), "utf8").toString("base64url");
const SL = "https://aus01.safelinks.protection.outlook.com/?url=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dsafelink%26rlz%3D1&data=05%7C02%7C%7C1ed07253975b46da1d1508dc3443752a%7C84df9e7fe9f640afb435aaaaaaaaaaaa%7C1%7C0%7C638442711583216725%7CUnknown%7CTWFpbGZsb3d8eyJWIjoiMC4wLjAwMDAiLCJQIjoiV2luMzIiLCJBTiI6Ik1haWwiLCJXVCI6Mn0%3D%7C0%7C%7C%7C&sdata=%2BQY0HBnnxfI7pzZoxzlhZdDvYu80LwQB0zUUjrffVnk%3D&reserved=0";
const mobile = { width: 375, height: 800 };
const JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
const overflow = (slug, extra) => ({ slug, name: "no overflow at 375", viewport: mobile, async run(t) { await t.open(); if (extra) await extra(t); await t.noOverflow(); } });
const copyIn = async (t, label) => { await t.field(label).locator("xpath=ancestor::*[contains(concat(' ',@class,' '),' ui-field ')][1]").getByRole("button", { name: /copy/i }).first().click(); await t.page.waitForTimeout(80); return t.clipboard(); };
const freezeClock = (t, ms) => t.page.addInitScript((m) => { Date.now = () => m; }, ms);

export default [
  // url-encoder
  { slug: "url-encoder", name: "defaults and vectors", async run(t) {
    await t.open();
    t.assert.equal(await t.value("Your string encoded"), "Hello%20world%20%3A)");
    t.assert.equal(await t.value("Your string decoded"), "Hello world :)");
    await t.fill("Your string", "a b&c=d/é😀", { exact: true });
    t.assert.equal(await t.value("Your string encoded"), encodeURIComponent("a b&c=d/é😀"));
    await t.fill("Your encoded string", "%F0%9F%98%80%20x");
    t.assert.equal(await t.value("Your string decoded"), "😀 x");
    t.assert.equal(await copyIn(t, "Your string decoded"), "😀 x");
  } },
  { slug: "url-encoder", name: "invalid and empty", async run(t) {
    await t.open();
    await t.fill("Your encoded string", "100%");
    await t.has("percent sequence");
    t.assert.equal(await t.value("Your string decoded"), "");
    await t.fill("Your encoded string", "%E0%A4%A");
    await t.has("percent sequence");
    await t.fill("Your encoded string", "");
    await t.hasNot("percent sequence");
    await t.fill("Your string", "", { exact: true });
    t.assert.equal(await t.value("Your string encoded"), "");
  } },
  overflow("url-encoder"),
  // html-entities
  { slug: "html-entities", name: "vectors", async run(t) {
    await t.open();
    t.assert.equal(await t.value("Your string escaped"), "&lt;title&gt;IT Tool&lt;/title&gt;");
    t.assert.equal(await t.value("Your string unescaped"), "<title>IT Tool</title>");
    await t.fill("Your string", `<a href="x">Tom & 'J'</a>`, { exact: true });
    t.assert.equal(await t.value("Your string escaped"), "&lt;a href=&quot;x&quot;&gt;Tom &amp; &#39;J&#39;&lt;/a&gt;");
    await t.fill("Your escaped string", "&amp;lt; &quot;x&quot; &#39; &nope;");
    t.assert.equal(await t.value("Your string unescaped"), `&lt; "x" ' &nope;`);
    t.assert.equal(await copyIn(t, "Your string unescaped"), `&lt; "x" ' &nope;`);
    await t.fill("Your string", "", { exact: true });
    t.assert.equal(await t.value("Your string escaped"), "");
  } },
  overflow("html-entities"),
  // url-parser
  { slug: "url-parser", name: "default splits every part", async run(t) {
    await t.open();
    const txt = await t.text();
    for (const v of ["https:", "me", "pwd", "it-tools.tech", "3000", "/url-parser", "?key1=value&key2=value2", "#the-hash", "key1", "value2"]) t.assert.ok(txt.includes(v), v);
  } },
  { slug: "url-parser", name: "repeated params and copy", async run(t) {
    await t.open();
    await t.fill("Your URL to parse", "http://example.com/p?a=1&b=caf%C3%A9&a=3");
    const table = t.main().getByRole("table");
    const rows = (await table.locator("tbody tr").allInnerTexts()).map((r) => r.replace(/\s+/g, " ").trim());
    t.assert.deepEqual(rows, ["a 1", "b café", "a 3"]);
    await table.getByRole("button", { name: "Copy parameter name b" }).click();
    t.assert.equal(await t.clipboard(), "b");
    await table.getByRole("button", { name: "Copy value of b" }).click();
    await t.page.waitForTimeout(80);
    t.assert.equal(await t.clipboard(), "café");
  } },
  { slug: "url-parser", name: "invalid and empty", async run(t) {
    await t.open();
    await t.fill("Your URL to parse", "not a url");
    await t.has("not a valid URL");
    await t.hasNot("it-tools.tech");
    await t.fill("Your URL to parse", "");
    await t.hasNot("not a valid URL");
  } },
  overflow("url-parser", async (t) => { await t.fill("Your URL to parse", "https://example.com/" + "a".repeat(300) + "?k=" + "b".repeat(300)); }),
  // device-information
  { slug: "device-information", name: "matches navigator and window", async run(t) {
    await t.open();
    const env = await t.page.evaluate(() => ({ ua: navigator.userAgent, w: innerWidth, h: innerHeight, sw: screen.availWidth, sh: screen.availHeight, dpr: devicePixelRatio, depth: screen.colorDepth, langs: navigator.languages.join(", ") }));
    for (const v of [env.ua, `${env.w} x ${env.h}`, `${env.sw} x ${env.sh}`, `${env.dpr} dppx`, `${env.depth} bits`, env.langs]) await t.has(v);
    await t.page.setViewportSize({ width: 900, height: 600 });
    await t.page.waitForTimeout(150);
    await t.has("900 x 600");
  } },
  overflow("device-information"),
  // basic auth
  { slug: "basic-auth-generator", name: "RFC 7617 vectors", async run(t) {
    await t.open();
    await t.fill("Username", "Aladdin");
    await t.fill("Password", "open sesame", { exact: true });
    t.assert.equal(await t.value("Authorization header"), "Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==");
    t.assert.equal(await copyIn(t, "Authorization header"), "Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==");
    await t.fill("Username", "test");
    await t.fill("Password", "123£", { exact: true });
    t.assert.equal(await t.value("Authorization header"), "Authorization: Basic dGVzdDoxMjPCow==");
    await t.fill("Username", "a:b");
    await t.has("can't contain a colon");
    await t.fill("Username", "");
    await t.fill("Password", "", { exact: true });
    await t.hasNot("colon");
    t.assert.equal(await t.value("Authorization header"), "Authorization: Basic Og==");
  } },
  overflow("basic-auth-generator"),
  // og meta
  { slug: "og-meta-generator", name: "escapes, twitter copies, parses back", async run(t) {
    await t.open();
    const tricky = `Tom & "Jerry" <b>`;
    await t.fill("Title", tricky);
    await t.fill("Image url", "https://x.test/a.png?b=1&c=2");
    const html = await t.value("Generated HTML");
    const parsed = await t.page.evaluate((h) => [...new DOMParser().parseFromString(h, "text/html").querySelectorAll("meta")].map((m) => [m.getAttribute("property") || m.getAttribute("name"), m.content]), html);
    const map = Object.fromEntries(parsed);
    t.assert.equal(map["og:title"], tricky);
    t.assert.equal(map["twitter:title"], tricky);
    t.assert.equal(map["og:type"], "website");
    t.assert.equal(map["twitter:card"], "summary_large_image");
    t.assert.equal(map["og:image"], "https://x.test/a.png?b=1&c=2");
    t.assert.equal(map["twitter:image"], "https://x.test/a.png?b=1&c=2");
    await t.click("Copy meta tags");
    t.assert.equal(await t.clipboard(), html);
  } },
  { slug: "og-meta-generator", name: "type switch, multi fields, reorder, card", async run(t) {
    await t.open();
    await t.field("Page type").selectOption("video.movie");
    await t.fill("Actor 1", "Alice");
    await t.click("Add actor");
    await t.fill("Actor 2", "Bob");
    let html = await t.value("Generated HTML");
    t.assert.ok(html.indexOf('og:video:actor" content="Alice"') < html.indexOf('og:video:actor" content="Bob"') && html.includes('content="Bob"'));
    t.assert.ok(html.includes('property="og:type" content="video.movie"'));
    await t.click("Move Actor 2 up");
    html = await t.value("Generated HTML");
    t.assert.ok(html.indexOf('content="Bob"') < html.indexOf('content="Alice"'));
    t.assert.equal(await t.main().getByRole("button", { name: "Move Actor 1 up" }).isDisabled(), true);
    await t.click("Remove Actor 1");
    html = await t.value("Generated HTML");
    t.assert.ok(!html.includes("Bob") && html.includes("Alice"));
    await t.field("Page type").selectOption("article");
    html = await t.value("Generated HTML");
    t.assert.ok(!html.includes("Alice"), "previous schema values cleared");
    await t.field("Card type").selectOption("player");
    t.assert.ok((await t.value("Generated HTML")).includes('name="twitter:card" content="player"'));
  } },
  overflow("og-meta-generator", async (t) => { await t.field("Page type").selectOption("video.movie"); }),
  // otp
  { slug: "otp-generator", name: "it-tools e2e vector with frozen clock", async run(t) {
    await freezeClock(t, 1609477200000);
    await t.open();
    await t.fill("Secret", "ITTOOLS", { exact: true });
    await t.page.waitForTimeout(400);
    t.assert.equal(await t.value("Secret in hexadecimal"), "44e6e72e");
    const txt = await t.text();
    for (const c of ["918365", "885809", "556793"]) t.assert.ok(txt.includes(c), c);
    t.assert.equal(await t.value("Epoch (seconds)"), "1609477200");
    t.assert.equal(await t.value("Iteration count"), String(Math.floor(1609477200 / 30)));
    t.assert.equal(await t.value("Padded hex counter"), Math.floor(1609477200 / 30).toString(16).padStart(16, "0"));
    t.assert.equal(await copyIn(t, "Epoch (seconds)"), "1609477200");
  } },
  { slug: "otp-generator", name: "RFC 6238 key against node crypto", async run(t) {
    const sec = 1234567890;
    await freezeClock(t, sec * 1000);
    await t.open();
    await t.fill("Secret", "gezd gnbv gy3t qojq gezd gnbv gy3t qojq", { exact: true });
    await t.page.waitForTimeout(400);
    const txt = await t.text();
    const c = Math.floor(sec / 30);
    t.assert.equal(nodeHotp("12345678901234567890", c), "005924");
    for (const code of [nodeHotp("12345678901234567890", c - 1), "005924", nodeHotp("12345678901234567890", c + 1)]) t.assert.ok(txt.includes(code), code);
    t.assert.equal(await t.value("Secret in hexadecimal"), Buffer.from("12345678901234567890").toString("hex"));
    await t.click("Copy current OTP");
    t.assert.equal(await t.clipboard(), "005924");
    await t.fill("Secret", "MZXW6===", { exact: true });
    await t.page.waitForTimeout(400);
    t.assert.ok((await t.text()).includes(nodeHotp("foo", c)), "padded secret matches the decoded key");
  } },
  { slug: "otp-generator", name: "key URI and QR decode to the same value", async run(t) {
    await t.open();
    await t.fill("Secret", "jbswy3dpehpk3pxp", { exact: true });
    await t.page.waitForTimeout(300);
    const expected = "otpauth://totp/dmeim.com:demo-user?issuer=dmeim.com&secret=JBSWY3DPEHPK3PXP&algorithm=SHA1&digits=6&period=30";
    t.assert.equal(await t.main().getByRole("link", { name: "Open key URI" }).getAttribute("href"), expected);
    await t.click("Copy key URI");
    t.assert.equal(await t.clipboard(), expected);
    const src = await t.main().getByRole("img", { name: /QR code/ }).getAttribute("src");
    t.assert.ok(src.startsWith("data:image/png"));
    const decoded = await t.page.evaluate(async (s) => {
      if (!("BarcodeDetector" in window)) return "no-detector";
      const img = new Image(); img.src = s; await img.decode();
      const r = await new BarcodeDetector({ formats: ["qr_code"] }).detect(img);
      return r[0]?.rawValue ?? "no-code";
    }, src);
    if (decoded !== "no-detector") t.assert.equal(decoded, expected);
  } },
  { slug: "otp-generator", name: "invalid, empty, refresh, long secret", async run(t) {
    await t.open();
    const first = await t.value("Secret", { exact: true });
    t.assert.match(first, /^[A-Z2-7]{16}$/);
    await t.click("Generate a new random secret");
    t.assert.notEqual(await t.value("Secret", { exact: true }), first);
    await t.fill("Secret", "hello!", { exact: true });
    await t.has("should be a Base32 string");
    t.assert.equal(await t.value("Secret in hexadecimal"), "");
    await t.hasNot("Copied");
    t.assert.equal(await t.main().getByRole("img", { name: /QR code/ }).count(), 0);
    await t.fill("Secret", "", { exact: true });
    await t.hasNot("should be a Base32 string");
    await t.has("once you enter a valid secret");
    await t.fill("Secret", "A".repeat(5000), { exact: true });
    await t.page.waitForTimeout(300);
    await t.has("too long to fit");
    await t.fill("Secret", "MZXW6===", { exact: true });
    await t.page.waitForTimeout(200);
    t.assert.ok((await t.value("Secret in hexadecimal")).startsWith(Buffer.from("foo").toString("hex")));
    t.assert.equal(await t.main().getByRole("link", { name: "Open key URI" }).getAttribute("href"), "otpauth://totp/dmeim.com:demo-user?issuer=dmeim.com&secret=MZXW6&algorithm=SHA1&digits=6&period=30");
  } },
  { slug: "otp-generator", name: "slow human clicks land despite the ticking clock", async run(t) {
    await t.open();
    const slowClick = async (name) => {
      const btn = t.main().getByRole("button", { name }).first();
      await btn.scrollIntoViewIfNeeded();
      const box = await btn.boundingBox();
      await t.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await t.page.mouse.down();
      await t.page.waitForTimeout(600);
      await t.page.mouse.up();
      await t.page.waitForTimeout(120);
    };
    for (let i = 0; i < 3; i++) {
      const before = await t.value("Secret", { exact: true });
      await slowClick("Generate a new random secret");
      t.assert.notEqual(await t.value("Secret", { exact: true }), before, "refresh click " + i);
    }
    await t.page.evaluate(() => navigator.clipboard.writeText("sentinel"));
    await slowClick("Copy key URI");
    t.assert.ok((await t.clipboard()).startsWith("otpauth://totp/"), "copy click");
  } },
  overflow("otp-generator"),
  // mime
  { slug: "mime-types", name: "lookups, typing, unknown, filter", async run(t) {
    await t.open();
    await t.fill("MIME type", "application/pdf", { exact: true });
    await t.has("Extensions of files with the");
    t.assert.ok((await t.text()).includes(".pdf"));
    await t.fill("MIME type", "application/nope", { exact: true });
    await t.has("No extensions are known");
    await t.hasNot("Extensions of files with the");
    await t.fill("MIME type", "", { exact: true });
    await t.hasNot("No extensions are known");
    await t.fill("File extension", ".PNG", { exact: true });
    await t.has("image/png");
    await t.has("MIME type associated with the");
    await t.fill("File extension", "constructor", { exact: true });
    await t.has("This extension is not in the list");
    t.assert.equal(await t.page.locator("#mime-type-options option").count() > 500, true);
    t.assert.equal(await t.page.locator("#mime-extension-options option[value='.pdf']").count(), 1);
    await t.fill("Filter by MIME type or extension", "application/pdf");
    t.assert.equal(await t.main().locator("tbody tr").count(), 1);
    await t.fill("Filter by MIME type or extension", "zzzznope");
    await t.has("No MIME types match this filter");
  } },
  overflow("mime-types"),
  // jwt
  { slug: "jwt-parser", name: "known token", async run(t) {
    await t.open();
    const txt = await t.text();
    for (const v of ["HS256", "HMAC using SHA-256", "JWT", "1234567890", "John Doe", "1516239022", "Issued At", "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"]) t.assert.ok(txt.includes(v), v);
    const friendly = await t.page.evaluate(() => { const d = new Date(1516239022000); return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`; });
    t.assert.ok(txt.includes(friendly), friendly);
  } },
  { slug: "jwt-parser", name: "unicode, nested, odd claims", async run(t) {
    await t.open();
    await t.fill("JWT to decode", `  ${seg({ alg: "ES256", typ: "JWT" })}.${seg({ name: "José 日本語 😀", roles: ["a", "b"], nothing: null, constructor: "c", exp: "soon" })}.\n`);
    const txt = await t.text();
    for (const v of ["ECDSA using P-256 and SHA-256", "José 日本語 😀", '"a"', "nothing", "(empty)"]) t.assert.ok(txt.includes(v), v);
    await t.hasNot("native code");
    await t.hasNot("Invalid Date");
  } },
  { slug: "jwt-parser", name: "malformed tokens and empty", async run(t) {
    await t.open();
    for (const bad of ["not.a.jwt", "only-one-part", "@@@.@@@.@@@", `${seg([1])}.${seg({})}.x`, `${Buffer.from("{bad").toString("base64url")}.${seg({})}.x`]) {
      await t.fill("JWT to decode", bad);
      await t.has("not a valid JWT");
      await t.hasNot("Payload");
    }
    await t.fill("JWT to decode", "");
    await t.hasNot("not a valid JWT");
    await t.hasNot("Payload");
    await t.fill("JWT to decode", JWT);
    await t.has("John Doe");
  } },
  overflow("jwt-parser", async (t) => { await t.fill("JWT to decode", `${seg({ alg: "none" })}.${seg({ long: "x".repeat(500), nested: { a: "y".repeat(300) } })}.${"z".repeat(400)}`); }),
  // keycode
  { slug: "keycode-info", name: "keys, modifiers, location, copy", async run(t) {
    await t.open();
    t.assert.equal(await t.main().getByLabel("Key event fields").count(), 0);
    await t.page.keyboard.press("a");
    await t.page.waitForTimeout(80);
    let txt = await t.text();
    for (const v of ["65", "KeyA", "None"]) t.assert.ok(txt.includes(v), v);
    await t.page.keyboard.press("Space");
    await t.page.waitForTimeout(80);
    txt = await t.text();
    t.assert.ok(txt.includes("Space") && txt.includes("32"));
    await t.page.keyboard.down("Shift");
    await t.page.waitForTimeout(80);
    txt = await t.text();
    t.assert.ok(txt.includes("ShiftLeft") && txt.includes("16"));
    await t.page.keyboard.press("KeyB");
    await t.page.keyboard.up("Shift");
    await t.page.waitForTimeout(80);
    txt = await t.text();
    t.assert.ok(txt.includes("KeyB") && txt.includes("66"));
    t.assert.ok(/Modifiers\s*Shift/.test(txt), txt);
    await t.main().getByRole("button", { name: "Copy Code" }).click();
    t.assert.equal(await t.clipboard(), "KeyB");
    await t.page.keyboard.press("Numpad1");
    await t.page.waitForTimeout(80);
    t.assert.ok(/Location\s*3/.test(await t.text()));
  } },
  overflow("keycode-info", async (t) => { await t.page.keyboard.press("Enter"); await t.page.waitForTimeout(80); }),
  // slugify
  { slug: "slugify-string", name: "vectors, empty, copy", async run(t) {
    await t.open();
    t.assert.equal(await t.value("Your slug"), "");
    await t.fill("Your string to slugify", "Héllo Wörld & Co");
    t.assert.equal(await t.value("Your slug"), "hello-woerld-and-co");
    await t.fill("Your string to slugify", "My file path");
    t.assert.equal(await t.value("Your slug"), "my-file-path");
    await t.fill("Your string to slugify", "fooBar 123 $#%");
    t.assert.equal(await t.value("Your slug"), "foo-bar-123");
    await t.fill("Your string to slugify", "😀 Déjà Vu!");
    t.assert.equal(await t.value("Your slug"), "deja-vu");
    t.assert.equal(await copyIn(t, "Your slug"), "deja-vu");
    await t.fill("Your string to slugify", "");
    t.assert.equal(await t.value("Your slug"), "");
  } },
  overflow("slugify-string"),
  // wysiwyg
  { slug: "html-wysiwyg-editor", name: "every toolbar button", async run(t) {
    await t.open();
    await t.page.evaluate(() => localStorage.removeItem("html-wysiwyg-editor--html"));
    await t.open();
    t.assert.equal(await t.value("Source", { exact: true }), "<h1>Hey!</h1>\n<p>Welcome to this html wysiwyg editor</p>");
    const ed = t.main().locator(".tiptap");
    const para = ed.locator("p").first();
    const selectPara = async () => { await para.click(); await t.page.keyboard.press("ControlOrMeta+a"); };
    const src = () => t.value("Source", { exact: true });
    const settle = () => t.page.waitForTimeout(120);
    const reset = async (text) => { await settle(); await ed.click(); await settle(); await t.page.keyboard.press("ControlOrMeta+a"); await t.page.keyboard.press("Backspace"); await t.click("Clear format"); await settle(); await t.page.keyboard.type(text); await settle(); await t.page.keyboard.press("ControlOrMeta+a"); await settle(); };
    const marks = [["Bold", "<strong>word</strong>"], ["Italic", "<em>word</em>"], ["Strike", "<s>word</s>"], ["Inline code", "<code>word</code>"]];
    for (const [name, out] of marks) {
      await reset("word");
      await t.click(name);
      t.assert.ok((await src()).includes(out), `${name}: ${await src()}`);
      t.assert.equal(await t.main().getByRole("button", { name, exact: true }).getAttribute("aria-pressed"), "true", name);
      await t.click(name);
      t.assert.ok(!(await src()).includes(out), `${name} toggles off`);
    }
    for (const n of [1, 2, 3, 4]) {
      await reset("word");
      await t.click(`Heading ${n}`);
      t.assert.ok((await src()).includes(`<h${n}>word</h${n}>`), `h${n}: ${await src()}`);
      await t.click(`Heading ${n}`);
    }
    await reset("word");
    await t.click("Bullet list");
    t.assert.ok(/<ul>\s*<li>\s*<p>word<\/p>\s*<\/li>\s*<\/ul>/.test(await src()), await src());
    t.assert.notEqual(await ed.locator("ul").evaluate((n) => getComputedStyle(n).listStyleType), "none", "bullets visible");
    await t.click("Bullet list");
    await reset("word");
    await t.click("Ordered list");
    t.assert.ok(/<ol>\s*<li>\s*<p>word<\/p>/.test(await src()), await src());
    t.assert.notEqual(await ed.locator("ol").evaluate((n) => getComputedStyle(n).listStyleType), "none", "numbers visible");
    await t.click("Ordered list");
    await reset("word");
    await t.click("Blockquote");
    t.assert.ok(/<blockquote>\s*<p>word<\/p>\s*<\/blockquote>/.test(await src()), await src());
    await t.click("Blockquote");
    await reset("one");
    await t.click("Code block");
    await t.page.keyboard.press("ArrowLeft");
    await t.page.keyboard.press("ArrowRight", { delay: 10 });
    await t.page.keyboard.press("ArrowRight");
    await t.page.keyboard.press("ArrowRight");
    await t.page.keyboard.press("Enter");
    await t.page.keyboard.type("    two");
    t.assert.ok(/<pre><code>[^<]*\n {4}two[^<]*<\/code><\/pre>/.test(await src()), `pre keeps whitespace: ${await src()}`);
    await reset("ab");
    await t.page.keyboard.press("ArrowLeft");
    await t.page.keyboard.press("ArrowRight");
    await t.page.keyboard.press("ArrowLeft");
    await t.click("Hard break");
    t.assert.ok((await src()).includes("<br"), await src());
    await reset("word");
    await t.click("Bold");
    await t.click("Heading 2");
    await t.click("Clear format");
    t.assert.ok((await src()).startsWith("<p>word</p>"), await src());
    t.assert.ok(!(await src()).includes("<strong>") && !(await src()).includes("<h2>"), await src());
    await t.click("Bold");
    t.assert.ok((await src()).startsWith("<p><strong>word</strong></p>"), await src());
    await t.click("Undo");
    t.assert.ok((await src()).startsWith("<p>word</p>"), await src());
    await t.click("Redo");
    t.assert.ok((await src()).startsWith("<p><strong>word</strong></p>"), await src());
    const html = await src();
    await t.click("Copy HTML");
    t.assert.equal(await t.clipboard(), html);
  } },
  { slug: "html-wysiwyg-editor", name: "document survives reload", async run(t) {
    await t.open();
    const ed = t.main().locator(".tiptap");
    await ed.click();
    await t.page.keyboard.press("ControlOrMeta+a");
    await t.page.keyboard.type("Persist é😀 me");
    await t.page.keyboard.press("ControlOrMeta+a");
    await t.click("Italic");
    await t.open();
    t.assert.equal(await t.value("Source", { exact: true }), "<p><em>Persist é😀 me</em></p>");
    await t.main().locator(".tiptap").click();
    await t.page.keyboard.press("ControlOrMeta+a");
    await t.page.keyboard.press("Backspace");
    t.assert.equal(await t.value("Source", { exact: true }), "");
    await t.open();
    t.assert.equal(await t.value("Source", { exact: true }), "");
  } },
  overflow("html-wysiwyg-editor"),
  // user-agent
  { slug: "user-agent-parser", name: "own UA, known UAs, clear", async run(t) {
    await t.open();
    t.assert.equal(await t.value("User agent string"), await t.page.evaluate(() => navigator.userAgent));
    await t.fill("User agent string", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
    let txt = await t.text();
    for (const v of ["Chrome", "120.0.0.0", "Blink", "Windows", "amd64", "No device model available"]) t.assert.ok(txt.includes(v), v);
    await t.fill("User agent string", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1");
    txt = await t.text();
    for (const v of ["Mobile Safari", "17.1", "WebKit", "iOS", "iPhone", "Apple", "mobile"]) t.assert.ok(txt.includes(v), v);
    await t.fill("User agent string", "garbage");
    await t.has("No browser name available");
    await t.main().getByRole("button", { name: "Clear", exact: true }).click();
    t.assert.equal(await t.value("User agent string"), "");
    for (const v of ["No browser name available", "No engine name available", "No OS name available", "No device type available", "No CPU architecture available"]) await t.has(v);
  } },
  overflow("user-agent-parser"),
  // http status
  { slug: "http-status-codes", name: "search", async run(t) {
    await t.open();
    const txt = await t.text();
    for (const v of ["1xx informational response", "5xx server error", "418", "I'm a teapot", "For WebDAV."]) t.assert.ok(txt.toLowerCase().includes(v.toLowerCase()), v);
    const field = t.main().getByRole("searchbox").or(t.main().getByLabel(/Search HTTP status/)).first();
    await field.fill("404");
    await t.page.waitForTimeout(100);
    await t.has("Not Found");
    await t.has("Search results");
    await t.hasNot("Bad Gateway");
    await field.fill("forbiden");
    await t.page.waitForTimeout(100);
    await t.has("Forbidden");
    await field.fill("zzzzqqq");
    await t.page.waitForTimeout(100);
    await t.has("No status codes match this search");
    await field.fill("");
    await t.page.waitForTimeout(100);
    await t.has("Bad Gateway");
  } },
  overflow("http-status-codes"),
  // json-diff
  { slug: "json-diff", name: "it-tools e2e vectors", async run(t) {
    await t.open();
    t.assert.equal(await t.main().getByTestId("diff-result").count(), 0);
    await t.fill("Your first JSON", '{"foo":"bar"}');
    await t.fill("Your JSON to compare", '{   "foo":  "bar" }  ');
    await t.has("The provided JSONs are the same");
    await t.fill("Your JSON to compare", '{"foo":"buz","baz":"qux"}');
    let r = await t.main().getByTestId("diff-result").innerText();
    t.assert.ok(r.replace(/\s+/g, " ").includes('foo: "bar" "buz" , baz: "qux" , }') || r.includes('{\nfoo: "bar""buz",\nbaz: "qux",\n},'), r);
    await t.fill("Your JSON to compare", '{"foo":"bar","baz":"qux"}');
    r = await t.main().getByTestId("diff-result").innerText();
    t.assert.ok(r.includes("foo"), r);
    await t.main().getByRole("switch", { name: "Only show differences" }).or(t.main().getByLabel("Only show differences")).first().click();
    r = await t.main().getByTestId("diff-result").innerText();
    t.assert.ok(!r.includes("foo") && r.includes("baz"), r);
    await t.main().getByRole("button", { name: '"qux"' }).click();
    t.assert.equal(await t.clipboard(), '"qux"');
    await t.has("Value copied.");
    await t.page.waitForTimeout(2800);
    await t.hasNot("Value copied.");
  } },
  { slug: "json-diff", name: "invalid, JSON5, nesting, type change, key order", async run(t) {
    await t.open();
    await t.fill("Your first JSON", "{oops");
    await t.fill("Your JSON to compare", "{}");
    await t.has("Invalid JSON format");
    t.assert.equal(await t.main().getByTestId("diff-result").count(), 0);
    await t.fill("Your first JSON", "{a: 1, b: [1, 2,], c: {d: 'x'},}");
    await t.fill("Your JSON to compare", '{"b":[1,3,4],"c":"flat","a":1}');
    await t.hasNot("Invalid JSON format");
    const r = await t.main().getByTestId("diff-result").innerText();
    t.assert.ok(r.includes("a: 1"), r);
    t.assert.ok(r.includes('{"d":"x"}') && r.includes('"flat"'), r);
    await t.fill("Your first JSON", '{"x":1,"y":[{"z":0}]}');
    await t.fill("Your JSON to compare", '{"y":[{"z":-0}],"x":1}');
    await t.has("The provided JSONs are the same");
    await t.fill("Your first JSON", "null");
    await t.fill("Your JSON to compare", "0");
    t.assert.equal((await t.main().getByTestId("diff-result").innerText()).replace(/\s+/g, ""), "null0,");
    await t.fill("Your first JSON", "");
    await t.hasNot("Invalid JSON format");
    t.assert.equal(await t.main().getByTestId("diff-result").count(), 0);
  } },
  overflow("json-diff", async (t) => { await t.fill("Your first JSON", '{"a":"' + "x".repeat(400) + '"}'); await t.fill("Your JSON to compare", '{"a":"' + "y".repeat(400) + '"}'); }),
  // safelink
  { slug: "safelink-decoder", name: "real-format links", async run(t) {
    await t.open();
    t.assert.equal(await t.value("Output decoded URL"), "");
    await t.hasNot("not an Outlook SafeLink");
    await t.fill("Your Outlook SafeLink URL", SL);
    t.assert.equal(await t.value("Output decoded URL"), "https://www.google.com/search?q=safelink&rlz=1");
    t.assert.equal(await copyIn(t, "Output decoded URL"), "https://www.google.com/search?q=safelink&rlz=1");
    await t.fill("Your Outlook SafeLink URL", SL.replace(/&/g, "&amp;"));
    t.assert.equal(await t.value("Output decoded URL"), "https://www.google.com/search?q=safelink&rlz=1");
    await t.fill("Your Outlook SafeLink URL", "  https://nam12.safelinks.protection.outlook.com/?data=05&amp;url=https%3A%2F%2Fexample.com%2F%C3%A9%3Fa%3D1&amp;reserved=0\n");
    t.assert.equal(await t.value("Output decoded URL"), "https://example.com/é?a=1");
    await t.fill("Your Outlook SafeLink URL", "eur03.safelinks.protection.outlook.com/?url=https%3A%2F%2Fexample.org");
    t.assert.equal(await t.value("Output decoded URL"), "https://example.org");
  } },
  { slug: "safelink-decoder", name: "non-SafeLink input clears output", async run(t) {
    await t.open();
    await t.fill("Your Outlook SafeLink URL", SL);
    for (const bad of ["https://google.com", "not a url", "https://evil.example/?x=.safelinks.protection.outlook.com&url=https%3A%2F%2Fx.com"]) {
      await t.fill("Your Outlook SafeLink URL", bad);
      await t.has("not an Outlook SafeLink");
      t.assert.equal(await t.value("Output decoded URL"), "");
    }
    await t.fill("Your Outlook SafeLink URL", "https://aus01.safelinks.protection.outlook.com/?data=1");
    await t.has("no url parameter");
    await t.fill("Your Outlook SafeLink URL", "");
    await t.hasNot("no url parameter");
  } },
  overflow("safelink-decoder", async (t) => { await t.fill("Your Outlook SafeLink URL", SL); }),
];
