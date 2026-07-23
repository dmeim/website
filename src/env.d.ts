/// <reference path="../worker-configuration.d.ts" />
/// <reference types="astro/client" />

declare namespace Cloudflare {
  interface Env {
    OPENCODE_API_KEY?: string;
    REQUIRE_ACCESS?: string;
  }
}

interface Env extends Cloudflare.Env {}

declare namespace App {
  interface Locals extends import("@astrojs/cloudflare").Runtime {}
}
