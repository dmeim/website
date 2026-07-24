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
      "src/lib/chat/**/*.test.ts",
      "src/scripts/**/*.test.ts",
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
