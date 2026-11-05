export default [
  { slug: "case-converter", name: "digits and other scripts survive in the page", async run(t) {
    await t.open();
    const input = t.main().locator("textarea, input").first();
    await input.fill("version2 Привет");
    await t.page.waitForTimeout(150);
    await t.has("version2-привет");
    await t.has("version2_привет");
    await t.has("version2Привет");
  } },
];
