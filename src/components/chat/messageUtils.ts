import type { UIMessage } from "ai";
import { getToolName, isToolUIPart } from "ai";
import type {
  ChatGenerationMetadata,
  ChatMessageDto,
  MessageAttachmentSummary,
} from "@/lib/chat";
import { mergeGenerationMetadata } from "@/lib/chat/message-metrics";
import { parseMcpToolName } from "@/lib/chat/mcp/registry";

export type ChatUiMessage = UIMessage<ChatUiMessageMetadata>;

export type ChatUiMessageMetadata = {
  attachments?: MessageAttachmentSummary[];
} & ChatGenerationMetadata;

export type ToolCallChip = {
  key: string;
  label: string;
  state: "pending" | "done" | "error";
};

export function dtoToUiMessages(messages: ChatMessageDto[]): ChatUiMessage[] {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => {
      const parts: ChatUiMessage["parts"] = [];
      if (m.reasoning?.trim()) {
        parts.push({
          type: "reasoning",
          text: m.reasoning,
          state: "done",
        });
      }
      parts.push({ type: "text", text: m.content });
      const generation = mergeGenerationMetadata(m.generation ?? undefined);
      return {
        id: m.id,
        role: m.role,
        parts,
        metadata: {
          attachments: m.attachments,
          ...generation,
        },
      };
    });
}

export function textFromParts(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function reasoningFromParts(message: UIMessage): {
  text: string;
  streaming: boolean;
} | null {
  const reasoningParts = message.parts.filter(
    (p): p is { type: "reasoning"; text: string; state?: "streaming" | "done" } =>
      p.type === "reasoning",
  );
  if (reasoningParts.length === 0) return null;
  const text = reasoningParts.map((p) => p.text).join("");
  if (!text.trim()) return null;
  const streaming = reasoningParts.some((p) => p.state === "streaming");
  return { text, streaming };
}

function humanizeToolName(prefixed: string): string {
  const { toolName } = parseMcpToolName(prefixed);
  const raw = toolName || prefixed;
  return raw.replace(/_/g, " ").replace(/-/g, " ");
}

export function toolCallsFromParts(message: UIMessage): ToolCallChip[] {
  const chips: ToolCallChip[] = [];
  for (const part of message.parts) {
    if (!isToolUIPart(part)) continue;
    const name = getToolName(part);
    const stateRaw = "state" in part ? String(part.state) : "";
    let state: ToolCallChip["state"] = "pending";
    if (
      stateRaw === "output-available" ||
      stateRaw === "output-error" ||
      stateRaw === "done"
    ) {
      state = stateRaw === "output-error" ? "error" : "done";
    }
    if (stateRaw.includes("error")) state = "error";
    const toolCallId =
      "toolCallId" in part && typeof part.toolCallId === "string"
        ? part.toolCallId
        : `${name}-${chips.length}`;
    chips.push({
      key: toolCallId,
      label: `Used ${humanizeToolName(name)}`,
      state,
    });
  }
  return chips;
}

export function attachmentsOf(message: UIMessage): MessageAttachmentSummary[] {
  const meta = (message as ChatUiMessage).metadata;
  return meta?.attachments ?? [];
}

export function generationOf(
  message: UIMessage,
): ChatGenerationMetadata | undefined {
  const meta = (message as ChatUiMessage).metadata;
  if (!meta) return undefined;
  return mergeGenerationMetadata({
    usage: meta.usage,
    performance: meta.performance,
    totalUsage: meta.totalUsage,
  });
}

function lastRole(messages: { role: string }[]): string | undefined {
  return messages[messages.length - 1]?.role;
}

/** True when an assistant message has no visible body yet (hollow placeholder). */
export function isHollowAssistant(message: UIMessage): boolean {
  if (message.role !== "assistant") return false;
  if (textFromParts(message).trim()) return false;
  if (reasoningFromParts(message)?.text) return false;
  if (toolCallsFromParts(message).length > 0) return false;
  return true;
}

/**
 * Prefer keeping the local thread when a poll/refresh would wipe a client-side
 * assistant that D1 has not caught up with yet (e.g. server still ends on user).
 */
export function shouldPreferLocalThread(
  local: { role: string }[],
  server: { role: string }[],
): boolean {
  if (local.length === 0) return false;
  const localLast = lastRole(local);
  const serverLast = lastRole(server);
  if (localLast === "assistant" && serverLast === "user") return true;
  if (server.length < local.length && localLast === "assistant") return true;
  return false;
}
