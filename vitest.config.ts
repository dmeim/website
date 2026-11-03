import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: [
      "src/lib/tools/**/*.service.test.ts",
      "src/lib/orthodox/**/*.test.ts",
      "src/lib/gallery/**/*.test.ts",
      "src/lib/projects/**/*.test.ts",
    ],
    globals: false,
    server: {
      deps: {
        // iarna-toml-esm ships ESM sources inside a CommonJS package
        inline: ["iarna-toml-esm"],
      },
    },
  },
});
