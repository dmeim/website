import type { UIMessage } from "ai";
import type {
  ChatGenerationMetadata,
  ChatMessageDto,
  MessageAttachmentSummary,
} from "@/lib/chat";
import { mergeGenerationMetadata } from "@/lib/chat/message-metrics";

export type ChatUiMessage = UIMessage<ChatUiMessageMetadata>;

export type ChatUiMessageMetadata = {
  attachments?: MessageAttachmentSummary[];
} & ChatGenerationMetadata;

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
