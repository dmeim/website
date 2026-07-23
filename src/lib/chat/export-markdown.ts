import type { ChatMessageDto, ChatSummary } from "./types";

function fenceIfNeeded(content: string): string {
  if (!content.includes("```")) return content;
  return content.replace(/```/g, "``\\`");
}

/** Build a downloadable markdown transcript for a chat. */
export function chatToMarkdownExport(
  chat: ChatSummary,
  messages: ChatMessageDto[],
  exportedAt: string = new Date().toISOString(),
): string {
  const lines: string[] = [
    `# ${chat.title || "Chat"}`,
    "",
    `_Model: ${chat.modelId} · exported ${exportedAt}_`,
    "",
  ];

  for (const message of messages) {
    if (message.role === "system") continue;
    const who = message.role === "user" ? "You" : "Assistant";
    lines.push(`## ${who}`);
    lines.push(`_${message.createdAt}_`);
    lines.push("");
    lines.push(fenceIfNeeded(message.content || "").trimEnd() || "_(empty)_");
    if (message.reasoning?.trim()) {
      lines.push("");
      lines.push("<details>");
      lines.push("<summary>Thinking</summary>");
      lines.push("");
      lines.push(fenceIfNeeded(message.reasoning).trimEnd());
      lines.push("");
      lines.push("</details>");
    }
    if (message.attachments.length > 0) {
      lines.push("");
      lines.push(
        `Attachments: ${message.attachments.map((a) => a.filename).join(", ")}`,
      );
    }
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}
