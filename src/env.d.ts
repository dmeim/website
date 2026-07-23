/// <reference path="../worker-configuration.d.ts" />
/// <reference types="astro/client" />

interface Env {
  OPENCODE_API_KEY?: string;
  REQUIRE_ACCESS?: string;
}

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}
