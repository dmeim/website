import fs from "node:fs";

const narrow = { width: 375, height: 800 };
const LOREM_FIRST = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";

/** Decode a QR image (data URL or rendered element src) with the browser's own detector. */
async function decodeQr(page, src) {
  return page.evaluate(async (s) => {
    const img = new Image();
    img.src = s;
    await img.decode();
    // A canvas with a white backing handles SVGs with no intrinsic size and transparent exports.
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 600;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 600, 600);
    ctx.drawImage(img, 0, 0, 600, 600);
    const found = await new BarcodeDetector({ formats: ["qr_code"] }).detect(canvas);
    return found[0]?.rawValue ?? "no-code";
  }, src);
}

/** Wait for the preview to re-render, then decode what is on screen. */
async function previewPayload(t) {
  await t.page.waitForTimeout(250);
  const src = await t.page.locator(".qr-preview img").getAttribute("src");
  return decodeQr(t.page, src);
}

async function setRange(page, selector, value) {
  await page.locator(selector).evaluate((el, v) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(el, String(v));
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
  await page.waitForTimeout(80);
}

/** Wrap getUserMedia so a scenario can inspect every stream the page asked for. */
function trackStreams(page) {
  return page.addInitScript(() => {
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    window.__streams = [];
    window.__constraints = [];
    navigator.mediaDevices.getUserMedia = async (constraints) => {
      window.__constraints.push(constraints);
      const stream = await original(constraints);
      window.__streams.push(stream);
      return stream;
    };
  });
}

async function startCamera(t) {
  await t.click("Start camera");
  await t.page.waitForFunction(() => {
    const video = document.querySelector(".camera-preview-frame video");
    return video && video.videoWidth > 0;
  }, null, { timeout: 15000 });
}

const stats = async (t) => {
  const text = await t.text();
  const pick = (label) => new RegExp(`${label}\\s*\\n?\\s*([^\\n]+)`, "i").exec(text)?.[1]?.trim();
  return { chars: pick("Character count"), words: pick("Word count"), lines: pick("Line count"), bytes: pick("Byte size") };
};

export default [
  // ---------- lorem ipsum ----------
  { slug: "lorem-ipsum-generator", name: "defaults, classic start, sentence and word ranges", async run(t) {
    await t.open();
    const text = await t.value("Lorem ipsum", { exact: true });
    t.assert.ok(text.startsWith(LOREM_FIRST), text.slice(0, 80));
    t.assert.equal(text.split("\n\n").length, 1);
    const sentences = text.split(". ").length;
    t.assert.ok(sentences >= 3 && sentences <= 8, `sentences ${sentences}`);
  } },
  { slug: "lorem-ipsum-generator", name: "options change output: paragraphs, start, html", async run(t) {
    await t.open();
    await setRange(t.page, "#lorem-paragraphs", 3);
    t.assert.equal((await t.value("Lorem ipsum", { exact: true })).split("\n\n").length, 3);
    await t.main().getByLabel("As HTML").check();
    await t.page.waitForTimeout(80);
    const html = await t.value("Lorem ipsum", { exact: true });
    t.assert.match(html, /^<p>[\s\S]*<\/p>$/);
    t.assert.equal(html.split("</p>\n\n<p>").length, 3);
    await t.main().getByLabel("As HTML").uncheck();
    await t.main().getByLabel("Start with lorem ipsum").uncheck();
    await t.page.waitForTimeout(80);
    t.assert.ok(!(await t.value("Lorem ipsum", { exact: true })).startsWith(LOREM_FIRST));
  } },
  { slug: "lorem-ipsum-generator", name: "range sliders set exact counts, top of range is reachable", async run(t) {
    await t.open();
    const out = () => t.value("Lorem ipsum", { exact: true });
    await t.main().getByLabel("Start with lorem ipsum").uncheck();
    const setBound = async (label, value) => {
      await t.main().getByLabel(label).evaluate((el, v) => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, String(v));
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }, value);
      await t.page.waitForTimeout(60);
    };
    await setBound("Minimum Sentences per paragraph", 2);
    await setBound("Maximum Sentences per paragraph", 2);
    await setBound("Minimum Words per sentence", 3);
    await setBound("Maximum Words per sentence", 3);
    const sentences = (await out()).split(/(?<=\.) /);
    t.assert.equal(sentences.length, 2);
    for (const sentence of sentences) t.assert.equal(sentence.split(" ").length, 3);
    await setBound("Maximum Words per sentence", 4);
    const seen = new Set();
    for (let i = 0; i < 30; i += 1) {
      await t.click("Refresh");
      seen.add((await out()).split(/(?<=\.) /)[0].split(" ").length);
    }
    t.assert.deepEqual([...seen].sort(), [3, 4]);
  } },
  { slug: "lorem-ipsum-generator", name: "refresh and copy", async run(t) {
    await t.open();
    const before = await t.value("Lorem ipsum", { exact: true });
    await t.click("Refresh");
    const after = await t.value("Lorem ipsum", { exact: true });
    t.assert.notEqual(after, before);
    await t.main().getByRole("button", { name: "Copy" }).last().click();
    await t.page.waitForTimeout(100);
    t.assert.equal(await t.clipboard(), after);
  } },
  { slug: "lorem-ipsum-generator", name: "no overflow at 375px", viewport: narrow, async run(t) {
    await t.open();
    await t.noOverflow();
  } },

  // ---------- text statistics ----------
  { slug: "text-statistics", name: "empty state is all zeros", async run(t) {
    await t.open();
    t.assert.deepEqual(await stats(t), { chars: "0", words: "0", lines: "0", bytes: "0 Bytes" });
  } },
  { slug: "text-statistics", name: "typical text", async run(t) {
    await t.open();
    await t.fill("Text", "hello world\nline two", { exact: true });
    t.assert.deepEqual(await stats(t), { chars: "20", words: "4", lines: "2", bytes: "20 Bytes" });
  } },
  { slug: "text-statistics", name: "emoji, ZWJ, and combining characters", async run(t) {
    await t.open();
    await t.fill("Text", "😀", { exact: true });
    t.assert.deepEqual(await stats(t), { chars: "1", words: "1", lines: "1", bytes: "4 Bytes" });
    await t.fill("Text", "👨‍👩‍👧‍👦", { exact: true });
    t.assert.equal((await stats(t)).chars, "1");
    t.assert.equal((await stats(t)).bytes, `${Buffer.byteLength("👨‍👩‍👧‍👦")} Bytes`);
    await t.fill("Text", "é", { exact: true });
    t.assert.equal((await stats(t)).chars, "1");
    t.assert.equal((await stats(t)).bytes, "3 Bytes");
  } },
  { slug: "text-statistics", name: "whitespace only has no words", async run(t) {
    await t.open();
    await t.fill("Text", "   ", { exact: true });
    t.assert.equal((await stats(t)).words, "0");
    await t.fill("Text", "hello ", { exact: true });
    t.assert.equal((await stats(t)).words, "1");
    await t.fill("Text", "a", { exact: true });
    t.assert.equal((await stats(t)).bytes, "1 Byte");
  } },
  { slug: "text-statistics", name: "1 MB paste stays responsive, KB formatting", async run(t) {
    await t.open();
    // ASCII on purpose: a bare Chromium textarea alone takes over 30s to shape this much emoji.
    const big = "hello world abc ".repeat(70000);
    const started = Date.now();
    await t.fill("Text", big, { exact: true });
    t.assert.ok(Date.now() - started < 5000, `took ${Date.now() - started}ms`);
    const bytes = Buffer.byteLength(big);
    t.assert.equal((await stats(t)).bytes, `${Number.parseFloat((bytes / 1024 / 1024).toFixed(2))} MB`);
    t.assert.equal((await stats(t)).words, String(70000 * 3));
  } },
  { slug: "text-statistics", name: "no overflow at 375px", viewport: narrow, async run(t) {
    await t.open();
    await t.fill("Text", "x".repeat(500), { exact: true });
    await t.noOverflow();
  } },

  // ---------- emoji picker ----------
  { slug: "emoji-picker", name: "catalog loads and search finds a match", async run(t) {
    await t.open();
    await t.has("SMILEYS & EMOTION");
    await t.has("FLAGS");
    await t.page.getByRole("searchbox").or(t.main().getByRole("textbox")).first().fill("grinning face");
    await t.page.waitForTimeout(800);
    await t.has("SEARCH RESULT");
    await t.hasNot("FLAGS");
    await t.has("Grinning face");
  } },
  { slug: "emoji-picker", name: "search by code point and by emoji, no results state", async run(t) {
    await t.open();
    const box = t.page.getByRole("searchbox").or(t.main().getByRole("textbox")).first();
    await box.fill("0x1f600");
    await t.page.waitForTimeout(800);
    await t.has("Grinning face");
    await box.fill("😀");
    await t.page.waitForTimeout(800);
    await t.has("Grinning face");
    await box.fill("zzzzqqqqxxxx");
    await t.page.waitForTimeout(800);
    await t.has("No results");
    for (const odd of ["!", "'", "^", "=", "|", "\\", "(", "[", "*"]) {
      await box.fill(odd);
      await t.page.waitForTimeout(600);
    }
    await box.fill("");
    await t.page.waitForTimeout(800);
    await t.has("SMILEYS & EMOTION");
  } },
  { slug: "emoji-picker", name: "copy gives the exact ZWJ and VS16 sequence", async run(t) {
    await t.open();
    const cases = [
      ["Copy emoji Family man, woman, girl, boy", "\u{1F468}‍\u{1F469}‍\u{1F467}‍\u{1F466}"],
      ["Copy emoji Rainbow flag", "\u{1F3F3}️‍\u{1F308}"],
      ["Copy emoji Man health worker", "\u{1F468}‍⚕️"],
      ["Copy emoji Grinning face", "\u{1F600}"],
    ];
    for (const [name, expected] of cases) {
      await t.page.getByRole("button", { name, exact: true }).click();
      await t.page.waitForTimeout(100);
      t.assert.equal(await t.clipboard(), expected, name);
    }
    await t.has("copied.");
  } },
  { slug: "emoji-picker", name: "copy code point and unicode escape", async run(t) {
    await t.open();
    await t.page.getByRole("button", { name: "0x1f600", exact: true }).click();
    await t.page.waitForTimeout(100);
    t.assert.equal(await t.clipboard(), "0x1f600");
    await t.page.locator('button[title="Copy unicode \\\\ud83d\\\\ude00"]').first().click();
    await t.page.waitForTimeout(100);
    t.assert.equal(await t.clipboard(), "\\ud83d\\ude00");
  } },
  { slug: "emoji-picker", name: "copy feedback is visible after scrolling down", async run(t) {
    await t.open();
    const flag = t.page.getByRole("button", { name: "Copy emoji Flag japan", exact: true });
    await flag.scrollIntoViewIfNeeded();
    await flag.click();
    await t.page.waitForTimeout(150);
    const box = await t.page.locator(".emoji-picker-status").boundingBox();
    t.assert.ok(box, "status rendered");
    t.assert.ok(box.y >= 0 && box.y < 800, `status at y=${box.y} is off screen`);
  } },
  { slug: "emoji-picker", name: "typing stays responsive with the full grid", async run(t) {
    await t.open();
    const box = t.page.getByRole("searchbox").or(t.main().getByRole("textbox")).first();
    await box.focus();
    const longest = await t.page.evaluate(() => new Promise((resolve) => {
      let max = 0;
      const observer = new PerformanceObserver((list) => { for (const e of list.getEntries()) max = Math.max(max, e.duration); });
      observer.observe({ type: "longtask", buffered: false });
      window.__stopLongTasks = () => { observer.disconnect(); return max; };
      resolve(true);
    }));
    t.assert.ok(longest);
    await t.page.keyboard.type("sm", { delay: 30 });
    const blocked = await t.page.evaluate(() => window.__stopLongTasks());
    t.assert.ok(blocked < 200, `keystrokes blocked the page for ${blocked}ms`);
  } },
  { slug: "emoji-picker", name: "no overflow at 375px", viewport: narrow, async run(t) {
    await t.open();
    await t.noOverflow();
  } },

  // ---------- string obfuscator ----------
  { slug: "string-obfuscator", name: "default matches it-tools", async run(t) {
    await t.open();
    t.assert.equal(await t.value("Obfuscated string"), "Lore* ***** ***** *** amet");
  } },
  { slug: "string-obfuscator", name: "each option changes the result, it-tools vectors", async run(t) {
    await t.open();
    await t.fill("String to obfuscate", "1234567890");
    await t.fill("Keep first", "2");
    await t.fill("Keep last", "2");
    t.assert.equal(await t.value("Obfuscated string"), "12******90");
    await t.fill("Keep first", "5");
    await t.fill("Keep last", "5");
    t.assert.equal(await t.value("Obfuscated string"), "1234567890");
    await t.fill("String to obfuscate", "12345 67890");
    await t.fill("Keep first", "4");
    await t.fill("Keep last", "0");
    t.assert.equal(await t.value("Obfuscated string"), "1234* *****");
    await t.main().getByLabel("Keep spaces").uncheck();
    await t.page.waitForTimeout(80);
    t.assert.equal(await t.value("Obfuscated string"), "1234*******");
  } },
  { slug: "string-obfuscator", name: "emoji stay whole and blank or negative keeps mean none", async run(t) {
    await t.open();
    await t.fill("String to obfuscate", "😀😀😀😀");
    await t.fill("Keep first", "1");
    await t.fill("Keep last", "1");
    t.assert.equal(await t.value("Obfuscated string"), "😀**😀");
    await t.fill("String to obfuscate", "abcd");
    await t.fill("Keep first", "");
    await t.fill("Keep last", "");
    t.assert.equal(await t.value("Obfuscated string"), "****");
    await t.fill("Keep first", "-3");
    t.assert.equal(await t.value("Obfuscated string"), "****");
  } },
  { slug: "string-obfuscator", name: "empty and copy", async run(t) {
    await t.open();
    await t.main().getByRole("button", { name: /copy/i }).first().click();
    await t.page.waitForTimeout(100);
    t.assert.equal(await t.clipboard(), "Lore* ***** ***** *** amet");
    await t.fill("String to obfuscate", "");
    t.assert.equal(await t.value("Obfuscated string"), "");
  } },
  { slug: "string-obfuscator", name: "no overflow at 375px", viewport: narrow, async run(t) {
    await t.open();
    await t.fill("String to obfuscate", "x".repeat(600));
    await t.noOverflow();
  } },

  // ---------- text diff ----------
  { slug: "text-diff", name: "seed models and char highlighting", async run(t) {
    await t.open();
    t.assert.equal(await t.value("Original", { exact: true }), "original text");
    t.assert.equal(await t.value("Modified", { exact: true }), "modified text");
    const marks = await t.page.locator(".text-diff-mark").allInnerTexts();
    t.assert.ok(marks.length > 0, "character marks rendered");
  } },
  { slug: "text-diff", name: "line numbers follow each side after an insert", async run(t) {
    await t.open();
    await t.fill("Original", "keep\nold\nend");
    await t.fill("Modified", "new1\nkeep\nold\nend");
    const rows = await t.page.locator(".text-diff-row").allInnerTexts();
    const endRow = rows.find((r) => r.includes("end"));
    t.assert.match(endRow.replace(/\s+/g, " "), /3 end 4 end/);
  } },
  { slug: "text-diff", name: "identical, empty, swap, reset, copy", async run(t) {
    await t.open();
    await t.fill("Original", "a\nb");
    await t.fill("Modified", "a\nb");
    await t.has("The two texts are identical.");
    await t.fill("Original", "");
    await t.fill("Modified", "");
    await t.has("Enter text in either pane to compare.");
    await t.hasNot("identical");
    await t.fill("Original", "a\nb");
    await t.fill("Modified", "a\nb\nc");
    await t.click("Copy unified diff");
    await t.page.waitForTimeout(100);
    t.assert.equal(await t.clipboard(), " a\n b\n+c");
    await t.click("Swap");
    t.assert.equal(await t.value("Original", { exact: true }), "a\nb\nc");
    t.assert.equal(await t.value("Modified", { exact: true }), "a\nb");
    await t.click("Reset");
    t.assert.equal(await t.value("Original", { exact: true }), "original text");
  } },
  { slug: "text-diff", name: "trailing newline difference is visible", async run(t) {
    await t.open();
    await t.fill("Original", "a");
    await t.fill("Modified", "a\n");
    await t.hasNot("identical");
    t.assert.equal(await t.page.locator(".text-diff-cell--added").count(), 1);
  } },
  { slug: "text-diff", name: "emoji are not split", async run(t) {
    await t.open();
    await t.fill("Original", "a😀b");
    await t.fill("Modified", "a😁b");
    const marks = await t.page.locator(".text-diff-mark").allInnerTexts();
    t.assert.deepEqual(marks, ["😀", "😁"]);
  } },
  { slug: "text-diff", name: "huge unrelated inputs do not freeze", async run(t) {
    await t.open();
    const lines = (seed) => Array.from({ length: 30000 }, (_, i) => `${seed}-${i}-${i * 7}`).join("\n");
    // Native setter: Playwright fill inserts line by line, which alone takes minutes in Chromium.
    const setValue = (selector, value) => t.page.locator(selector).evaluate((el, v) => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(el, v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }, value);
    const started = Date.now();
    await setValue("#text-diff-original", lines("left"));
    await setValue("#text-diff-modified", lines("right"));
    await t.page.waitForSelector("text=Showing the first 2,000 of 30,000 rows", { timeout: 15000 });
    const elapsed = Date.now() - started;
    console.log("text-diff 30k lines:", elapsed, "ms");
    t.assert.ok(elapsed < 8000, `took ${elapsed}ms`);
    await t.click("Copy unified diff");
    await t.page.waitForTimeout(150);
    t.assert.equal((await t.clipboard()).split("\n").length, 60000);
    t.assert.equal(await t.page.locator(".text-diff-row").count(), 2000);
  } },
  { slug: "text-diff", name: "no overflow at 375px with long lines", viewport: narrow, async run(t) {
    await t.open();
    await t.fill("Original", "x".repeat(500));
    await t.fill("Modified", "y".repeat(500));
    await t.noOverflow();
  } },

  // ---------- numeronym ----------
  { slug: "numeronym-generator", name: "it-tools vectors", async run(t) {
    await t.open();
    t.assert.equal(await t.value("Numeronym", { exact: true }), "");
    for (const [input, expected] of [["internationalization", "i18n"], ["accessibility", "a11y"], ["localization", "l10n"], ["abc", "abc"], ["test", "t2t"]]) {
      await t.fill("Word", input, { exact: true });
      t.assert.equal(await t.value("Numeronym", { exact: true }), expected);
    }
  } },
  { slug: "numeronym-generator", name: "emoji stay whole, whitespace ignored, copy", async run(t) {
    await t.open();
    await t.fill("Word", "😀bcd😀", { exact: true });
    t.assert.equal(await t.value("Numeronym", { exact: true }), "😀3😀");
    await t.fill("Word", "a😀😀b", { exact: true });
    t.assert.equal(await t.value("Numeronym", { exact: true }), "a2b");
    await t.fill("Word", " internationalization ", { exact: true });
    t.assert.equal(await t.value("Numeronym", { exact: true }), "i18n");
    await t.main().getByRole("button", { name: /copy/i }).first().click();
    await t.page.waitForTimeout(100);
    t.assert.equal(await t.clipboard(), "i18n");
  } },
  { slug: "numeronym-generator", name: "no overflow at 375px", viewport: narrow, async run(t) {
    await t.open();
    await t.fill("Word", "x".repeat(300), { exact: true });
    await t.noOverflow();
  } },

  // ---------- ascii text drawer ----------
  { slug: "ascii-text-drawer", name: "default art matches figlet Standard", async run(t) {
    await t.open();
    await t.page.waitForSelector("#ascii-drawer-output", { timeout: 20000 });
    await t.page.waitForTimeout(300);
    const art = await t.page.locator("#ascii-drawer-output").inputValue();
    // Reference comes from figlet in Node reading the font file on disk, not the browser's CDN path.
    const { createRequire } = await import("node:module");
    const figlet = createRequire(import.meta.url)("figlet");
    t.assert.equal(art, figlet.textSync("Ascii ART", { font: "Standard", width: 80, whitespaceBreak: true }));
  } },
  { slug: "ascii-text-drawer", name: "font, width, and text change output; copy", async run(t) {
    await t.open();
    await t.page.waitForSelector("#ascii-drawer-output", { timeout: 20000 });
    const output = () => t.page.locator("#ascii-drawer-output").inputValue();
    const standard = await output();
    await t.main().getByLabel("Font").selectOption("Big");
    await t.page.waitForFunction((prev) => {
      const el = document.querySelector("#ascii-drawer-output");
      return el && el.value !== prev;
    }, standard, { timeout: 20000 });
    const big = await output();
    t.assert.notEqual(big, standard);
    await t.fill("Width", "20");
    await t.page.waitForTimeout(150);
    const wrapped = await output();
    t.assert.ok(Math.max(...wrapped.split("\n").map((l) => l.length)) <= 20, "wrapped to width");
    t.assert.ok(wrapped.split("\n").length > big.split("\n").length);
    await t.fill("Your text", "Hi");
    await t.page.waitForTimeout(150);
    await t.main().getByRole("button", { name: /copy/i }).first().click();
    await t.page.waitForTimeout(100);
    t.assert.equal(await t.clipboard(), await output());
  } },
  { slug: "ascii-text-drawer", name: "font with a space in its name loads", async run(t) {
    await t.open();
    await t.page.waitForSelector("#ascii-drawer-output", { timeout: 20000 });
    for (const font of ["3D Diagonal", "Patorjk's Cheese", "ANSI Shadow"]) {
      await t.main().getByLabel("Font").selectOption(font);
      await t.page.waitForFunction(() => !document.body.innerText.includes("Loading font"), null, { timeout: 20000 });
      await t.page.waitForTimeout(200);
      await t.hasNot("Could not draw");
      t.assert.ok((await t.page.locator("#ascii-drawer-output").inputValue()).length > 10, font);
    }
  } },
  { slug: "ascii-text-drawer", name: "font and width persist across reload", async run(t) {
    await t.open();
    await t.page.waitForSelector("#ascii-drawer-output", { timeout: 20000 });
    await t.main().getByLabel("Font").selectOption("Slant");
    await t.fill("Width", "60");
    await t.page.waitForTimeout(200);
    await t.open();
    t.assert.equal(await t.main().getByLabel("Font").inputValue(), "Slant");
    t.assert.equal(await t.value("Width"), "60");
  } },
  { slug: "ascii-text-drawer", name: "bad stored values fall back to defaults", async run(t) {
    await t.page.addInitScript(() => {
      localStorage.setItem("tools:ascii-text-drawer:font", JSON.stringify("Nope"));
      localStorage.setItem("tools:ascii-text-drawer:width", JSON.stringify("wide"));
    });
    await t.open();
    t.assert.equal(await t.main().getByLabel("Font").inputValue(), "Standard");
    t.assert.equal(await t.value("Width"), "80");
  } },
  { slug: "ascii-text-drawer", name: "empty, emoji, and odd widths do not crash", async run(t) {
    await t.open();
    await t.page.waitForSelector("#ascii-drawer-output", { timeout: 20000 });
    await t.fill("Your text", "");
    await t.page.waitForTimeout(150);
    t.assert.equal(await t.page.locator("#ascii-drawer-output").inputValue(), "");
    await t.fill("Your text", "   ");
    await t.page.waitForTimeout(150);
    t.assert.equal(await t.page.locator("#ascii-drawer-output").inputValue(), "");
    await t.fill("Your text", "é😀 ok");
    await t.page.waitForTimeout(150);
    await t.hasNot("Could not draw");
    for (const width of ["0", "1", "", "99999", "-4"]) {
      await t.fill("Width", width);
      await t.page.waitForTimeout(100);
      await t.hasNot("Could not draw");
    }
  } },
  { slug: "ascii-text-drawer", name: "font load failure shows a helpful message", allowConsoleErrors: true, async run(t) {
    await t.page.route("**/unpkg.com/**", (r) => r.abort());
    await t.open();
    await t.page.waitForSelector("text=Could not draw this text", { timeout: 20000 });
    await t.has("Check your connection");
    t.assert.equal(await t.page.locator("#ascii-drawer-output").count(), 0);
  } },
  { slug: "ascii-text-drawer", name: "no overflow at 375px", viewport: narrow, async run(t) {
    await t.open();
    await t.page.waitForSelector("#ascii-drawer-output", { timeout: 20000 });
    await t.noOverflow();
  } },

  // ---------- qr code ----------
  { slug: "qrcode-generator", name: "default text decodes; collapsed controls are reachable", async run(t) {
    await t.open();
    t.assert.equal(await previewPayload(t), "https://dmeim.com");
    await t.main().getByText("Colors", { exact: true }).click();
    await t.main().getByText("Export options", { exact: true }).click();
    await t.page.waitForTimeout(150);
    await t.fill("Foreground color", "#112233");
    await t.fill("Background color", "#eeeeee");
    await t.fill("Quiet-zone margin", "1");
    await t.fill("PNG size", "512");
    await t.main().getByLabel("Error resistance").selectOption("H");
    t.assert.equal(await previewPayload(t), "https://dmeim.com");
    const png = await t.page.locator(".qr-preview img").getAttribute("src");
    const size = await t.page.evaluate(async (s) => { const i = new Image(); i.src = s; await i.decode(); return i.naturalWidth; }, png);
    t.assert.ok(size <= 512 && size >= 400, `png width ${size}`);
    const pixel = await t.page.evaluate(async (s) => {
      const i = new Image(); i.src = s; await i.decode();
      const c = document.createElement("canvas"); c.width = i.naturalWidth; c.height = i.naturalHeight;
      const x = c.getContext("2d"); x.drawImage(i, 0, 0);
      return [...x.getImageData(0, 0, 1, 1).data];
    }, png);
    t.assert.deepEqual(pixel, [0xee, 0xee, 0xee, 255]);
  } },
  { slug: "qrcode-generator", name: "transparent background is really transparent and scans", async run(t) {
    await t.open();
    await t.main().getByText("Colors", { exact: true }).click();
    await t.main().getByLabel("Transparent background for exports").check();
    t.assert.equal(await previewPayload(t), "https://dmeim.com");
    const alpha = await t.page.evaluate(async () => {
      const i = new Image(); i.src = document.querySelector(".qr-preview img").src; await i.decode();
      const c = document.createElement("canvas"); c.width = i.naturalWidth; c.height = i.naturalHeight;
      const x = c.getContext("2d"); x.drawImage(i, 0, 0);
      return x.getImageData(0, 0, 1, 1).data[3];
    });
    t.assert.equal(alpha, 0);
  } },
  { slug: "qrcode-generator", name: "error resistance changes the code", async run(t) {
    await t.open();
    await t.main().getByText("Export options", { exact: true }).click();
    const src = () => t.page.locator(".qr-preview img").getAttribute("src");
    await t.page.waitForTimeout(200);
    const medium = await src();
    await t.main().getByLabel("Error resistance").selectOption("H");
    await t.page.waitForTimeout(250);
    t.assert.notEqual(await src(), medium);
    t.assert.equal(await previewPayload(t), "https://dmeim.com");
  } },
  { slug: "qrcode-generator", name: "unicode text round trips", async run(t) {
    await t.open();
    await t.fill("Text", "héllo 😀 世界", { exact: true });
    t.assert.equal(await previewPayload(t), "héllo 😀 世界");
  } },
  { slug: "qrcode-generator", name: "empty and oversized text show helpful messages", async run(t) {
    await t.open();
    await t.fill("Text", "", { exact: true });
    await t.has("Text is required.");
    await t.has("Your QR code will appear here.");
    t.assert.equal(await t.page.locator(".qr-preview img").count(), 0);
    t.assert.ok(await t.main().getByRole("button", { name: "Download PNG" }).isDisabled());
    await t.fill("Text", "a".repeat(5000), { exact: true });
    await t.page.waitForTimeout(400);
    await t.has("too long for a QR code");
    t.assert.equal(await t.page.locator(".qr-preview img").count(), 0);
    await t.fill("Text", "back", { exact: true });
    t.assert.equal(await previewPayload(t), "back");
  } },
  { slug: "qrcode-generator", name: "download PNG and SVG both decode", async run(t) {
    await t.open("?type=text");
    await t.fill("Text", "download me", { exact: true });
    await t.page.waitForTimeout(250);
    const png = await t.download("Download PNG");
    t.assert.equal(png.name, "qr-code-download-me.png");
    const pngUrl = `data:image/png;base64,${fs.readFileSync(png.path).toString("base64")}`;
    t.assert.equal(await decodeQr(t.page, pngUrl), "download me");
    const svg = await t.download("Download SVG");
    t.assert.equal(svg.name, "qr-code-download-me.svg");
    t.assert.ok(svg.text.includes("<svg"));
    const svgUrl = `data:image/svg+xml;base64,${Buffer.from(svg.text).toString("base64")}`;
    t.assert.equal(await decodeQr(t.page, svgUrl), "download me");
  } },
  { slug: "qrcode-generator", name: "copy payload and SVG", async run(t) {
    await t.open();
    await t.click("Copy payload");
    await t.page.waitForTimeout(100);
    t.assert.equal(await t.clipboard(), "https://dmeim.com");
    await t.click("Copy SVG");
    await t.page.waitForTimeout(100);
    t.assert.ok((await t.clipboard()).includes("<svg"));
  } },
  { slug: "qrcode-generator", name: "wifi: every encryption type and hidden network decodes", async run(t) {
    await t.open("?type=wifi");
    await t.has("SSID is required.");
    await t.fill("SSID / network name", "Cafe");
    await t.has("Password is required");
    await t.fill("Password", "secret");
    t.assert.equal(await previewPayload(t), "WIFI:S:Cafe;T:WPA;P:secret;;");
    await t.main().getByLabel("Hidden SSID").check();
    t.assert.equal(await previewPayload(t), "WIFI:S:Cafe;T:WPA;P:secret;H:true;;");
    await t.main().getByLabel("Hidden SSID").uncheck();
    await t.main().getByLabel("Encryption").selectOption("WEP");
    t.assert.equal(await previewPayload(t), "WIFI:S:Cafe;T:WEP;P:secret;;");
    await t.main().getByLabel("Encryption").selectOption("nopass");
    t.assert.equal(await t.main().getByLabel("Password").count(), 0);
    t.assert.equal(await previewPayload(t), "WIFI:S:Cafe;;");
    await t.main().getByLabel("Hidden SSID").check();
    t.assert.equal(await previewPayload(t), "WIFI:S:Cafe;H:true;;");
  } },
  { slug: "qrcode-generator", name: "wifi: escaping survives a real decode", async run(t) {
    await t.open("?type=wifi");
    await t.fill("SSID / network name", 'My;Net:"1",2\\');
    await t.fill("Password", 'p;a:s"s,w\\d');
    t.assert.equal(await previewPayload(t), 'WIFI:S:My\\;Net\\:\\"1\\"\\,2\\\\;T:WPA;P:p\\;a\\:s\\"s\\,w\\\\d;;');
  } },
  { slug: "qrcode-generator", name: "wifi: EAP fields, all methods, anonymous, phase 2", async run(t) {
    await t.open("?type=wifi");
    await t.fill("SSID / network name", "Corp");
    await t.fill("Password", "pw");
    await t.main().getByLabel("Encryption").selectOption("WPA2-EAP");
    await t.has("identity is required");
    await t.fill("Identity", "alice");
    t.assert.equal(await previewPayload(t), "WIFI:S:Corp;T:WPA2-EAP;P:pw;E:PEAP;PH2:MSCHAPV2;I:alice;;");
    const methods = await t.main().getByLabel("EAP method").locator("option").allInnerTexts();
    t.assert.deepEqual([...methods].sort(), ["MD5", "POTP", "GTC", "TLS", "IKEv2", "SIM", "AKA", "AKA'", "TTLS", "PWD", "LEAP", "PSK", "FAST", "TEAP", "EKE", "NOOB", "PEAP"].sort());
    await t.main().getByLabel("EAP method").selectOption("AKA'");
    t.assert.equal(await previewPayload(t), "WIFI:S:Corp;T:WPA2-EAP;P:pw;E:AKA';PH2:MSCHAPV2;I:alice;;");
    await t.main().getByLabel("Phase 2 method").selectOption("None");
    t.assert.equal(await previewPayload(t), "WIFI:S:Corp;T:WPA2-EAP;P:pw;E:AKA';I:alice;;");
    await t.main().getByLabel("Use anonymous identity").check();
    t.assert.equal(await previewPayload(t), "WIFI:S:Corp;T:WPA2-EAP;P:pw;E:AKA';A:anon;;");
    t.assert.ok(await t.main().getByLabel("Identity", { exact: true }).isDisabled());
    await t.main().getByLabel("Hidden SSID").check();
    t.assert.equal(await previewPayload(t), "WIFI:S:Corp;T:WPA2-EAP;P:pw;E:AKA';A:anon;H:true;;");
  } },
  { slug: "qrcode-generator", name: "wifi: password stays out of the file name and URL", async run(t) {
    await t.open("?type=wifi");
    await t.fill("SSID / network name", "Cafe");
    await t.fill("Password", "hunter2secret");
    await t.page.waitForTimeout(250);
    const png = await t.download("Download PNG");
    t.assert.equal(png.name, "qr-code-wifi-cafe.png");
    t.assert.ok(!t.page.url().includes("hunter2"));
    const stored = await t.page.evaluate(() => JSON.stringify({ ...localStorage }));
    t.assert.ok(!stored.includes("hunter2"));
  } },
  { slug: "qrcode-generator", name: "other presets produce the right payload", async run(t) {
    await t.open("?type=email");
    await t.fill("Email address", "a@b.co");
    await t.fill("Subject", "Hello there");
    t.assert.equal(await previewPayload(t), "mailto:a@b.co?subject=Hello%20there");
    await t.main().getByLabel("QR type").selectOption("location");
    await t.fill("Latitude", "abc");
    await t.fill("Longitude", "1");
    await t.has("Latitude must be a number");
    await t.fill("Latitude", "40.7128");
    await t.fill("Longitude", "-74.0060");
    t.assert.equal(await previewPayload(t), "geo:40.7128,-74.0060");
    await t.main().getByLabel("QR type").selectOption("website");
    await t.fill("Website URL", "example.com");
    t.assert.equal(await previewPayload(t), "https://example.com");
    t.assert.ok(t.page.url().includes("type=website"));
  } },
  { slug: "qrcode-generator", name: "no overflow at 375px, wifi EAP open", viewport: narrow, async run(t) {
    await t.open("?type=wifi");
    await t.main().getByLabel("Encryption").selectOption("WPA2-EAP");
    await t.main().getByText("Colors", { exact: true }).click();
    await t.main().getByText("Export options", { exact: true }).click();
    await t.page.waitForTimeout(150);
    await t.noOverflow();
  } },

  // ---------- svg placeholder ----------
  { slug: "svg-placeholder-generator", name: "default output matches it-tools and the data URL decodes to it", async run(t) {
    await t.open();
    const expected = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 350" width="600" height="350">',
      '  <rect width="600" height="350" fill="#0e1014"></rect>',
      '  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="26px" fill="#d4bc8a">600x350</text>',
      "</svg>",
    ].join("\n");
    t.assert.equal(await t.value("SVG markup"), expected);
    t.assert.equal(await t.value("SVG data URI"), `data:image/svg+xml;base64,${Buffer.from(expected).toString("base64")}`);
  } },
  { slug: "svg-placeholder-generator", name: "each option changes the output", async run(t) {
    await t.open();
    await t.fill("Width", "200");
    await t.fill("Height", "100");
    await t.fill("Font size", "12");
    await t.fill("Background", "#ff0000");
    await t.fill("Text color", "#00ff00");
    await t.fill("Custom text", "Hi <you> & 😀");
    const svg = await t.value("SVG markup");
    t.assert.ok(svg.includes('viewBox="0 0 200 100" width="200" height="100"'));
    t.assert.ok(svg.includes('fill="#ff0000"'));
    t.assert.ok(svg.includes('font-size="12px" fill="#00ff00">Hi &lt;you&gt; &amp; 😀</text>'));
    const uri = await t.value("SVG data URI");
    t.assert.equal(Buffer.from(uri.split(",")[1], "base64").toString("utf8"), svg);
    await t.main().getByLabel("Add exact width/height").uncheck();
    await t.page.waitForTimeout(80);
    t.assert.ok((await t.value("SVG markup")).includes('viewBox="0 0 200 100">'));
    const parsed = await t.page.evaluate((s) => new DOMParser().parseFromString(s, "image/svg+xml").querySelector("parsererror") === null, await t.value("SVG markup"));
    t.assert.ok(parsed, "escaped markup parses as XML");
  } },
  { slug: "svg-placeholder-generator", name: "preview renders at the requested size", async run(t) {
    await t.open();
    await t.fill("Width", "321");
    await t.fill("Height", "123");
    await t.page.waitForTimeout(200);
    const size = await t.main().getByRole("img", { name: /placeholder preview/ }).evaluate(async (img) => { await img.decode(); return [img.naturalWidth, img.naturalHeight]; });
    t.assert.deepEqual(size, [321, 123]);
  } },
  { slug: "svg-placeholder-generator", name: "invalid numbers are clamped and shown", async run(t) {
    await t.open();
    await t.fill("Width", "0");
    await t.field("Width").blur();
    await t.page.waitForTimeout(80);
    t.assert.equal(await t.value("Width"), "1");
    t.assert.ok((await t.value("SVG markup")).includes('viewBox="0 0 1 350"'));
    await t.fill("Height", "99999");
    await t.field("Height").blur();
    await t.page.waitForTimeout(80);
    t.assert.equal(await t.value("Height"), "10000");
    await t.fill("Font size", "");
    await t.field("Font size").blur();
    await t.page.waitForTimeout(80);
    t.assert.equal(await t.value("Font size"), "1");
    await t.page.locator("#sp-background-text").fill("nope");
    await t.page.waitForTimeout(80);
    t.assert.ok((await t.value("SVG markup")).includes('fill="#0e1014"'));
  } },
  { slug: "svg-placeholder-generator", name: "copy and download", async run(t) {
    await t.open();
    await t.fill("Width", "64");
    await t.fill("Height", "48");
    const svg = await t.value("SVG markup");
    const uri = await t.value("SVG data URI");
    await t.click("Copy SVG");
    await t.page.waitForTimeout(100);
    t.assert.equal(await t.clipboard(), svg);
    await t.click("Copy data URI");
    await t.page.waitForTimeout(100);
    t.assert.equal(await t.clipboard(), uri);
    const file = await t.download("Download SVG");
    t.assert.equal(file.name, "placeholder-64x48.svg");
    t.assert.equal(file.text, svg);
  } },
  { slug: "svg-placeholder-generator", name: "no overflow at 375px", viewport: narrow, async run(t) {
    await t.open();
    await t.fill("Custom text", "x".repeat(300));
    await t.noOverflow();
  } },

  // ---------- camera recorder ----------
  { slug: "camera-recorder", name: "photo: start, capture, download a real PNG, delete", async run(t) {
    await t.open();
    await t.has("Camera is off");
    t.assert.ok(await t.main().getByRole("button", { name: "Take photo" }).isDisabled());
    await startCamera(t);
    await t.has("Camera is active");
    await t.click("Take photo");
    await t.page.waitForSelector(".capture-card img");
    await t.has("1 local capture.");
    const file = await t.download("Download");
    t.assert.match(file.name, /^image-\d{8}-\d{6}\.png$/);
    t.assert.equal(fs.readFileSync(file.path).subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    await t.click("Delete");
    await t.has("No captures yet");
  } },
  { slug: "camera-recorder", name: "video: record, pause, resume, stop, download a real WebM", async run(t) {
    await t.open();
    await startCamera(t);
    await t.click("Start recording");
    await t.main().getByRole("button", { name: "Pause" }).waitFor({ timeout: 5000 });
    await t.page.waitForTimeout(700);
    await t.click("Pause");
    await t.main().getByRole("button", { name: "Resume" }).waitFor({ timeout: 5000 });
    await t.page.waitForTimeout(200);
    await t.click("Resume");
    await t.main().getByRole("button", { name: "Pause" }).waitFor({ timeout: 5000 });
    await t.page.waitForTimeout(700);
    await t.click("Stop recording");
    await t.page.waitForSelector(".capture-card video", { timeout: 10000 });
    await t.has("Video recording saved");
    const file = await t.download("Download");
    t.assert.match(file.name, /^video-\d{8}-\d{6}\.(webm|mp4)$/);
    const bytes = fs.readFileSync(file.path);
    t.assert.ok(bytes.length > 1000, `only ${bytes.length} bytes`);
    if (file.name.endsWith(".webm")) t.assert.equal(bytes.subarray(0, 4).toString("hex"), "1a45dfa3");
    // A second recording must work too.
    await t.click("Start recording");
    await t.main().getByRole("button", { name: "Stop recording" }).waitFor({ timeout: 5000 });
    await t.page.waitForTimeout(500);
    await t.click("Stop recording");
    await t.has("Video recording saved");
    await t.page.waitForFunction(() => document.querySelectorAll(".capture-card video").length === 2, null, { timeout: 10000 });
    await t.click("Clear all");
    await t.has("No captures yet");
  } },
  { slug: "camera-recorder", name: "audio is requested by default and reaches the stream", async run(t) {
    await trackStreams(t.page);
    await t.open();
    await startCamera(t);
    const info = await t.page.evaluate(() => ({ audio: window.__streams[0].getAudioTracks().length, video: window.__streams[0].getVideoTracks().length }));
    t.assert.deepEqual(info, { audio: 1, video: 1 });
    await t.main().getByLabel("Include microphone audio in videos").uncheck();
    await t.click("Apply settings");
    await t.page.waitForFunction(() => window.__streams.length === 2 && window.__streams[1].getAudioTracks().length === 0, null, { timeout: 10000 });
    t.assert.equal(await t.page.evaluate(() => window.__streams[0].getTracks().every((tr) => tr.readyState === "ended")), true);
  } },
  { slug: "camera-recorder", name: "missing microphone still starts the camera", async run(t) {
    await t.page.addInitScript(() => {
      const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = async (c) => {
        if (c.audio) throw new DOMException("Requested device not found", "NotFoundError");
        return original(c);
      };
    });
    await t.open();
    await startCamera(t);
    await t.has("no microphone was found");
  } },
  { slug: "camera-recorder", name: "denied permission gives a helpful message and retry", async run(t) {
    await t.page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = async () => { throw new DOMException("Permission denied", "NotAllowedError"); };
    });
    await t.open();
    await t.click("Start camera");
    await t.has("Permission was denied");
    await t.has("lock icon");
    await t.has("Camera could not be started.");
    t.assert.equal(await t.main().getByRole("button", { name: "Try again" }).count(), 1);
    await t.click("Try again");
    await t.has("Permission was denied");
  } },
  { slug: "camera-recorder", name: "missing camera and busy camera messages", async run(t) {
    await t.page.addInitScript(() => {
      window.__err = "NotFoundError";
      navigator.mediaDevices.getUserMedia = async () => { throw new DOMException("x", window.__err); };
    });
    await t.open();
    await t.click("Start camera");
    await t.has("No camera or microphone");
    await t.page.evaluate(() => { window.__err = "NotReadableError"; });
    await t.click("Try again");
    await t.has("other app");
  } },
  { slug: "camera-recorder", name: "unsupported browser explains itself", async run(t) {
    await t.page.addInitScript(() => { Object.defineProperty(navigator, "mediaDevices", { value: undefined }); });
    await t.open();
    await t.has("Camera capture is unavailable");
  } },
  { slug: "camera-recorder", name: "mirror and flip change the captured image", async run(t) {
    await t.open();
    await startCamera(t);
    await t.click("Mirror");
    t.assert.equal(await t.page.locator(".camera-preview-frame video").evaluate((v) => v.style.transform), "scaleX(-1) scaleY(1)");
    await t.click("Flip");
    t.assert.equal(await t.page.locator(".camera-preview-frame video").evaluate((v) => v.style.transform), "scaleX(-1) scaleY(-1)");
    await t.click("Start recording");
    await t.main().getByRole("button", { name: "Stop recording" }).waitFor({ timeout: 5000 });
    await t.page.waitForTimeout(600);
    await t.click("Stop recording");
    await t.page.waitForSelector(".capture-card video", { timeout: 10000 });
    await t.has("Video recording saved");
  } },
  { slug: "camera-recorder", name: "stop camera releases tracks", async run(t) {
    await trackStreams(t.page);
    await t.open();
    await startCamera(t);
    await t.click("Stop camera");
    await t.has("Camera stopped.");
    t.assert.equal(await t.page.evaluate(() => window.__streams.every((s) => s.getTracks().every((tr) => tr.readyState === "ended"))), true);
    await t.has("Camera is off");
  } },
  { slug: "camera-recorder", name: "unplugged camera is reported", async run(t) {
    await trackStreams(t.page);
    await t.open();
    await startCamera(t);
    await t.page.evaluate(() => {
      const track = window.__streams[0].getVideoTracks()[0];
      track.stop();
      track.dispatchEvent(new Event("ended"));
    });
    await t.page.waitForTimeout(100);
    await t.has("disconnected");
    t.assert.equal(await t.main().getByRole("button", { name: "Start camera" }).count(), 1);
  } },
  { slug: "camera-recorder", name: "camera is released when leaving for another tool", async run(t) {
    await trackStreams(t.page);
    await t.open();
    await startCamera(t);
    await t.page.evaluate(() => { window.__sameDocument = true; });
    const link = t.page.locator('a[href*="/tools/"]').filter({ hasNotText: "Camera" }).last();
    await link.evaluate((a) => a.click());
    await t.page.waitForFunction(() => !location.pathname.includes("camera-recorder"), null, { timeout: 15000 });
    await t.page.waitForTimeout(400);
    const result = await t.page.evaluate(() => ({
      sameDocument: window.__sameDocument === true,
      released: (window.__streams ?? []).every((s) => s.getTracks().every((tr) => tr.readyState === "ended")),
    }));
    console.log("camera nav:", JSON.stringify(result));
    t.assert.equal(result.released, true);
  } },
  { slug: "camera-recorder", name: "leaving during the permission prompt still releases the camera", async run(t) {
    await t.page.addInitScript(() => {
      const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      window.__streams = [];
      navigator.mediaDevices.getUserMedia = async (c) => {
        await new Promise((r) => setTimeout(r, 1200));
        const stream = await original(c);
        window.__streams.push(stream);
        return stream;
      };
    });
    await t.open();
    await t.click("Start camera");
    const link = t.page.locator('a[href*="/tools/"]').filter({ hasNotText: "Camera" }).last();
    await link.evaluate((a) => a.click());
    await t.page.waitForFunction(() => window.__streams.length === 1, null, { timeout: 8000 });
    await t.page.waitForTimeout(300);
    t.assert.equal(await t.page.evaluate(() => window.__streams[0].getTracks().every((tr) => tr.readyState === "ended")), true);
  } },
  { slug: "camera-recorder", name: "leaving mid recording releases the camera without errors", async run(t) {
    await trackStreams(t.page);
    await t.open();
    await startCamera(t);
    await t.click("Mirror");
    await t.click("Start recording");
    await t.main().getByRole("button", { name: "Stop recording" }).waitFor({ timeout: 5000 });
    await t.page.waitForTimeout(400);
    const link = t.page.locator('a[href*="/tools/"]').filter({ hasNotText: "Camera" }).last();
    await link.evaluate((a) => a.click());
    await t.page.waitForTimeout(800);
    t.assert.equal(await t.page.evaluate(() => window.__streams.every((s) => s.getTracks().every((tr) => tr.readyState === "ended"))), true);
  } },
  { slug: "camera-recorder", name: "no overflow at 375px with captures", viewport: narrow, async run(t) {
    await t.open();
    await startCamera(t);
    await t.click("Take photo");
    await t.page.waitForSelector(".capture-card img");
    await t.noOverflow();
  } },
];
