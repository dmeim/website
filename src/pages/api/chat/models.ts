import type { APIRoute } from "astro";
import {
  denyIfAccessRequired,
  getRuntimeEnv,
  json,
  methodNotAllowed,
} from "@/lib/chat";
import { getCachedGoModels } from "@/lib/chat/models-cache";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const env = getRuntimeEnv(context);
  const denied = denyIfAccessRequired(context.request, env);
  if (denied) return denied;

  try {
    const models = await getCachedGoModels(env.OPENCODE_API_KEY);
    return json({ models });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load models";
    return json({ error: message }, { status: 500 });
  }
};

export const ALL: APIRoute = async () => methodNotAllowed(["GET"]);
