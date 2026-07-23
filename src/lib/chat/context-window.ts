import { CHAT_CONTEXT_MAX_MESSAGES } from "./constants";

/**
 * Keep the most recent N turns for the model request.
 * Prefer starting on a user message when truncating so the prompt stays well-formed.
 */
export function truncateMessagesForContext<T extends { role: string }>(
  messages: T[],
  maxMessages: number = CHAT_CONTEXT_MAX_MESSAGES,
): { messages: T[]; truncated: boolean } {
  if (maxMessages < 1 || messages.length <= maxMessages) {
    return { messages, truncated: false };
  }

  let start = messages.length - maxMessages;
  while (start < messages.length && messages[start]?.role !== "user") {
    start += 1;
  }
  if (start >= messages.length) {
    start = messages.length - maxMessages;
  }

  return {
    messages: messages.slice(start),
    truncated: start > 0,
  };
}
