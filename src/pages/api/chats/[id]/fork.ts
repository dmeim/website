import type { APIRoute } from "astro";
import {
  denyIfAccessRequired,
  forkChat,
  getDb,
  getRuntimeEnv,
  json,
  methodNotAllowed,
} from "@/lib/chat";

export const prerender = false;

/**
 * POST /api/chats/:id/fork
 * Body: { messageId?: string, editContent?: string }
 * - No messageId: fork full history.
 * - messageId only: fork through that message (inclusive).
 * - messageId + editContent: branch from that user message with new text
 *   (original chat unchanged); client should then regenerate.
 */
export const POST: APIRoute = async (context) => {
  const env = getRuntimeEnv();
  const denied = denyIfAccessRequired(context.request, env);
  if (denied) return denied;

  const id = context.params.id;
  if (!id) {
    return json({ error: "Missing chat id" }, { status: 400 });
  }

  let body: { messageId?: string; editContent?: string } = {};
  try {
    body = (await context.request.json()) as typeof body;
  } catch {
    // Empty body = full fork.
    body = {};
  }

  const messageId =
    typeof body.messageId === "string" && body.messageId.trim()
      ? body.messageId.trim()
      : undefined;
  const editContent =
    typeof body.editContent === "string" ? body.editContent : undefined;

  try {
    const db = getDb(env);
    const result = await forkChat(db, {
      sourceChatId: id,
      throughMessageId: messageId,
      editContent,
    });
    if (!result.ok) {
      return json({ error: result.error }, { status: result.status });
    }
    return json(
      {
        chat: result.chat,
        messages: result.messages,
        edited: result.edited,
      },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fork chat";
    return json({ error: message }, { status: 500 });
  }
};

export const ALL: APIRoute = async () => methodNotAllowed(["POST"]);
