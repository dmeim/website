/// <reference path="../worker-configuration.d.ts" />
/// <reference types="astro/client" />

interface Env extends Cloudflare.Env {}

declare namespace App {
  interface Locals extends import("@astrojs/cloudflare").Runtime {}
}
