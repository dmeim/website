import type { APIRoute } from "astro";
import {
  DEFAULT_CHAT_MODEL_ID,
  createChat,
  denyIfAccessRequired,
  getDb,
  getRuntimeEnv,
  json,
  listChats,
  methodNotAllowed,
  parseMcpSettings,
} from "@/lib/chat";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const env = getRuntimeEnv();
  const denied = denyIfAccessRequired(context.request, env);
  if (denied) return denied;

  const archivedParam = context.url.searchParams.get("archived");
  const archived = archivedParam === "1" || archivedParam === "true";

  try {
    const db = getDb(env);
    const chats = await listChats(db, archived);
    return json({ chats });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list chats";
    return json({ error: message }, { status: 500 });
  }
};

export const POST: APIRoute = async (context) => {
  const env = getRuntimeEnv();
  const denied = denyIfAccessRequired(context.request, env);
  if (denied) return denied;

  let body: { title?: string; modelId?: string; mcpSettings?: unknown } = {};
  try {
    body = (await context.request.json()) as typeof body;
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const modelId =
    typeof body.modelId === "string" && body.modelId.trim()
      ? body.modelId.trim()
      : DEFAULT_CHAT_MODEL_ID;
  const title =
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim()
      : undefined;
  const mcpSettings =
    body.mcpSettings !== undefined
      ? parseMcpSettings(body.mcpSettings)
      : undefined;

  try {
    const db = getDb(env);
    const chat = await createChat(db, { title, modelId, mcpSettings });
    return json({ chat }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create chat";
    return json({ error: message }, { status: 500 });
  }
};

export const ALL: APIRoute = async () => methodNotAllowed(["GET", "POST"]);
