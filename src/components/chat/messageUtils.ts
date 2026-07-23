import type { UIMessage } from "ai";
import type { ChatMessageDto, MessageAttachmentSummary } from "@/lib/chat";

export type ChatUiMessage = UIMessage & {
  metadata?: {
    attachments?: MessageAttachmentSummary[];
  };
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
      return {
        id: m.id,
        role: m.role,
        parts,
        metadata: {
          attachments: m.attachments,
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
