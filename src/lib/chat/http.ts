import type { APIContext } from "astro";

export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function getRuntimeEnv(context: APIContext): Env {
  return context.locals.runtime.env;
}

export function methodNotAllowed(allowed: string[]): Response {
  return json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: allowed.join(", ") } },
  );
}
