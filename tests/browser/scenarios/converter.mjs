import { createHash } from "node:crypto";
import fs from "node:fs";
const P375 = { viewport: { width: 375, height: 800 } };
// A real 1x1 PNG. Expected bytes come from a fixed vector, not from the tool.
const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg==";

const copyOf = async (t, label) => {
  // Icon copy buttons live beside each output, named "Copy" something.
  const box = t.main().locator(".ui-field, .ui-key-value__row, [class*=field]").filter({ has: t.page.getByLabel(label, { exact: true }) }).first();
  await box.getByRole("button").first().click();
  await t.page.waitForTimeout(120);
  return t.clipboard();
};

const kv = async (t, label) => {
  return t.page.evaluate((lab) => {
    const dts = [...document.querySelectorAll("main dt")];
    const dt = dts.find((d) => d.innerText.trim().replace(/:$/, "") === lab);
    if (!dt) return null;
    const dd = dt.nextElementSibling;
    return dd.querySelector("input,textarea")?.value ?? dd.innerText.trim();
  }, label);
};
const kvCopy = async (t, label) => {
  const clicked = await t.page.evaluate((lab) => {
    const dt = [...document.querySelectorAll("main dt")].find((d) => d.innerText.trim() === lab);
    const btn = dt?.parentElement.querySelector("button") ?? dt?.nextElementSibling?.querySelector("button");
    if (!btn) return false;
    btn.click();
    return true;
  }, label);
  t.assert.ok(clicked, `no copy button for ${label}`);
  await t.page.waitForTimeout(120);
  return t.clipboard();
};

const dt = "date-converter";
const bc = "base-converter";
const rn = "roman-numeral-converter";
const bs = "base64-string-converter";
const bf = "base64-file-converter";
const cc = "color-converter";
const cs = "case-converter";
const na = "text-to-nato-alphabet";
const tb = "text-to-binary";
const tu = "text-to-unicode";

/** A plain TransformPanel tool: typical, invalid, empty, copy, narrow. */
const transform = ({ slug, inLabel, outLabel, input, expected, bad, badMessage, initial = "", extra = [] }) => [
  { slug, name: "converts", async run(t) {
    await t.open();
    t.assert.equal(await t.value(inLabel), initial);
    await t.fill(inLabel, input);
    t.assert.equal((await t.value(outLabel)).trim(), expected.trim());
    await t.hasNot("not valid");
  } },
  { slug, name: "invalid shows a message and no stale output", async run(t) {
    await t.open();
    await t.fill(inLabel, input);
    await t.fill(inLabel, bad);
    await t.has(badMessage);
    t.assert.equal(await t.value(outLabel), "");
  } },
  { slug, name: "empty and blank are clean", async run(t) {
    await t.open();
    for (const blank of ["", "  \n  "]) {
      await t.fill(inLabel, blank);
      t.assert.equal(await t.value(outLabel), "", `output for ${JSON.stringify(blank)}`);
      await t.hasNot("not valid");
      await t.hasNot("Invalid");
    }
  } },
  { slug, name: "copy", async run(t) {
    await t.open();
    await t.fill(inLabel, input);
    const area = t.main().getByLabel(outLabel, { exact: false }).first();
    const button = t.page.locator("main button").filter({ hasText: /copy/i }).first();
    const copy = (await button.count()) ? button : t.main().getByRole("button", { name: /copy/i }).first();
    await copy.click();
    await t.page.waitForTimeout(120);
    t.assert.equal(await t.clipboard(), await area.inputValue());
  } },
  { slug, name: "fits 375px", ...P375, async run(t) {
    await t.open();
    await t.fill(inLabel, input);
    await t.noOverflow();
  } },
  ...extra.map((e) => ({ slug, ...e })),
];

