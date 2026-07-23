import type { APIRoute } from "astro";
import { waitUntil } from "cloudflare:workers";
import { streamText, type ModelMessage } from "ai";
import {
  denyIfAccessRequired,
  getChat,
  getDb,
  getRuntimeEnv,
  insertMessage,
  json,
  listMessages,
  methodNotAllowed,
  setChatGenerating,
  titleFromPrompt,
  updateChat,
} from "@/lib/chat";
import { assistantContentToPersist } from "@/lib/chat/persist-assistant";
import { createGoLanguageModel } from "@/lib/chat/provider";

export const prerender = false;

function messageContentForModel(
  content: string,
  attachmentNames: string[],
): string {
  if (attachmentNames.length === 0) return content;
  const note = `[Attached: ${attachmentNames.join(", ")}]`;
  return content.trim() ? `${content.trim()}\n\n${note}` : note;
}

export const POST: APIRoute = async (context) => {
  const env = getRuntimeEnv();
  const denied = denyIfAccessRequired(context.request, env);
  if (denied) return denied;

  const apiKey = env.OPENCODE_API_KEY?.trim();
  if (!apiKey) {
    return json(
      { error: "OPENCODE_API_KEY is not configured" },
      { status: 503 },
    );
  }

  let body: {
    chatId?: string;
    message?: string;
    modelId?: string;
    attachmentIds?: string[];
  };
  try {
    body = (await context.request.json()) as typeof body;
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const chatId = typeof body.chatId === "string" ? body.chatId.trim() : "";
  const message = typeof body.message === "string" ? body.message : "";
  const attachmentIds = Array.isArray(body.attachmentIds)
    ? body.attachmentIds.filter((id): id is string => typeof id === "string")
    : undefined;

  if (!chatId) {
    return json({ error: "chatId is required" }, { status: 400 });
  }
  if (!message.trim() && (!attachmentIds || attachmentIds.length === 0)) {
    return json({ error: "message is required" }, { status: 400 });
  }

  let markedGenerating = false;

  try {
    const db = getDb(env);
    const chat = await getChat(db, chatId);
    if (!chat) {
      return json({ error: "Chat not found" }, { status: 404 });
    }

    const modelId =
      typeof body.modelId === "string" && body.modelId.trim()
        ? body.modelId.trim()
        : chat.model_id;

    if (modelId !== chat.model_id) {
      await updateChat(db, chatId, { modelId });
    }

    await insertMessage(db, {
      chatId,
      role: "user",
      content: message.trim(),
      attachmentIds,
    });

    if (chat.title === "New chat" && message.trim()) {
      await updateChat(db, chatId, { title: titleFromPrompt(message) });
    }

    await setChatGenerating(db, chatId, true);
    markedGenerating = true;

    const history = await listMessages(db, chatId);
    const messages: ModelMessage[] = history
      .filter(
        (m) =>
          m.role === "user" || m.role === "assistant" || m.role === "system",
      )
      .map((m) => ({
        role: m.role,
        content: messageContentForModel(
          m.content,
          m.attachments.map((a) => a.filename),
        ),
      }));

    const persistAssistant = async (content: string | null) => {
      if (!content) return;
      await insertMessage(db, {
        chatId,
        role: "assistant",
        content,
      });
    };

    const clearGenerating = async () => {
      try {
        await setChatGenerating(db, chatId, false);
      } catch {
        // Best-effort; client poll will eventually time out.
      }
    };

    // Do not pass request.signal — client navigate/disconnect must not cancel
    // LLM generation. consumeStream + waitUntil keep generation and D1 writes
    // alive after the browser cancels the response body.
    const result = streamText({
      model: createGoLanguageModel(modelId, apiKey),
      messages,
      onFinish: async ({ text }) => {
        try {
          await persistAssistant(assistantContentToPersist({ text }));
        } finally {
          await clearGenerating();
        }
      },
      onAbort: async ({ steps }) => {
        try {
          await persistAssistant(assistantContentToPersist({ steps }));
        } finally {
          await clearGenerating();
        }
      },
    });

    waitUntil(
      (async () => {
        try {
          await result.consumeStream();
        } catch {
          // Stream errors still need the generating flag cleared.
        } finally {
          const row = await getChat(db, chatId);
          if (row?.generating_at) {
            await clearGenerating();
          }
        }
      })(),
    );

    return result.toUIMessageStreamResponse();
  } catch (err) {
    if (markedGenerating) {
      try {
        const db = getDb(env);
        await setChatGenerating(db, chatId, false);
      } catch {
        // ignore
      }
    }
    const messageText =
      err instanceof Error ? err.message : "Failed to stream chat";
    return json({ error: messageText }, { status: 500 });
  }
};

export const ALL: APIRoute = async () => methodNotAllowed(["POST"]);
