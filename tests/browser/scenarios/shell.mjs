const ready = (page) => page.waitForFunction(() => !document.querySelector(".tools-mount__loading") && !document.querySelector(".tools-shell-fallback"), null, { timeout: 60000 });
export default [
  { slug: "(landing)", name: "landing shows counts and search finds a tool", async run(t) {
    const { page, assert } = t;
    await page.goto(`${t.BASE}/tools`, { waitUntil: "load" }); await ready(page);
    await t.has("86 tools in 11 groups");
    await page.getByLabel("Find a tool").fill("sha256");
    await page.waitForTimeout(150);
    await t.has("Hash text");
    await page.getByLabel("Find a tool").fill("zzzznope");
    await page.waitForTimeout(150);
    await t.has("No matching tools");
    await page.getByLabel("Find a tool").fill("slugify");
    await page.waitForTimeout(150);
    await page.locator("main").getByRole("link", { name: /Slugify string/ }).click();
    await page.waitForURL("**/tools/slugify-string");
    await ready(page);
    await page.locator("main").getByLabel("Your string to slugify").waitFor();
    assert.match(await page.title(), /Slugify string/);
  } },
  { slug: "(rail)", name: "rail swaps tools, back and forward restore them", async run(t) {
    const { page, assert } = t;
    await page.goto(`${t.BASE}/tools/hash-text`, { waitUntil: "load" }); await ready(page);
    await page.locator("main").getByLabel("Your text to hash").waitFor();
    const rail = page.locator("nav a[data-tool-slug='bcrypt']").first();
    await rail.click();
    await page.waitForURL("**/tools/bcrypt"); await ready(page);
    await page.locator("main h1", { hasText: "Bcrypt" }).waitFor();
    await page.goBack(); await page.waitForURL("**/tools/hash-text"); await ready(page);
    await page.locator("main h1", { hasText: "Hash text" }).waitFor();
    await page.goForward(); await page.waitForURL("**/tools/bcrypt"); await ready(page);
    await page.locator("main h1", { hasText: "Bcrypt" }).waitFor();
    assert.match(await page.title(), /Bcrypt/);
  } },
  { slug: "(rail)", name: "every tool in the rail links to a real page", async run(t) {
    const { page, assert } = t;
    await page.goto(`${t.BASE}/tools`, { waitUntil: "load" }); await ready(page);
    const hrefs = await page.locator("nav a[data-tool-slug]").evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute("href")))]);
    assert.equal(hrefs.length, 86);
    for (const href of hrefs) { const r = await page.request.get(`${t.BASE}${href}`); assert.equal(r.status(), 200, href); }
  } },
  { slug: "(unknown)", name: "unknown tool slug is a 404", allowConsoleErrors: true, async run(t) {
    const r = await t.page.request.get(`${t.BASE}/tools/not-a-tool`); t.assert.equal(r.status(), 404);
  } },
  { slug: "(mobile)", name: "phone width: landing and a tool do not overflow", viewport: { width: 375, height: 800 }, async run(t) {
    const { page } = t;
    await page.goto(`${t.BASE}/tools`, { waitUntil: "load" }); await ready(page); await t.noOverflow();
    await page.goto(`${t.BASE}/tools/hash-text`, { waitUntil: "load" }); await ready(page); await t.noOverflow();
  } },
];
