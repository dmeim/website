import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import type { Plugin } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const nodeTlsStub = path.resolve(rootDir, "src/shims/node-tls.ts");

/**
 * Cloudflare workerd SSR uses a separate Vite environment. Mid-request dep
 * discovery (framer-motion, transitions) triggers a
 * program reload that desyncs React's hook dispatcher → Invalid hook call
 * inside MotionConfig. Pre-bundle island deps in ONE pass at startup.
 *
 * @see https://github.com/withastro/astro/issues/16529
 * @see https://github.com/withastro/astro/issues/17166
 */
const CLOUDFLARE_SSR_OPTIMIZE_DEPS = [
  "react",
  "react-dom",
  "react-dom/client",
  "react-dom/server.edge",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
  "framer-motion",
  "@phosphor-icons/react/dist/ssr",
  // Keep in sync with the deep imports in src/ui/icons/token-icons.tsx.
  ...["BTC", "DOGE", "ETH", "SOL", "TRX", "USDC", "USDT", "XRP"].map(
    (ticker) => `@web3icons/react/icons/tokens/Token${ticker}`,
  ),
  "markdown-it",
  // ClientRouter pulls these; mid-request discovery reloads workerd and
  // desyncs React (Invalid hook call in MotionConfig).
  "astro/virtual-modules/transitions.js",
  "astro/virtual-modules/transitions-events.js",
  "astro/virtual-modules/transitions-router.js",
  "astro/virtual-modules/transitions-swap-functions.js",
  "astro/virtual-modules/transitions-types.js",
];

function optimizeCloudflareSsrDeps(): Plugin {
  return {
    name: "optimize-cloudflare-ssr-deps",
    configEnvironment(name) {
      if (name === "client") return;
      return {
        optimizeDeps: {
          include: CLOUDFLARE_SSR_OPTIMIZE_DEPS,
        },
      };
    },
  };
}

/** Workers Static Assets limits: https://developers.cloudflare.com/workers/platform/limits/#static-assets */
const ASSET_MAX_BYTES = 25 * 1024 * 1024;
const ASSET_FILES_FREE_PLAN = 20_000;

function listFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
}

/**
 * Fail the build on any file Cloudflare would reject at deploy (over 25 MiB),
 * so an oversized gallery video is caught here with its name, not as an
 * upload error. Also warns when the file count nears the free-plan cap.
 */
function cloudflareAssetLimits(): AstroIntegration {
  return {
    name: "cloudflare-asset-limits",
    hooks: {
      "astro:build:done": ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const files = listFiles(root);
        const tooBig = files
          .map((file) => ({ file: path.relative(root, file), size: fs.statSync(file).size }))
          .filter(({ size }) => size > ASSET_MAX_BYTES);
        if (tooBig.length > 0) {
          const list = tooBig.map(({ file, size }) => `  ${file} (${(size / 1024 / 1024).toFixed(1)} MiB)`).join("\n");
          throw new Error(
            `Cloudflare serves static files up to 25 MiB; these are larger:\n${list}\n` +
              "Shrink them (re-encode video, use JPEG/WebP for photos) or host them in R2.",
          );
        }
        const level = files.length > ASSET_FILES_FREE_PLAN * 0.9 ? "warn" : "info";
        logger[level](`${files.length} static files (Workers Free allows ${ASSET_FILES_FREE_PLAN}, Paid 100,000).`);
      },
    },
  };
}

// Preserve Cloudflare Workers adapter (current dmeim stack).
// React islands + Framer Motion borrowed from Midnight Concert Hall reference.
export default defineConfig({
  // Resize images with sharp at build (prerendered pages only) instead of the
  // default runtime Cloudflare Images binding, which is metered per transform.
  adapter: cloudflare({ imageService: "compile" }),
  site: "https://dmeim.com",
  // /about builds about.html, so pages are served at their link path with no
  // trailing-slash redirect, and canonical URLs match the nav links.
  build: { format: "file" },
  integrations: [
    react(),
    sitemap({ filter: (page) => !/\/(ui|colors)$/.test(page) }),
    cloudflareAssetLimits(),
  ],
  vite: {
    plugins: [optimizeCloudflareSsrDeps()],
    server: {
      // Dev server only: reach it from NetBird peers. Vite checks hostnames
      // only and always allows raw IPs, so 100.100.0.0/16 and
      // fd10:100:100::/64 need no entry; this adds the NetBird DNS names.
      allowedHosts: [".netbird.selfhosted"],
    },
    resolve: {
      dedupe: ["react", "react-dom"],
      // workerd (astro + Cloudflare adapter) needs the edge server build
      alias: {
        "react-dom/server": "react-dom/server.edge",
        // pdf-signature-reader (client-only) expects Node `tls.rootCertificates`
        tls: nodeTlsStub,
      },
    },
    optimizeDeps: {
      include: CLOUDFLARE_SSR_OPTIMIZE_DEPS,
    },
  },
});
