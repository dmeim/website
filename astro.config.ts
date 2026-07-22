import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import type { Plugin } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const nodeTlsStub = path.resolve(rootDir, "src/shims/node-tls.ts");

/**
 * Cloudflare workerd SSR uses a separate Vite environment. Mid-request dep
 * discovery (lucide, @lucide/astro, framer-motion, transitions) triggers a
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
  "lucide",
  "@lucide/astro",
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

// Preserve Cloudflare Workers adapter (current dmeim stack).
// React islands + Framer Motion borrowed from Midnight Concert Hall reference.
export default defineConfig({
  adapter: cloudflare(),
  site: "https://dmeim.com",
  integrations: [react()],
  vite: {
    plugins: [optimizeCloudflareSsrDeps()],
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
