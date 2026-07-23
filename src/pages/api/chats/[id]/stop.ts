import type { APIRoute } from "astro";
import {
  abortGeneration,
  denyIfAccessRequired,
  getChat,
  getDb,
  getRuntimeEnv,
  json,
  methodNotAllowed,
  setChatGenerating,
  setChatLastError,
} from "@/lib/chat";

export const prerender = false;

/**
 * Explicit user Stop: abort in-isolate generation if present, clear generating flag.
 * Partials are persisted via streamText onAbort when the controller aborts.
 * If no live controller (different isolate / already finished), just clear busy state.
 */
export const POST: APIRoute = async (context) => {
  const env = getRuntimeEnv();
  const denied = denyIfAccessRequired(context.request, env);
  if (denied) return denied;

  const id = context.params.id;
  if (!id) {
    return json({ error: "Missing chat id" }, { status: 400 });
  }

  try {
    const db = getDb(env);
    const row = await getChat(db, id);
    if (!row) {
      return json({ error: "Chat not found" }, { status: 404 });
    }

    const aborted = abortGeneration(id);
    if (!aborted && row.generating_at) {
      // Stale generating flag (isolate recycled / finished without clear).
      await setChatGenerating(db, id, false);
      await setChatLastError(db, id, null);
    }

    return json({ ok: true, aborted });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to stop chat";
    return json({ error: message }, { status: 500 });
  }
};

export const ALL: APIRoute = async () => methodNotAllowed(["POST"]);
