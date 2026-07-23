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
    .map((m) => ({
      id: m.id,
      role: m.role,
      parts: [{ type: "text" as const, text: m.content }],
      metadata: {
        attachments: m.attachments,
      },
    }));
}

export function textFromParts(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function attachmentsOf(message: UIMessage): MessageAttachmentSummary[] {
  const meta = (message as ChatUiMessage).metadata;
  return meta?.attachments ?? [];
}
