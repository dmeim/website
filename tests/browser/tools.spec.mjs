import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "@playwright/test";
import caseConverter from "./scenarios/case-converter.mjs";
import converter from "./scenarios/converter.mjs";
import crypto from "./scenarios/crypto.mjs";
import cryptoWebIndependent from "./scenarios/crypto-web-independent.mjs";
import dev from "./scenarios/dev.mjs";
import keys from "./scenarios/keys.mjs";
import netmath from "./scenarios/netmath.mjs";
import shell from "./scenarios/shell.mjs";
import textmedia from "./scenarios/textmedia.mjs";
import web from "./scenarios/web.mjs";

const SUITES = {
  shell,
  crypto,
  converter,
  web,
  dev,
  netmath,
  textmedia,
  "case-converter": caseConverter,
  "crypto-web-independent": cryptoWebIndependent,
  keys,
};

/** The helpers every scenario receives as `t`. */
function createHelpers(page, slug, baseURL) {
  const main = () => page.locator("main");
  const t = {
    page,
    assert,
    main,
    BASE: baseURL,
    /** Open the tool and wait until the lazy island has mounted. */
    open: async (query = "") => {
      await page.goto(`${baseURL}/tools/${slug}${query}`, { waitUntil: "load", timeout: 90_000 });
      await page.waitForFunction(
        () =>
          !document.querySelector(".tools-mount__loading") &&
          !document.querySelector(".tools-shell-fallback") &&
          (document.querySelector("main")?.innerText?.length ?? 0) > 20,
        null,
        { timeout: 60_000 },
      );
      await page.waitForTimeout(150);
    },
    /** Field located by its visible label. */
    field: (label, options = {}) => main().getByLabel(label, { exact: options.exact ?? false }).first(),
    fill: async (label, value, options) => {
      await t.field(label, options).fill(String(value));
      await page.waitForTimeout(80);
    },
    value: async (label, options) => t.field(label, options).inputValue(),
    text: () => main().innerText(),
    has: async (needle) => {
      const text = await main().innerText();
      assert.ok(text.includes(needle), `expected page to contain ${JSON.stringify(needle)}; got: ${JSON.stringify(text.slice(0, 800))}`);
    },
    hasNot: async (needle) => {
      const text = await main().innerText();
      assert.ok(!text.includes(needle), `expected page NOT to contain ${JSON.stringify(needle)}`);
    },
    click: async (name, options = {}) => {
      await main().getByRole("button", { name, exact: options.exact ?? false }).nth(options.nth ?? 0).click();
      await page.waitForTimeout(80);
    },
    clipboard: () => page.evaluate(() => navigator.clipboard.readText()),
    /** Click a download trigger and return { name, text, path }. */
    download: async (name) => {
      const [download] = await Promise.all([page.waitForEvent("download", { timeout: 15_000 }), t.click(name)]);
      const file = await download.path();
      return { name: download.suggestedFilename(), text: fs.readFileSync(file, "utf8"), path: file };
    },
    /** Page-level horizontal overflow at the current viewport. */
    noOverflow: async () => {
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(overflow <= 0, `page overflows horizontally by ${overflow}px`);
    },
  };
  return t;
}

async function runScenario(scenario, browser, baseURL, testInfo) {
  const context = await browser.newContext({
    viewport: scenario.viewport ?? { width: 1280, height: 900 },
    colorScheme: scenario.colorScheme ?? "light",
    permissions: ["clipboard-read", "clipboard-write", "camera", "microphone"],
  });
  await context.route("**/static.cloudflareinsights.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/javascript", body: "" }),
  );
  const page = await context.newPage();
  const browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(`pageerror: ${String(error).slice(0, 300)}`));
  page.on("console", (message) => {
    if (message.type() === "error" && !scenario.allowConsoleErrors) browserErrors.push(`console: ${message.text().slice(0, 300)}`);
  });

  try {
    await scenario.run(createHelpers(page, scenario.slug, baseURL));
    assert.deepEqual(browserErrors, [], "browser errors during scenario");
  } catch (error) {
    await page.screenshot({ path: testInfo.outputPath("failure.png"), fullPage: true }).catch(() => {});
    throw error;
  } finally {
    await context.close();
  }
}

for (const [suite, scenarios] of Object.entries(SUITES)) {
  test.describe(suite, () => {
    const seen = new Map();
    for (const scenario of scenarios) {
      const base = `${scenario.slug}: ${scenario.name}`;
      const count = (seen.get(base) ?? 0) + 1;
      seen.set(base, count);
      const title = count === 1 ? base : `${base} (${count})`;
      test(title, async ({ browser, baseURL }, testInfo) => {
        await runScenario(scenario, browser, baseURL, testInfo);
      });
    }
  });
}
