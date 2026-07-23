/**
 * Defense-in-depth Access checks.
 * Primary gate is Cloudflare Access at the edge.
 * In local/dev, when no Access headers are present, requests are allowed.
 */

export interface AccessIdentity {
  email: string | null;
  authenticated: boolean;
}

export function readAccessIdentity(request: Request): AccessIdentity {
  const email =
    request.headers.get("Cf-Access-Authenticated-User-Email")?.trim() || null;
  return {
    email,
    authenticated: Boolean(email),
  };
}

/**
 * Returns a Response when the request should be blocked, otherwise null.
 * Only enforces when Access headers indicate an Access session context
 * is expected — i.e. when `CF-Access-Jwt-Assertion` is present but email
 * is missing, or when `REQUIRE_ACCESS=1` is set in the environment.
 */
export function denyIfAccessRequired(
  request: Request,
  env: { REQUIRE_ACCESS?: string },
): Response | null {
  const identity = readAccessIdentity(request);
  const jwt = request.headers.get("Cf-Access-Jwt-Assertion");
  const require = env.REQUIRE_ACCESS === "1" || env.REQUIRE_ACCESS === "true";

  if (require && !identity.authenticated) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // JWT present but email missing → treat as unauthenticated
  if (jwt && !identity.authenticated) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return null;
}
