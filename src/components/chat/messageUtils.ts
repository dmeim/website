import type { UIMessage } from "ai";
import type { ChatMessageDto } from "@/lib/chat";

export function dtoToUiMessages(messages: ChatMessageDto[]): UIMessage[] {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => {
      const parts: UIMessage["parts"] = [{ type: "text", text: m.content }];
      for (const a of m.attachments) {
        parts.push({
          type: "text",
          text: `\n[Attachment: ${a.filename}]`,
        });
      }
      return {
        id: m.id,
        role: m.role,
        parts,
      };
    });
}

export function textFromParts(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}