export default [
  // ---------- date
  { slug: dt, name: "it-tools e2e vector, autodetects ISO 8601", async run(t) {
    await t.open();
    t.assert.equal(await t.field("Input format").evaluate((el) => el.selectedOptions[0].text), "Timestamp");
    await t.fill("Date string", "2023-04-12T23:10:24+02:00");
    t.assert.equal(await t.field("Input format").evaluate((el) => el.selectedOptions[0].text), "ISO 8601");
    t.assert.equal(await kv(t, "Unix timestamp"), "1681333824");
    t.assert.equal(await kv(t, "Timestamp"), "1681333824000");
    t.assert.equal(await kv(t, "RFC 7231"), "Wed, 12 Apr 2023 21:10:24 GMT");
    t.assert.equal(await kv(t, "UTC format"), "Wed, 12 Apr 2023 21:10:24 GMT");
    t.assert.equal(await kv(t, "Mongo ObjectID"), "64371e400000000000000000");
    t.assert.equal(await kv(t, "Excel date/time"), "45028.88222222222");
  } },
  { slug: dt, name: "every format round trips to the same instant", async run(t) {
    await t.open();
    const inputs = [
      ["2023-04-12T21:10:24Z", "ISO 8601"],
      ["2023-04-12T21:10:24+00:00", "ISO 8601"],
      ["20230412T211024Z", "ISO 8601"],
      ["Wed, 12 Apr 2023 21:10:24 GMT", "RFC 7231"],
      ["1681333824", "Unix timestamp"],
      ["1681333824000", "Timestamp"],
      ["643720400000000000000000", "Mongo ObjectID"],
      ["45028.88222222222", "Excel date/time"],
    ];
    for (const [value, detected] of inputs) {
      await t.fill("Date string", value);
      t.assert.equal(await t.field("Input format").evaluate((el) => el.selectedOptions[0].text), detected, value);
      if (detected !== "Mongo ObjectID") t.assert.equal(await kv(t, "Unix timestamp"), "1681333824", value);
      else t.assert.equal(await kv(t, "Unix timestamp"), String(0x64372040), value);
    }
  } },
  { slug: dt, name: "timezones: local fields follow the zone, instants do not", async run(t) {
    const browser = t.page.context().browser();
    // Offsets from the IANA zones, cross-checked with python3 zoneinfo.
    const cases = [
      ["America/New_York", "2023-04-12T17:10:24-04:00", "2023-04-12 17:10:24", "GMT-0400", "1454302800"],
      ["Asia/Kolkata", "2023-04-13T02:40:24+05:30", "2023-04-13 02:40:24", "GMT+0530", "1454265000"],
      ["UTC", "2023-04-12T21:10:24Z", "2023-04-12 21:10:24", "GMT+0000", "1454284800"],
    ];
    for (const [timezoneId, iso, iso9075, gmt, midnight] of cases) {
      const ctx = await browser.newContext({ timezoneId });
      const page = await ctx.newPage();
      await page.goto(`${t.BASE}/tools/${dt}`, { waitUntil: "load" });
      await page.waitForFunction(() => document.querySelector("main dt"));
      const row = (label) => page.evaluate((lab) => { const d = [...document.querySelectorAll("main dt")].find((x) => x.innerText.trim() === lab); return d.nextElementSibling.innerText.trim(); }, label);
      await page.getByLabel("Date string", { exact: true }).fill("2023-04-12T21:10:24Z");
      await page.waitForTimeout(60);
      t.assert.equal(await row("ISO 8601"), iso, timezoneId);
      t.assert.equal(await row("RFC 3339"), iso, timezoneId);
      t.assert.equal(await row("ISO 9075"), iso9075, timezoneId);
      t.assert.ok((await row("JS locale date string")).includes(gmt), timezoneId);
      t.assert.equal(await row("Unix timestamp"), "1681333824", timezoneId);
      await page.getByLabel("Date string", { exact: true }).fill("2016-02-01");
      await page.waitForTimeout(60);
      t.assert.equal(await row("Unix timestamp"), midnight, `${timezoneId} date-only`);
      await ctx.close();
    }
  } },
  { slug: dt, name: "date-only input means local midnight", async run(t) {
    await t.open();
    await t.fill("Date string", "2016-02-01");
    const expected = await t.page.evaluate(() => String(Math.floor(new Date(2016, 1, 1).getTime() / 1000)));
    t.assert.equal(await kv(t, "Unix timestamp"), expected);
    t.assert.equal((await kv(t, "ISO 9075")), "2016-02-01 00:00:00");
  } },
  { slug: dt, name: "impossible date is an error, with outputs cleared", async run(t) {
    await t.open();
    await t.fill("Date string", "2023-02-31");
    await t.has("This date is invalid for this format");
    t.assert.equal(await kv(t, "Unix timestamp"), "Invalid date…");
    await t.fill("Date string", "not a date");
    await t.has("This date is invalid for this format");
  } },
  { slug: dt, name: "changing the format reinterprets the input", async run(t) {
    await t.open();
    await t.fill("Date string", "1000");
    await t.field("Input format").selectOption({ label: "Unix timestamp" });
    await t.page.waitForTimeout(80);
    t.assert.equal(await kv(t, "Timestamp"), "1000000");
    await t.field("Input format").selectOption({ label: "Timestamp" });
    await t.page.waitForTimeout(80);
    t.assert.equal(await kv(t, "Timestamp"), "1000");
    await t.field("Input format").selectOption({ label: "Excel date/time" });
    await t.page.waitForTimeout(80);
    t.assert.equal(await kv(t, "Excel date/time"), "1000");
  } },
  { slug: dt, name: "empty shows a live now, and it ticks", async run(t) {
    await t.open();
    const first = Number(await kv(t, "Unix timestamp"));
    t.assert.ok(Math.abs(first - Date.now() / 1000) < 5);
    await t.hasNot("invalid");
    await t.page.waitForTimeout(1300);
    t.assert.ok(Number(await kv(t, "Unix timestamp")) > first);
  } },
  { slug: dt, name: "the clear button returns to a live now", async run(t) {
    await t.open();
    await t.fill("Date string", "bad input");
    await t.has("This date is invalid");
    await t.click("Clear");
    t.assert.equal(await t.value("Date string", { exact: true }), "");
    await t.hasNot("This date is invalid");
    t.assert.ok(Math.abs(Number(await kv(t, "Unix timestamp")) - Date.now() / 1000) < 5);
  } },
  { slug: dt, name: "copy", async run(t) {
    await t.open();
    await t.fill("Date string", "1681333824");
    t.assert.equal(await kvCopy(t, "Timestamp"), "1681333824000");
  } },
  { slug: dt, name: "fits 375px", ...P375, async run(t) { await t.open(); await t.fill("Date string", "2023-04-12T23:10:24+02:00"); await t.noOverflow(); } },

  // ---------- base
  { slug: bc, name: "defaults, 42", async run(t) {
    await t.open();
    t.assert.equal(await kv(t, "Binary (2)"), "101010");
    t.assert.equal(await kv(t, "Octal (8)"), "52");
    t.assert.equal(await kv(t, "Decimal (10)"), "42");
    t.assert.equal(await kv(t, "Hexadecimal (16)"), "2a");
    t.assert.equal(await kv(t, "Base64 (64)"), "G");
    t.assert.equal(await t.value("Base 42"), "10");
  } },
  { slug: bc, name: "no precision loss above 2^53", async run(t) {
    await t.open();
    await t.fill("Input number", "9007199254740993");
    t.assert.equal(await kv(t, "Hexadecimal (16)"), "20000000000001");
    await t.fill("Input number", "340282366920938463463374607431768211455");
    t.assert.equal(await kv(t, "Hexadecimal (16)"), "f".repeat(32));
    t.assert.equal(await kv(t, "Decimal (10)"), "340282366920938463463374607431768211455");
  } },
  { slug: bc, name: "input base and custom base change results", async run(t) {
    await t.open();
    await t.fill("Input number", "FF");
    await t.fill("Input base", "16");
    t.assert.equal(await kv(t, "Decimal (10)"), "255");
    await t.fill("Input number", "/");
    await t.fill("Input base", "64");
    t.assert.equal(await kv(t, "Decimal (10)"), "63");
    await t.fill("Custom base", "7");
    t.assert.equal(await t.value("Base 7"), "120");
  } },
  { slug: bc, name: "invalid digit, emoji, and bad base", async run(t) {
    await t.open();
    await t.fill("Input number", "2");
    await t.fill("Input base", "2");
    await t.has('Invalid digit "2" for base 2.');
    t.assert.equal(await kv(t, "Decimal (10)"), "–");
    await t.fill("Input number", "😀");
    await t.has('Invalid digit "😀" for base 2.');
    await t.fill("Input number", "101");
    await t.fill("Input base", "99");
    await t.has("Input base must be a whole number from 2 to 64.");
    t.assert.equal(await kv(t, "Decimal (10)"), "–");
    await t.fill("Input base", "");
    await t.has("Input base must be a whole number from 2 to 64.");
    await t.fill("Input base", "10");
    await t.fill("Custom base", "1");
    await t.has("Custom base must be a whole number from 2 to 64.");
    t.assert.equal(await kv(t, "Decimal (10)"), "101");
  } },
  { slug: bc, name: "empty is clean", async run(t) {
    await t.open();
    await t.fill("Input number", "");
    t.assert.equal(await kv(t, "Decimal (10)"), "–");
    await t.hasNot("Invalid");
  } },
  { slug: bc, name: "very long input stays responsive", async run(t) {
    await t.open();
    const started = Date.now();
    await t.field("Input number").fill("9".repeat(20000));
    await t.page.waitForTimeout(50);
    const dec = await kv(t, "Decimal (10)");
    t.assert.equal(dec, "9".repeat(20000));
    t.assert.ok(Date.now() - started < 6000, `took ${Date.now() - started}ms`);
    const atLimit = Date.now();
    await t.field("Input number").fill("9".repeat(100000));
    await t.page.waitForTimeout(50);
    t.assert.equal(await kv(t, "Decimal (10)"), "9".repeat(100000));
    t.assert.ok(Date.now() - atLimit < 4000, `at the limit took ${Date.now() - atLimit}ms`);
    await t.field("Input number").fill("9".repeat(100001));
    await t.has("too long");
  } },
  { slug: bc, name: "copy", async run(t) { await t.open(); t.assert.equal(await kvCopy(t, "Binary (2)"), "101010"); } },
  { slug: bc, name: "fits 375px", ...P375, async run(t) { await t.open(); await t.fill("Input number", "340282366920938463463374607431768211455"); await t.noOverflow(); } },

  // ---------- roman
  { slug: rn, name: "both directions with defaults", async run(t) {
    await t.open();
    t.assert.equal(await kv(t, "Roman"), "XLII");
    t.assert.equal(await kv(t, "Arabic"), "42");
    await t.fill("Arabic number", "3999");
    t.assert.equal(await kv(t, "Roman"), "MMMCMXCIX");
    await t.fill("Roman numeral", "MCMXCIV");
    t.assert.equal(await kv(t, "Arabic"), "1994");
  } },
  { slug: rn, name: "out of range and invalid", async run(t) {
    await t.open();
    await t.fill("Arabic number", "4000");
    await t.has("We can only convert numbers between 1 and 3,999");
    t.assert.equal(await kv(t, "Roman"), "–");
    await t.fill("Arabic number", "0");
    await t.has("We can only convert numbers between 1 and 3,999");
    await t.fill("Roman numeral", "IIII");
    await t.has("not a valid Roman numeral");
    t.assert.equal(await kv(t, "Arabic"), "–");
    await t.fill("Roman numeral", "xlii");
    await t.has("uppercase");
  } },
  { slug: rn, name: "empty is clean, with no zero", async run(t) {
    await t.open();
    await t.fill("Arabic number", "");
    await t.fill("Roman numeral", "");
    await t.hasNot("We can only");
    await t.hasNot("not a valid");
    t.assert.equal(await kv(t, "Roman"), "–");
    t.assert.equal(await kv(t, "Arabic"), "–");
  } },
  { slug: rn, name: "copy", async run(t) {
    await t.open();
    t.assert.equal(await kvCopy(t, "Roman"), "XLII");
    t.assert.equal(await kvCopy(t, "Arabic"), "42");
  } },
  { slug: rn, name: "fits 375px", ...P375, async run(t) { await t.open(); await t.noOverflow(); } },

  // ---------- base64 string
  { slug: bs, name: "emoji round trip, standard and URL safe", async run(t) {
    await t.open();
    const expected = Buffer.from("héllo 😀 日本語 ??>>", "utf8").toString("base64");
    await t.fill("String to encode", "héllo 😀 日本語 ??>>");
    t.assert.equal(await t.value("Base64 of string"), expected);
    await t.fill("Base64 string to decode", expected);
    t.assert.equal(await t.value("Decoded string"), "héllo 😀 日本語 ??>>");
    const urlSafe = Buffer.from("héllo 😀 日本語 ??>>", "utf8").toString("base64url");
    await t.field("Encode URL safe").check();
    await t.page.waitForTimeout(60);
    t.assert.equal(await t.value("Base64 of string"), urlSafe);
    await t.fill("Base64 string to decode", urlSafe);
    await t.has("Invalid Base64 string");
    t.assert.equal(await t.value("Decoded string"), "");
    await t.field("Decode URL safe").check();
    await t.page.waitForTimeout(60);
    t.assert.equal(await t.value("Decoded string"), "héllo 😀 日本語 ??>>");
    await t.hasNot("Invalid Base64 string");
  } },
  { slug: bs, name: "URL-safe switches persist under the it-tools keys", async run(t) {
    await t.open();
    await t.field("Encode URL safe").check();
    await t.field("Decode URL safe").check();
    await t.page.waitForTimeout(100);
    t.assert.equal(await t.page.evaluate(() => localStorage.getItem("tools:base64-string-converter--encode-url-safe")), "true");
    await t.page.reload();
    await t.page.waitForTimeout(800);
    t.assert.equal(await t.field("Encode URL safe").isChecked(), true);
    t.assert.equal(await t.field("Decode URL safe").isChecked(), true);
  } },
  { slug: bs, name: "invalid, data URI, whitespace, and empty", async run(t) {
    await t.open();
    await t.fill("Base64 string to decode", "not base64!");
    await t.has("Invalid Base64 string");
    await t.fill("Base64 string to decode", "data:text/plain;base64,bG9yZW0gaXBzdW0=");
    t.assert.equal(await t.value("Decoded string"), "lorem ipsum");
    await t.fill("Base64 string to decode", "  bG9yZW0g\naXBzdW0=  ");
    t.assert.equal(await t.value("Decoded string"), "lorem ipsum");
    await t.fill("Base64 string to decode", "");
    await t.hasNot("Invalid Base64 string");
    t.assert.equal(await t.value("Decoded string"), "");
    t.assert.equal(await t.value("Base64 of string"), "");
  } },
  { slug: bs, name: "copy both outputs", async run(t) {
    await t.open();
    await t.fill("String to encode", "a");
    await t.fill("Base64 string to decode", "YQ==");
    const buttons = t.main().getByRole("button", { name: /copy/i });
    t.assert.equal(await buttons.count(), 2);
    await buttons.nth(0).click();
    await t.page.waitForTimeout(100);
    t.assert.equal(await t.clipboard(), "YQ==");
    await buttons.nth(1).click();
    await t.page.waitForTimeout(100);
    t.assert.equal(await t.clipboard(), "a");
  } },
  { slug: bs, name: "fits 375px", ...P375, async run(t) { await t.open(); await t.fill("String to encode", "x".repeat(300)); await t.noOverflow(); } },

  // ---------- base64 file
  { slug: bf, name: "download decodes to exact bytes and suggests the extension", async run(t) {
    await t.open();
    await t.fill("Base64 file string", PNG);
    t.assert.equal(await t.value("Extension"), "png");
    const d = await t.download("Download file");
    t.assert.equal(d.name, "file.png");
    t.assert.equal(createHash("sha256").update(fs.readFileSync(d.path)).digest("hex"), createHash("sha256").update(Buffer.from(PNG, "base64")).digest("hex"));
  } },
  { slug: bf, name: "file name and extension options, plain text bytes", async run(t) {
    await t.open();
    await t.fill("File name", "notes");
    await t.fill("Extension", "md");
    await t.fill("Base64 file string", Buffer.from("héllo 😀", "utf8").toString("base64"));
    const d = await t.download("Download file");
    t.assert.equal(d.name, "notes.md");
    t.assert.equal(d.text, "héllo 😀");
  } },
  { slug: bf, name: "data URI type sets a full mime-db extension", async run(t) {
    await t.open();
    await t.fill("Base64 file string", "data:application/zip;base64,UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==");
    t.assert.equal(await t.value("Extension"), "zip");
  } },
  { slug: bf, name: "preview renders an image, and refuses a non-image without any request", async run(t) {
    await t.open();
    const requests = [];
    t.page.on("request", (r) => { if (!r.url().startsWith("data:")) requests.push(r.url()); });
    await t.fill("Base64 file string", PNG);
    await t.click("Preview image");
    await t.page.waitForSelector("main figure img", { timeout: 5000 });
    t.assert.ok(await t.page.locator("main figure img").evaluate((img) => img.complete && img.naturalWidth === 1));
    await t.fill("Base64 file string", "SGVsbG8=");
    t.assert.equal(await t.page.locator("main figure img").count(), 0, "stale preview after input changed");
    await t.click("Preview image");
    await t.page.waitForTimeout(300);
    await t.has("not an image");
    t.assert.equal(await t.page.locator("main figure img").count(), 0);
    t.assert.deepEqual(requests.filter((u) => u.includes("SGVsbG8")), []);
  } },
  { slug: bf, name: "invalid and empty disable the actions", async run(t) {
    await t.open();
    const disabled = async () => [await t.main().getByRole("button", { name: "Preview image" }).isDisabled(), await t.main().getByRole("button", { name: "Download file" }).isDisabled()];
    t.assert.deepEqual(await disabled(), [true, true]);
    await t.hasNot("Invalid");
    await t.fill("Base64 file string", "!!!nope");
    await t.has("Invalid Base64 string");
    t.assert.deepEqual(await disabled(), [true, true]);
    await t.fill("Base64 file string", "YQ==");
    await t.hasNot("Invalid");
    t.assert.deepEqual(await disabled(), [false, false]);
  } },
  { slug: bf, name: "upload encodes a binary file exactly, and copy works", async run(t) {
    await t.open();
    const bytes = Buffer.from([0, 255, 128, 240, 159, 152, 128]);
    await t.page.locator('main input[type="file"]').setInputFiles({ name: "x.bin", mimeType: "application/octet-stream", buffer: bytes });
    await t.page.waitForTimeout(250);
    const expected = `data:application/octet-stream;base64,${bytes.toString("base64")}`;
    t.assert.equal(await t.value("File in Base64"), expected);
    await t.has("x.bin");
    await t.main().getByRole("button", { name: /copy/i }).first().click();
    await t.page.waitForTimeout(100);
    t.assert.equal(await t.clipboard(), expected);
  } },
  { slug: bf, name: "fits 375px", ...P375, async run(t) { await t.open(); await t.fill("Base64 file string", PNG); await t.click("Preview image"); await t.page.waitForTimeout(150); await t.noOverflow(); } },

  // ---------- color
  { slug: cc, name: "olive, the it-tools e2e vector", async run(t) {
    await t.open();
    t.assert.equal(await t.value("hex", { exact: true }), "#1ea54c");
    await t.fill("name", "olive", { exact: true });
    t.assert.equal(await t.value("name", { exact: true }), "olive");
    t.assert.equal(await t.value("hex", { exact: true }), "#808000");
    t.assert.equal(await t.value("rgb", { exact: true }), "rgb(128, 128, 0)");
    t.assert.equal(await t.value("hsl", { exact: true }), "hsl(60, 100%, 25%)");
    t.assert.equal(await t.value("hwb", { exact: true }), "hwb(60 0% 50%)");
    t.assert.equal(await t.value("cmyk", { exact: true }), "device-cmyk(0% 0% 100% 50%)");
    t.assert.equal(await t.value("lch", { exact: true }), "lch(52.15% 56.81 99.57)");
    t.assert.equal(await t.value("color picker", { exact: true }), "#808000");
  } },
  { slug: cc, name: "every format is accepted as input", async run(t) {
    await t.open();
    for (const [label, value] of [["rgb", "rgb(255, 0, 0)"], ["hsl", "hsl(0, 100%, 50%)"], ["hwb", "hwb(0 0% 0%)"], ["cmyk", "device-cmyk(0% 100% 100% 0%)"], ["lch", "lch(54.29% 106.84 40.85)"]]) {
      await t.fill("hex", "#000000", { exact: true });
      await t.fill(label, value, { exact: true });
      t.assert.equal(await t.value("hex", { exact: true }), label === "lch" ? await t.value("hex", { exact: true }) : "#ff0000", label);
      if (label === "lch") t.assert.notEqual(await t.value("hex", { exact: true }), "#000000");
    }
    await t.fill("hex", "ff0000", { exact: true });
    t.assert.equal(await t.value("rgb", { exact: true }), "rgb(255, 0, 0)");
  } },
  { slug: cc, name: "alpha carries through, and the slider edits it", async run(t) {
    await t.open();
    await t.fill("rgb", "rgba(255, 0, 0, 0.5)", { exact: true });
    t.assert.equal(await t.value("hex", { exact: true }), "#ff000080");
    t.assert.equal(await t.value("hsl", { exact: true }), "hsla(0, 100%, 50%, 0.5)");
    t.assert.equal(await t.value("hwb", { exact: true }), "hwb(0 0% 0% / 0.5)");
    t.assert.equal(await t.value("color picker", { exact: true }), "#ff0000");
    const slider = t.page.locator('main input[type="range"]');
    t.assert.equal(await slider.inputValue(), "50");
    await slider.fill("100");
    await t.page.waitForTimeout(80);
    t.assert.equal(await t.value("hex", { exact: true }), "#ff0000");
    t.assert.equal(await t.value("rgb", { exact: true }), "rgb(255, 0, 0)");
    await slider.fill("0");
    await t.page.waitForTimeout(80);
    t.assert.equal(await t.value("hex", { exact: true }), "#ff000000");
    await t.field("color picker", { exact: true }).fill("#00ff00");
    await t.page.waitForTimeout(80);
    t.assert.equal(await t.value("hex", { exact: true }), "#00ff0000", "picker keeps alpha");
  } },
  { slug: cc, name: "invalid shows a field error and leaves siblings alone", async run(t) {
    await t.open();
    await t.fill("hex", "#zzz", { exact: true });
    await t.has("Invalid hex format.");
    t.assert.equal(await t.value("rgb", { exact: true }), "rgb(30, 165, 76)");
    await t.fill("rgb", "rgb(0, 0, 255)", { exact: true });
    await t.hasNot("Invalid hex format.");
    t.assert.equal(await t.value("hex", { exact: true }), "#0000ff");
    await t.fill("name", "notacolor", { exact: true });
    await t.has("Invalid name format.");
  } },
  { slug: cc, name: "empty field is clean", async run(t) {
    await t.open();
    await t.fill("hex", "", { exact: true });
    await t.hasNot("Invalid");
    t.assert.equal(await t.value("rgb", { exact: true }), "rgb(30, 165, 76)");
  } },
  { slug: cc, name: "the clear button empties one field", async run(t) {
    await t.open();
    await t.click("Clear");
    t.assert.equal(await t.value("hex", { exact: true }), "");
    t.assert.equal(await t.value("rgb", { exact: true }), "rgb(30, 165, 76)");
  } },
  { slug: cc, name: "copy", async run(t) {
    await t.open();
    await t.main().getByRole("button", { name: "Copy rgb" }).click();
    await t.page.waitForTimeout(100);
    t.assert.equal(await t.clipboard(), "rgb(30, 165, 76)");
  } },
  { slug: cc, name: "fits 375px", ...P375, async run(t) { await t.open(); await t.noOverflow(); } },

  // ---------- case
  { slug: cs, name: "default sample and every format", async run(t) {
    await t.open();
    const want = { Lowercase: "lorem ipsum dolor sit amet", Uppercase: "LOREM IPSUM DOLOR SIT AMET", Camelcase: "loremIpsumDolorSitAmet", Capitalcase: "Lorem Ipsum Dolor Sit Amet", Constantcase: "LOREM_IPSUM_DOLOR_SIT_AMET", Dotcase: "lorem.ipsum.dolor.sit.amet", Headercase: "Lorem-Ipsum-Dolor-Sit-Amet", Nocase: "lorem ipsum dolor sit amet", Paramcase: "lorem-ipsum-dolor-sit-amet", Pascalcase: "LoremIpsumDolorSitAmet", Pathcase: "lorem/ipsum/dolor/sit/amet", Sentencecase: "Lorem ipsum dolor sit amet", Snakecase: "lorem_ipsum_dolor_sit_amet", Mockingcase: "LoReM IpSuM DoLoR SiT AmEt" };
    for (const [label, value] of Object.entries(want)) t.assert.equal(await kv(t, label), value, label);
  } },
  { slug: cs, name: "splits camelCase and keeps emoji in mocking case", async run(t) {
    await t.open();
    await t.fill("Your string", "XMLHttpRequest fooBar");
    t.assert.equal(await kv(t, "Snakecase"), "xml_http_request_foo_bar");
    await t.fill("Your string", "a😀b");
    t.assert.equal(await kv(t, "Uppercase"), "A😀B");
    t.assert.ok((await kv(t, "Mockingcase")).includes("😀"));
  } },
  { slug: cs, name: "empty is clean", async run(t) {
    await t.open();
    await t.fill("Your string", "");
    t.assert.equal(await kv(t, "Camelcase"), "–");
    t.assert.equal(await kv(t, "Mockingcase"), "–");
  } },
  { slug: cs, name: "copy", async run(t) { await t.open(); t.assert.equal(await kvCopy(t, "Snakecase"), "lorem_ipsum_dolor_sit_amet"); } },
  { slug: cs, name: "fits 375px", ...P375, async run(t) { await t.open(); await t.fill("Your string", "averyveryveryveryveryveryveryveryveryveryveryverylongword ".repeat(3)); await t.noOverflow(); } },

  // ---------- nato
  { slug: na, name: "converts, passes non-letters through, and keeps emoji whole", async run(t) {
    await t.open();
    const out = () => t.main().locator("textarea").nth(1).inputValue();
    await t.fill("Your text to convert", "aZ");
    t.assert.equal(await out(), "Alpha Zulu");
    await t.fill("Your text to convert", "a1😀");
    t.assert.equal(await out(), "Alpha 1 😀");
    await t.main().getByRole("button", { name: /copy/i }).first().click();
    await t.page.waitForTimeout(100);
    t.assert.equal(await t.clipboard(), "Alpha 1 😀");
  } },
  { slug: na, name: "empty is clean", async run(t) {
    await t.open();
    t.assert.equal(await t.main().locator("textarea").nth(1).inputValue(), "");
    t.assert.equal(await t.main().getByRole("button", { name: /copy/i }).first().isDisabled(), true);
  } },
  { slug: na, name: "fits 375px", ...P375, async run(t) { await t.open(); await t.fill("Your text to convert", "x".repeat(200)); await t.noOverflow(); } },

  // ---------- binary
  { slug: tb, name: "it-tools e2e vectors", async run(t) {
    await t.open();
    await t.fill("Enter text to convert to binary", "it-tools");
    t.assert.equal(await t.value("Binary from your text"), "01101001 01110100 00101101 01110100 01101111 01101111 01101100 01110011");
    await t.fill("Enter binary to convert to text", "01101001 01110100 00101101 01110100 01101111 01101111 01101100 01110011");
    t.assert.equal(await t.value("Text from your binary"), "it-tools");
  } },
  { slug: tb, name: "emoji round trip as UTF-8", async run(t) {
    await t.open();
    const text = "é 😀 日本語";
    const expected = [...Buffer.from(text, "utf8")].map((b) => b.toString(2).padStart(8, "0")).join(" ");
    await t.fill("Enter text to convert to binary", text);
    const binary = await t.value("Binary from your text");
    t.assert.equal(binary, expected);
    await t.fill("Enter binary to convert to text", binary);
    t.assert.equal(await t.value("Text from your binary"), text);
  } },
  { slug: tb, name: "invalid and empty", async run(t) {
    await t.open();
    await t.fill("Enter binary to convert to text", "0100000");
    await t.has("multiples of 8 bits");
    t.assert.equal(await t.value("Text from your binary"), "");
    await t.fill("Enter binary to convert to text", "hello");
    await t.has("multiples of 8 bits");
    await t.fill("Enter binary to convert to text", "");
    await t.hasNot("multiples of 8 bits");
    t.assert.equal(await t.value("Binary from your text"), "");
  } },
  { slug: tb, name: "copy", async run(t) {
    await t.open();
    await t.fill("Enter text to convert to binary", "A");
    await t.main().getByRole("button", { name: /copy/i }).first().click();
    await t.page.waitForTimeout(100);
    t.assert.equal(await t.clipboard(), "01000001");
  } },
  { slug: tb, name: "fits 375px", ...P375, async run(t) { await t.open(); await t.fill("Enter text to convert to binary", "x".repeat(200)); await t.noOverflow(); } },

  // ---------- unicode
  { slug: tu, name: "it-tools e2e vectors", async run(t) {
    await t.open();
    await t.fill("Enter text to convert to Unicode", "it-tools");
    t.assert.equal(await t.value("Unicode from your text"), "&#105;&#116;&#45;&#116;&#111;&#111;&#108;&#115;");
    await t.fill("Enter Unicode to convert to text", "&#105;&#116;&#45;&#116;&#111;&#111;&#108;&#115;");
    t.assert.equal(await t.value("Text from your Unicode"), "it-tools");
  } },
  { slug: tu, name: "emoji is a single entity that the browser's HTML parser agrees with", async run(t) {
    await t.open();
    await t.fill("Enter text to convert to Unicode", "a😀é");
    const out = await t.value("Unicode from your text");
    t.assert.equal(out, `&#97;&#${0x1f600};&#233;`);
    t.assert.equal(await t.page.evaluate((html) => { const d = document.createElement("div"); d.innerHTML = html; return d.textContent; }, out), "a😀é");
    await t.fill("Enter Unicode to convert to text", out);
    t.assert.equal(await t.value("Text from your Unicode"), "a😀é");
  } },
  { slug: tu, name: "hex entities, out of range, and plain text", async run(t) {
    await t.open();
    await t.fill("Enter Unicode to convert to text", "&#x1F600; plain &#99999999;");
    t.assert.equal(await t.value("Text from your Unicode"), "😀 plain &#99999999;");
  } },
  { slug: tu, name: "empty is clean", async run(t) {
    await t.open();
    await t.fill("Enter text to convert to Unicode", "   ");
    t.assert.equal(await t.value("Unicode from your text"), "");
    await t.fill("Enter Unicode to convert to text", "");
    t.assert.equal(await t.value("Text from your Unicode"), "");
  } },
  { slug: tu, name: "copy", async run(t) {
    await t.open();
    await t.fill("Enter text to convert to Unicode", "A");
    await t.main().getByRole("button", { name: /copy/i }).first().click();
    await t.page.waitForTimeout(100);
    t.assert.equal(await t.clipboard(), "&#65;");
  } },
  { slug: tu, name: "fits 375px", ...P375, async run(t) { await t.open(); await t.fill("Enter text to convert to Unicode", "x".repeat(200)); await t.noOverflow(); } },

  // ---------- structured
  ...transform({ slug: "yaml-to-json-converter", inLabel: "Your YAML", outLabel: "JSON from your YAML", input: "foo: bar\nlist:\n  - item\n  - key: value", expected: `{\n   "foo": "bar",\n   "list": [\n      "item",\n      {\n         "key": "value"\n      }\n   ]\n}`, bad: "a: b: c", badMessage: "Provided YAML is not valid.", extra: [
    { name: "merge keys, it-tools e2e vector", async run(t) {
      await t.open();
      await t.fill("Your YAML", `
      default: &default
        name: ''
        age: 0

      person:
        *default

      persons:
      - <<: *default
        age: 1
      - <<: *default
        name: John
      - { age: 3, <<: *default }

      `);
      t.assert.deepEqual(JSON.parse(await t.value("JSON from your YAML")), { default: { name: "", age: 0 }, person: { name: "", age: 0 }, persons: [{ name: "", age: 1 }, { name: "John", age: 0 }, { age: 3, name: "" }] });
    } },
    { name: "self-referencing alias explains itself", async run(t) {
      await t.open();
      await t.fill("Your YAML", "a: &a\n  b: *a");
      await t.has("refers to itself");
      t.assert.equal(await t.value("JSON from your YAML"), "");
    } },
    { name: "falsy scalars and Unicode convert", async run(t) {
      await t.open();
      await t.fill("Your YAML", "0");
      t.assert.equal(await t.value("JSON from your YAML"), "0");
      await t.fill("Your YAML", "k: 😀 日本語");
      t.assert.deepEqual(JSON.parse(await t.value("JSON from your YAML")), { k: "😀 日本語" });
    } },
  ] }),
  ...transform({ slug: "yaml-to-toml", inLabel: "Your YAML", outLabel: "TOML from your YAML", input: "foo: bar\nlist:\n  name: item\n  another:\n    key: value\n    number: 1", expected: `foo = "bar"\n\n[list]\nname = "item"\n\n  [list.another]\n  key = "value"\n  number = 1`, bad: "a: b: c", badMessage: "Provided YAML is not valid.", extra: [
    { name: "a top-level list explains itself", async run(t) {
      await t.open();
      await t.fill("Your YAML", "- a\n- b");
      await t.has("top level");
      t.assert.equal(await t.value("TOML from your YAML"), "");
    } },
    { name: "merge keys expand", async run(t) {
      await t.open();
      await t.fill("Your YAML", "base: &b\n  k: 1\nuse:\n  <<: *b\n");
      t.assert.equal(await t.value("TOML from your YAML"), "[base]\nk = 1\n\n[use]\nk = 1");
    } },
  ] }),
  ...transform({ slug: "json-to-yaml-converter", inLabel: "Your JSON", outLabel: "YAML from your JSON", input: '{"foo":"bar","list":["item",{"key":"value"}]}', expected: "foo: bar\nlist:\n  - item\n  - key: value", bad: "{nope", badMessage: "Provided JSON is not valid.", extra: [
    { name: "JSON5 and emoji", async run(t) {
      await t.open();
      await t.fill("Your JSON", "{a: '😀', b: [1,],}");
      t.assert.equal((await t.value("YAML from your JSON")).trim(), "a: 😀\nb:\n  - 1");
    } },
  ] }),
  ...transform({ slug: "json-to-toml", inLabel: "Your JSON", outLabel: "TOML from your JSON", input: '{"foo":"bar","list":{"name":"item","another":{"key":"value"}}}', expected: `foo = "bar"\n\n[list]\nname = "item"\n\n  [list.another]\n  key = "value"`, bad: "{nope", badMessage: "Provided JSON is not valid.", extra: [
    { name: "a top-level list or value explains itself", async run(t) {
      await t.open();
      for (const v of ["[1, 2]", "42", "null"]) {
        await t.fill("Your JSON", v);
        await t.has("top level");
        t.assert.equal(await t.value("TOML from your JSON"), "");
      }
    } },
  ] }),
  ...transform({ slug: "toml-to-json", inLabel: "Your TOML", outLabel: "JSON from your TOML", input: 'foo = "bar"\n\n# This is a comment\n\n[list]\n  name = "item"\n[list.another]\n  key = "value"', expected: `{\n   "foo": "bar",\n   "list": {\n      "name": "item",\n      "another": {\n         "key": "value"\n      }\n   }\n}`, bad: "foo = = bar", badMessage: "Provided TOML is not valid.", extra: [
    { name: "integers above 2^53 stay exact in the browser", async run(t) {
      await t.open();
      await t.fill("Your TOML", "a = 9007199254740993");
      t.assert.equal(await t.value("JSON from your TOML"), '{\n   "a": 9007199254740993\n}');
    } },
    { name: "dates and Unicode", async run(t) {
      await t.open();
      await t.fill("Your TOML", 'd = 1979-05-27T07:32:00Z\ns = "😀 日本語"');
      t.assert.deepEqual(JSON.parse(await t.value("JSON from your TOML")), { d: "1979-05-27T07:32:00.000Z", s: "😀 日本語" });
    } },
  ] }),
  ...transform({ slug: "toml-to-yaml", inLabel: "Your TOML", outLabel: "YAML from your TOML", input: 'foo = "bar"\n\n# This is a comment\n\n[list]\n  name = "item"\n[list.another]\n  key = "value"', expected: "foo: bar\nlist:\n  name: item\n  another:\n    key: value", bad: "foo = = bar", badMessage: "Provided TOML is not valid.", extra: [
    { name: "integers above 2^53 stay exact in the browser", async run(t) {
      await t.open();
      await t.fill("Your TOML", "a = 9007199254740993");
      t.assert.equal((await t.value("YAML from your TOML")).trim(), "a: 9007199254740993");
    } },
  ] }),
  ...transform({ slug: "xml-to-json", inLabel: "Your XML content", outLabel: "Converted JSON", initial: `<a x="1.234" y="It's"/>`, input: "<a><b>1</b><b>2</b></a>", expected: JSON.stringify({ a: { b: [{ _text: "1" }, { _text: "2" }] } }, null, 2), bad: "<a><b></a>", badMessage: "Provided XML is not valid.", extra: [
    { name: "opens with the it-tools sample converted", async run(t) {
      await t.open();
      t.assert.deepEqual(JSON.parse(await t.value("Converted JSON")), { a: { _attributes: { x: "1.234", y: "It's" } } });
    } },
    { name: "unclosed tag and second root are errors", async run(t) {
      await t.open();
      for (const bad of ["<a>", "<a/><b/>", "plain text"]) {
        await t.fill("Your XML content", bad);
        await t.has("Provided XML is not valid.");
        t.assert.equal(await t.value("Converted JSON"), "");
      }
    } },
    { name: "entities and emoji", async run(t) {
      await t.open();
      await t.fill("Your XML content", "<a>&amp; &#x1F600; é</a>");
      t.assert.deepEqual(JSON.parse(await t.value("Converted JSON")), { a: { _text: "& 😀 é" } });
    } },
  ] }),
  ...transform({ slug: "json-to-xml", inLabel: "Your JSON content", outLabel: "Converted XML", initial: `{"a":{"_attributes":{"x":"1.234","y":"It's"}}}`, input: '{"a":{"b":[1,2],"c":"<&>"}}', expected: "<a><b>1</b><b>2</b><c>&lt;&amp;&gt;</c></a>", bad: "{nope", badMessage: "Provided JSON is not valid.", extra: [
    { name: "opens with the it-tools sample converted", async run(t) {
      await t.open();
      t.assert.equal(await t.value("Converted XML"), `<a x="1.234" y="It's"/>`);
    } },
    { name: "output is well-formed according to the browser", async run(t) {
      await t.open();
      await t.fill("Your JSON content", '{"a":{"_attributes":{"x":"<&\\"y"},"_text":"😀"}}');
      const xml = await t.value("Converted XML");
      const parsed = await t.page.evaluate((s) => { const d = new DOMParser().parseFromString(s, "application/xml"); return d.querySelector("parsererror") ? "ERROR" : [d.documentElement.getAttribute("x"), d.documentElement.textContent]; }, xml);
      t.assert.deepEqual(parsed, ['<&"y', "😀"]);
    } },
    { name: "a shape with no XML form explains itself", async run(t) {
      await t.open();
      await t.fill("Your JSON content", "[1, 2]");
      await t.has("top level");
      t.assert.equal(await t.value("Converted XML"), "");
      await t.fill("Your JSON content", '{"a b": 1}');
      await t.has("XML name");
      t.assert.equal(await t.value("Converted XML"), "");
    } },
  ] }),

  // ---------- list
  { slug: "list-converter", name: "it-tools e2e vectors", async run(t) {
    await t.open();
    await t.fill("Your input data", "1\n    2\n    3\n    4\n    5");
    t.assert.equal(await t.value("Your transformed data"), "1, 2, 3, 4, 5");
    await t.fill("Your input data", "1\n    2\n    2\n    4\n    4\n    3\n    5");
    await t.fill("Item prefix", "'");
    await t.fill("Item suffix", "'");
    t.assert.equal(await t.value("Your transformed data"), "'1', '2', '4', '3', '5'");
  } },
  { slug: "list-converter", name: "every option changes the result", async run(t) {
    await t.open();
    const out = () => t.value("Your transformed data");
    await t.fill("Your input data", "B\n  a\na\nc");
    t.assert.equal(await out(), "B, a, c");
    await t.field("Remove duplicates").uncheck();
    t.assert.equal(await out(), "B, a, a, c");
    await t.field("Remove duplicates").check();
    await t.field("Trim list items").uncheck();
    t.assert.equal(await out(), "B,   a, a, c");
    await t.field("Trim list items").check();
    await t.field("Convert to lowercase").check();
    t.assert.equal(await out(), "b, a, c");
    await t.field("Convert to lowercase").uncheck();
    await t.field("Sort list").selectOption("asc");
    t.assert.equal(await out(), "a, B, c");
    await t.field("Sort list").selectOption("desc");
    t.assert.equal(await out(), "c, B, a");
    await t.field("Sort list").selectOption("");
    await t.field("Reverse list").check();
    t.assert.equal(await out(), "c, a, B");
    t.assert.equal(await t.field("Sort list").isDisabled(), true);
    await t.field("Reverse list").uncheck();
    await t.fill("Separator", " | ");
    t.assert.equal(await out(), "B | a | c");
    await t.fill("Separator", ",");
    await t.field("Keep line breaks").check();
    await t.fill("List prefix", "[");
    await t.fill("List suffix", "]");
    await t.fill("Item prefix", "<");
    await t.fill("Item suffix", ">");
    t.assert.equal(await out(), "[\n<B>,\n<a>,\n<c>\n]");
  } },
  { slug: "list-converter", name: "settings persist under the it-tools key, the list does not", async run(t) {
    await t.open();
    await t.fill("Your input data", "secret");
    await t.fill("Separator", ";");
    await t.field("Convert to lowercase").check();
    await t.page.waitForTimeout(80);
    const stored = JSON.parse(await t.page.evaluate(() => localStorage.getItem("tools:list-converter:conversionConfig")));
    t.assert.equal(stored.separator, ";");
    t.assert.equal(stored.lowerCase, true);
    await t.page.reload();
    await t.page.waitForTimeout(800);
    t.assert.equal(await t.value("Separator"), ";");
    t.assert.equal(await t.field("Convert to lowercase").isChecked(), true);
    t.assert.equal(await t.value("Your input data"), "");
  } },
  { slug: "list-converter", name: "corrupt stored settings fall back to defaults", async run(t) {
    await t.open();
    await t.page.evaluate(() => localStorage.setItem("tools:list-converter:conversionConfig", JSON.stringify({ separator: 5 })));
    await t.page.reload();
    await t.page.waitForTimeout(800);
    t.assert.equal(await t.value("Separator"), ", ");
  } },
  { slug: "list-converter", name: "empty is clean, even with wrappers set", async run(t) {
    await t.open();
    await t.fill("List prefix", "[");
    await t.field("Keep line breaks").check();
    t.assert.equal(await t.value("Your transformed data"), "");
    await t.fill("Your input data", "  \n ");
    t.assert.equal(await t.value("Your transformed data"), "");
  } },
  { slug: "list-converter", name: "copy", async run(t) {
    await t.open();
    await t.fill("Your input data", "a\nb");
    await t.main().getByRole("button", { name: /copy/i }).first().click();
    await t.page.waitForTimeout(100);
    t.assert.equal(await t.clipboard(), "a, b");
  } },
  { slug: "list-converter", name: "fits 375px", ...P375, async run(t) { await t.open(); await t.fill("Your input data", "a\nb"); await t.noOverflow(); } },

  // ---------- markdown
  { slug: "markdown-to-html", name: "renders and previews", async run(t) {
    await t.open();
    await t.fill("Your Markdown to convert", "# Title\n\n**bold** [a](https://example.com)");
    t.assert.equal(await t.value("Output HTML"), '<h1>Title</h1>\n<p><strong>bold</strong> <a href="https://example.com">a</a></p>\n');
    t.assert.equal(await t.page.locator("main .ui-prose h1").innerText(), "Title");
  } },
  { slug: "markdown-to-html", name: "output and preview are safe", async run(t) {
    await t.open();
    await t.page.evaluate(() => { window.__pwned = 0; });
    await t.fill("Your Markdown to convert", `<script>window.__pwned=1</script>\n\n<img src=x onerror="window.__pwned=2">\n\n[x](javascript:window.__pwned=3)\n\n<iframe src="javascript:parent.__pwned=4"></iframe>\n\n![y](javascript:window.__pwned=5)`);
    await t.page.waitForTimeout(250);
    const html = await t.value("Output HTML");
    t.assert.ok(!/<script|<img|<iframe|href="javascript|src="javascript/i.test(html), html);
    t.assert.equal(await t.page.locator("main .ui-prose script, main .ui-prose iframe, main .ui-prose img, main .ui-prose a[href^='javascript']").count(), 0);
    t.assert.equal(await t.page.evaluate(() => window.__pwned), 0);
  } },
  { slug: "markdown-to-html", name: "print writes the HTML into a new window and prints", async run(t) {
    await t.open();
    t.assert.equal(await t.main().getByRole("button", { name: "Print as PDF" }).isDisabled(), true);
    await t.page.evaluate(() => {
      window.__printed = null;
      window.open = () => ({ document: { body: { set innerHTML(v) { window.__printed = v; } } }, print() { window.__didPrint = true; } });
    });
    await t.fill("Your Markdown to convert", "# Hi 😀");
    await t.click("Print as PDF");
    t.assert.equal(await t.page.evaluate(() => window.__printed), "<h1>Hi 😀</h1>\n");
    t.assert.equal(await t.page.evaluate(() => window.__didPrint), true);
    await t.has("Print dialog opened.");
    await t.fill("Your Markdown to convert", "more");
    await t.hasNot("Print dialog opened.");
  } },
  { slug: "markdown-to-html", name: "a blocked pop-up says so", async run(t) {
    await t.open();
    await t.page.evaluate(() => { window.open = () => null; });
    await t.fill("Your Markdown to convert", "x");
    await t.click("Print as PDF");
    await t.has("Pop-up blocked");
  } },
  { slug: "markdown-to-html", name: "empty is clean", async run(t) {
    await t.open();
    t.assert.equal(await t.value("Output HTML"), "");
    t.assert.equal(await t.page.locator("main .ui-prose").count(), 0);
  } },
  { slug: "markdown-to-html", name: "copy", async run(t) {
    await t.open();
    await t.fill("Your Markdown to convert", "a");
    await t.main().getByRole("button", { name: /copy/i }).first().click();
    await t.page.waitForTimeout(100);
    t.assert.equal(await t.clipboard(), "<p>a</p>\n");
  } },
  { slug: "markdown-to-html", name: "fits 375px", ...P375, async run(t) { await t.open(); await t.fill("Your Markdown to convert", "```\n" + "x".repeat(300) + "\n```\n\n" + "y".repeat(300)); await t.noOverflow(); } },
];
