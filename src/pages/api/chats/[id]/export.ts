import type { APIRoute } from "astro";
import {
  chatToMarkdownExport,
  chatToSummary,
  denyIfAccessRequired,
  getChat,
  getDb,
  getRuntimeEnv,
  json,
  listMessages,
  methodNotAllowed,
} from "@/lib/chat";

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
    const messages = await listMessages(db, id);
    const chat = chatToSummary(row);
    const markdown = chatToMarkdownExport(chat, messages);
    const safeTitle =
      chat.title.replace(/[^\w\-]+/g, "_").slice(0, 48) || "chat";
    return new Response(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeTitle}.md"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to export chat";
    return json({ error: message }, { status: 500 });
  }
};

export const ALL: APIRoute = async () => methodNotAllowed(["GET"]);
