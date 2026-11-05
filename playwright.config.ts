import { defineConfig } from "@playwright/test";

// Fixed so `webServer` fails loudly instead of testing another project on a shared port.
const PORT = 4399;

export default defineConfig({
  testDir: "./tests/browser",
  outputDir: "./test-results",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  timeout: 120_000,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    browserName: "chromium",
    launchOptions: {
      args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
    },
  },
  webServer: {
    command: `node tests/browser/serve-dist.mjs ${PORT}`,
    url: `http://127.0.0.1:${PORT}/tools`,
    reuseExistingServer: false,
  },
});
