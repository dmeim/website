import type { APIRoute } from "astro";
import {
  denyIfAccessRequired,
  getChat,
  getDb,
  getRuntimeEnv,
  json,
  methodNotAllowed,
} from "@/lib/chat";
import type { ChatStatusDto } from "@/lib/chat/types";

export const prerender = false;

export const GET: APIRoute = async (context) => {
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
    const generatingAt = row.generating_at ?? null;
    const status: ChatStatusDto = {
      chatId: id,
      generating: generatingAt != null,
      generatingAt,
    };
    return json(status);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load chat status";
    return json({ error: message }, { status: 500 });
  }
};

export const ALL: APIRoute = async () => methodNotAllowed(["GET"]);
