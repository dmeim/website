import type { APIRoute } from "astro";
import { waitUntil } from "cloudflare:workers";
import { stepCountIs, streamText } from "ai";
import {
  abortGeneration,
  buildModelMessages,
  clearChatGeneratingIfMatch,
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
  mergeGenerationMetadata,
  methodNotAllowed,
  parseMcpSettings,
  registerGenerationAbort,
  setChatGenerating,
  setChatLastError,
  slimPerformance,
  slimUsage,
  titleFromPrompt,
  toAsciiHeaderValue,
  truncateAfterLastUser,
  truncateMessagesForContext,
  updateChat,
  type ChatMcpSettings,
} from "@/lib/chat";
import {
  closeMcpClients,
  loadMcpTools,
  mcpLoadFailureNote,
} from "@/lib/chat/mcp/load-tools";
import { assistantContentToPersist } from "@/lib/chat/persist-assistant";
import { createGoLanguageModel, goThinkingProviderOptions } from "@/lib/chat/provider";
import { coerceThinkingLevel, isThinkingLevel } from "@/lib/chat/thinking";
import type {
  ChatGenerationMetadata,
  MessageAttachmentSummary,
  ThinkingLevel,
} from "@/lib/chat/types";

export const prerender = false;

const MCP_STEP_LIMIT = 8;

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
    thinkingLevel?: string;
    attachmentIds?: string[];
    mcpSettings?: unknown;
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
  let generation: number | undefined;
  let generationAt: string | null = null;
  let mcpClients: Awaited<ReturnType<typeof loadMcpTools>>["clients"] = [];

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

    const thinkingRaw =
      typeof body.thinkingLevel === "string" ? body.thinkingLevel.trim() : "off";
    const thinkingLevel: ThinkingLevel = isThinkingLevel(thinkingRaw)
      ? coerceThinkingLevel(modelId, thinkingRaw)
      : "off";

    const mcpSettings: ChatMcpSettings =
      body.mcpSettings !== undefined
        ? parseMcpSettings(body.mcpSettings)
        : parseMcpSettings(chat.mcp_settings);

    const chatPatch: {
      modelId?: string;
      mcpSettings?: ChatMcpSettings;
    } = {};
    if (modelId !== chat.model_id) chatPatch.modelId = modelId;
    if (body.mcpSettings !== undefined) chatPatch.mcpSettings = mcpSettings;
    if (Object.keys(chatPatch).length > 0) {
      await updateChat(db, chatId, chatPatch);
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

    // Register abort early (before history/MCP prep) so Stop works during load.
    // Generation token + generatingAt epoch: older onEnd/onAbort cleanup must not
    // clear a newer generation's controller or busy flag.
    generationAt = await setChatGenerating(db, chatId, true);
    markedGenerating = true;
    const abortHandle = registerGenerationAbort(chatId);
    generation = abortHandle.generation;
    const abortSignal = abortHandle.signal;

    const history = await listMessages(db, chatId);
    const { messages: contextMessages, truncated } =
      truncateMessagesForContext(history);

    const needsAssets = contextMessages.some(
      (m) => m.role === "user" && m.attachments.length > 0,
    );

    let loadBytes:
      | ((a: MessageAttachmentSummary) => Promise<Uint8Array | null>)
      | undefined;
    if (needsAssets) {
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

    const { messages, multimodalNotes } = await buildModelMessages(
      contextMessages,
      loadBytes,
    );

    if (truncated && messages.length > 0) {
      // Soft system hint only when we actually dropped older turns.
      messages.unshift({
        role: "system",
        content:
          "Earlier messages in this chat were omitted to fit the context window. Answer from the recent turns below.",
      });
    }

    const persistAssistant = async (payload: {
      text?: string | null;
      reasoningText?: string | null;
      steps?: Array<{
        text?: string;
        reasoningText?: string;
        usage?: Parameters<typeof slimUsage>[0];
        performance?: Parameters<typeof slimPerformance>[0];
      }>;
      usage?: Parameters<typeof slimUsage>[0];
      totalUsage?: Parameters<typeof slimUsage>[0];
      performance?: Parameters<typeof slimPerformance>[0];
    }) => {
      const normalized = assistantContentToPersist(payload);
      if (!normalized) return;

      const lastStep = payload.steps?.at(-1);
      const metrics = mergeGenerationMetadata({
        usage: slimUsage(payload.usage ?? lastStep?.usage),
        performance: slimPerformance(
          payload.performance ?? lastStep?.performance,
        ),
        totalUsage: slimUsage(payload.totalUsage),
      });

      await insertMessage(db, {
        chatId,
        role: "assistant",
        content: normalized.content,
        reasoning: normalized.reasoning,
        generation: metrics,
      });
    };

    const clearGenerating = async () => {
      if (!generationAt) return;
      try {
        await clearChatGeneratingIfMatch(db, chatId, generationAt);
      } catch {
        // Best-effort; client poll will eventually time out.
      }
    };

    const releaseMcp = async () => {
      const toClose = mcpClients;
      mcpClients = [];
      await closeMcpClients(toClose);
    };

    const loaded = await loadMcpTools(env, mcpSettings);
    mcpClients = loaded.clients;
    const mcpTools = loaded.tools;
    const mcpToolNames = Object.keys(mcpTools);
    const hasMcpTools = mcpToolNames.length > 0;
    const mcpFailureNote = mcpLoadFailureNote(loaded);
    if (mcpFailureNote) {
      console.warn("[mcp]", mcpFailureNote, {
        toolCount: mcpToolNames.length,
        skipped: loaded.skipped.map((s) => ({ id: s.id, reason: s.reason })),
      });
    } else if (hasMcpTools) {
      console.info("[mcp]", {
        toolCount: mcpToolNames.length,
        toolNames: mcpToolNames,
      });
    }

    // Do not pass request.signal — client navigate/disconnect must not cancel
    // LLM generation. Explicit Stop aborts via registerGenerationAbort.
    // consumeStream + waitUntil keep generation and D1 writes alive after the
    // browser cancels the response body.
    //
    // AI SDK 7: onFinish is a deprecated alias (`onEnd = onFinish`). Setting both
    // means only onEnd runs — merge persist + MCP release into a single onEnd.
    const result = streamText({
      model: createGoLanguageModel(modelId, apiKey),
      messages,
      abortSignal,
      providerOptions: goThinkingProviderOptions(modelId, thinkingLevel),
      ...(hasMcpTools
        ? { tools: mcpTools, stopWhen: stepCountIs(MCP_STEP_LIMIT) }
        : {}),
      onEnd: async ({ steps, usage, totalUsage, finalStep }) => {
        try {
          // Join all steps — top-level text/reasoningText are final-step-only.
          await persistAssistant({
            steps: steps.map((step) => ({
              text: step.text,
              reasoningText: step.reasoningText,
              usage: step.usage,
              performance: step.performance,
            })),
            usage,
            totalUsage,
            performance: finalStep?.performance,
          });
          await setChatLastError(db, chatId, null);
        } finally {
          clearGenerationAbort(chatId, generation);
          await clearGenerating();
          await releaseMcp();
        }
      },
      onAbort: async ({ steps }) => {
        try {
          // Persist partials on explicit Stop so the user keeps progress.
          await persistAssistant({
            steps: steps.map((step) => ({
              text: step.text,
              reasoningText: step.reasoningText,
              usage: step.usage,
              performance: step.performance,
            })),
          });
          await setChatLastError(db, chatId, null);
        } finally {
          clearGenerationAbort(chatId, generation);
          await clearGenerating();
          await releaseMcp();
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
          clearGenerationAbort(chatId, generation);
          await releaseMcp();
          await clearGenerating();
        }
      })(),
    );

    const degradedNotes = multimodalNotes.filter(
      (n) =>
        n.startsWith("degraded:") ||
        n.startsWith("unloaded:") ||
        n.startsWith("skipped-large:") ||
        n.startsWith("missing:") ||
        n.includes("-truncated:"),
    );
    const responseHeaders: Record<string, string> = {};
    if (degradedNotes.length > 0) {
      responseHeaders["X-Chat-Attachment-Notes"] = toAsciiHeaderValue(
        degradedNotes.join("; "),
      );
    }
    if (mcpFailureNote) {
      responseHeaders["X-Chat-Mcp-Notes"] = toAsciiHeaderValue(mcpFailureNote);
    } else if (hasMcpTools) {
      responseHeaders["X-Chat-Mcp-Tool-Count"] = String(mcpToolNames.length);
    }
    return result.toUIMessageStreamResponse({
      sendReasoning: true,
      messageMetadata: ({ part }): ChatGenerationMetadata | undefined => {
        if (part.type === "finish-step") {
          return mergeGenerationMetadata({
            usage: slimUsage(part.usage),
            performance: slimPerformance(part.performance),
          });
        }
        if (part.type === "finish") {
          return mergeGenerationMetadata({
            totalUsage: slimUsage(part.totalUsage),
          });
        }
        return undefined;
      },
      headers:
        Object.keys(responseHeaders).length > 0 ? responseHeaders : undefined,
    });
  } catch (err) {
    if (generation !== undefined) {
      clearGenerationAbort(chatId, generation);
    }
    await closeMcpClients(mcpClients);
    mcpClients = [];
    if (markedGenerating && generationAt) {
      try {
        const db = getDb(env);
        await clearChatGeneratingIfMatch(db, chatId, generationAt);
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
