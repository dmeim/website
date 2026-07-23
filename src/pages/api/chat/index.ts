import type { APIRoute } from "astro";
import { waitUntil } from "cloudflare:workers";
import { streamText } from "ai";
import {
  abortGeneration,
  buildModelMessages,
  clearGenerationAbort,
  denyIfAccessRequired,
  getChat,
  getDb,
  getLibraryAsset,
  getLibraryBucket,
  getRuntimeEnv,
  insertMessage,
  json,
  listMessages,
  methodNotAllowed,
  registerGenerationAbort,
  setChatGenerating,
  setChatLastError,
  titleFromPrompt,
  truncateAfterLastUser,
  truncateMessagesForContext,
  updateChat,
} from "@/lib/chat";
import { assistantContentToPersist } from "@/lib/chat/persist-assistant";
import { createGoLanguageModel } from "@/lib/chat/provider";
import type { MessageAttachmentSummary } from "@/lib/chat/types";

export const prerender = false;

function normalizeProviderError(err: unknown): string {
  const raw = err instanceof Error ? err.message : "Failed to stream chat";
  const lower = raw.toLowerCase();
  if (
    lower.includes("429") ||
    lower.includes("rate limit") ||
    lower.includes("too many requests")
  ) {
    return `Rate limited: ${raw}`;
  }
  if (lower.includes("401") || lower.includes("403") || lower.includes("api key")) {
    return `Provider auth error: ${raw}`;
  }
  return raw;
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
    /** Re-run completion for the last user turn (delete trailing assistants). */
    regenerate?: boolean;
  };
  try {
    body = (await context.request.json()) as typeof body;
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const chatId = typeof body.chatId === "string" ? body.chatId.trim() : "";
  const message = typeof body.message === "string" ? body.message : "";
  const regenerate = body.regenerate === true;
  const attachmentIds = Array.isArray(body.attachmentIds)
    ? body.attachmentIds.filter((id): id is string => typeof id === "string")
    : undefined;

  if (!chatId) {
    return json({ error: "chatId is required" }, { status: 400 });
  }
  if (
    !regenerate &&
    !message.trim() &&
    (!attachmentIds || attachmentIds.length === 0)
  ) {
    return json({ error: "message is required" }, { status: 400 });
  }

  let markedGenerating = false;

  try {
    const db = getDb(env);
    const chat = await getChat(db, chatId);
    if (!chat) {
      return json({ error: "Chat not found" }, { status: 404 });
    }

    // Cancel any prior in-flight generation for this chat before starting anew.
    abortGeneration(chatId);

    const modelId =
      typeof body.modelId === "string" && body.modelId.trim()
        ? body.modelId.trim()
        : chat.model_id;

    if (modelId !== chat.model_id) {
      await updateChat(db, chatId, { modelId });
    }

    if (regenerate) {
      const lastUser = await truncateAfterLastUser(db, chatId);
      if (!lastUser) {
        return json(
          { error: "No user message to regenerate from" },
          { status: 400 },
        );
      }
    } else {
      await insertMessage(db, {
        chatId,
        role: "user",
        content: message.trim(),
        attachmentIds,
      });

      if (chat.title === "New chat" && message.trim()) {
        await updateChat(db, chatId, { title: titleFromPrompt(message) });
      }
    }

    await setChatGenerating(db, chatId, true);
    markedGenerating = true;

    const history = await listMessages(db, chatId);
    const { messages: contextMessages, truncated } =
      truncateMessagesForContext(history);

    const needsImages = contextMessages.some(
      (m) =>
        m.role === "user" && m.attachments.some((a) => a.kind === "image"),
    );

    let loadBytes: ((a: MessageAttachmentSummary) => Promise<Uint8Array | null>) | undefined;
    if (needsImages) {
      const bucket = getLibraryBucket(env);
      loadBytes = async (attachment: MessageAttachmentSummary) => {
        const asset = await getLibraryAsset(db, attachment.libraryAssetId);
        if (!asset) return null;
        const object = await bucket.get(asset.r2_key);
        if (!object) return null;
        const buffer = await object.arrayBuffer();
        return new Uint8Array(buffer);
      };
    }

    const { messages } = await buildModelMessages(contextMessages, loadBytes);

    if (truncated && messages.length > 0) {
      // Soft system hint only when we actually dropped older turns.
      messages.unshift({
        role: "system",
        content:
          "Earlier messages in this chat were omitted to fit the context window. Answer from the recent turns below.",
      });
    }

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

    const abortSignal = registerGenerationAbort(chatId);

    // Do not pass request.signal — client navigate/disconnect must not cancel
    // LLM generation. Explicit Stop aborts via registerGenerationAbort.
    // consumeStream + waitUntil keep generation and D1 writes alive after the
    // browser cancels the response body.
    const result = streamText({
      model: createGoLanguageModel(modelId, apiKey),
      messages,
      abortSignal,
      onFinish: async ({ text }) => {
        try {
          await persistAssistant(assistantContentToPersist({ text }));
          await setChatLastError(db, chatId, null);
        } finally {
          clearGenerationAbort(chatId);
          await clearGenerating();
        }
      },
      onAbort: async ({ steps }) => {
        try {
          // Persist partials on explicit Stop so the user keeps progress.
          await persistAssistant(assistantContentToPersist({ steps }));
          await setChatLastError(db, chatId, null);
        } finally {
          clearGenerationAbort(chatId);
          await clearGenerating();
        }
      },
      onError: async ({ error }) => {
        try {
          await setChatLastError(db, chatId, normalizeProviderError(error));
        } catch {
          // ignore
        }
      },
    });

    waitUntil(
      (async () => {
        try {
          await result.consumeStream();
        } catch (err) {
          try {
            await setChatLastError(db, chatId, normalizeProviderError(err));
          } catch {
            // ignore
          }
        } finally {
          clearGenerationAbort(chatId);
          const row = await getChat(db, chatId);
          if (row?.generating_at) {
            await clearGenerating();
          }
        }
      })(),
    );

    return result.toUIMessageStreamResponse();
  } catch (err) {
    clearGenerationAbort(chatId);
    if (markedGenerating) {
      try {
        const db = getDb(env);
        await setChatGenerating(db, chatId, false);
        await setChatLastError(db, chatId, normalizeProviderError(err));
      } catch {
        // ignore
      }
    }
    const messageText = normalizeProviderError(err);
    return json({ error: messageText }, { status: 500 });
  }
};

export const ALL: APIRoute = async () => methodNotAllowed(["POST"]);
