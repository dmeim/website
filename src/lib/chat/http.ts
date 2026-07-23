import { env } from "cloudflare:workers";

export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(data), { ...init, headers });
}

/** Cloudflare bindings + secrets (D1, R2, OPENCODE_API_KEY, …). */
export function getRuntimeEnv(): Env {
  return env;
}

export function methodNotAllowed(allowed: string[]): Response {
  return json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: allowed.join(", ") } },
  );
}
