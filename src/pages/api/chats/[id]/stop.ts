import type { APIRoute } from "astro";
import {
  abortGeneration,
  clearChatGeneratingIfMatch,
  denyIfAccessRequired,
  getChat,
  getDb,
  getRuntimeEnv,
  json,
  methodNotAllowed,
  setChatLastError,
} from "@/lib/chat";

export const prerender = false;

/**
 * Explicit user Stop: abort in-isolate generation if present, clear generating
 * flag for the observed epoch only (so a newer generation is not wiped).
 * Partials are persisted via streamText onAbort when the controller aborts.
 * If no live controller (different isolate / already finished), still try to
 * clear the busy flag observed in D1.
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

    const generatingAt = row.generating_at;
    const aborted = abortGeneration(id);
    if (generatingAt) {
      const cleared = await clearChatGeneratingIfMatch(db, id, generatingAt);
      // Stale flag (isolate recycled / finished without clear): also drop error.
      if (cleared && !aborted) {
        await setChatLastError(db, id, null);
      }
    }

    return json({ ok: true, aborted });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to stop chat";
    return json({ error: message }, { status: 500 });
  }
};

export const ALL: APIRoute = async () => methodNotAllowed(["POST"]);
