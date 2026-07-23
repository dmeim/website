import type { ChatMessageDto } from "./types";

export type ForkPlanOk = {
  ok: true;
  /** Messages copied as-is into the new chat (before any edited replacement). */
  copy: ChatMessageDto[];
  /**
   * When editing a user message: omit the original from `copy` and insert this
   * instead (same attachments, new content). Null for plain forks.
   */
  editedUser: { source: ChatMessageDto; content: string } | null;
  forkedFromMessageId: string | null;
};

export type ForkPlanErr = { ok: false; error: string };

/**
 * Decide which messages to copy when forking.
 *
 * - No `throughMessageId`: copy full history.
 * - `throughMessageId` only: copy up to and including that message.
 * - `throughMessageId` + `editContent`: copy messages *before* that user
 *   message, then insert the edited user turn (callers must not copy following
 *   messages — original chat stays intact).
 */
export function planForkMessages(
  messages: ChatMessageDto[],
  opts: {
    throughMessageId?: string | null;
    editContent?: string | null;
  } = {},
): ForkPlanOk | ForkPlanErr {
  const throughId =
    typeof opts.throughMessageId === "string" && opts.throughMessageId.trim()
      ? opts.throughMessageId.trim()
      : null;
  const editing =
    opts.editContent !== undefined && opts.editContent !== null;

  if (!throughId) {
    if (editing) {
      return { ok: false, error: "messageId is required when editing" };
    }
    return {
      ok: true,
      copy: messages.slice(),
      editedUser: null,
      forkedFromMessageId: null,
    };
  }

  const idx = messages.findIndex((m) => m.id === throughId);
  if (idx < 0) {
    return { ok: false, error: "Fork point message not found" };
  }

  const pivot = messages[idx]!;

  if (editing) {
    if (pivot.role !== "user") {
      return { ok: false, error: "Only user messages can be edited" };
    }
    const content = String(opts.editContent ?? "");
    return {
      ok: true,
      copy: messages.slice(0, idx),
      editedUser: { source: pivot, content },
      forkedFromMessageId: pivot.id,
    };
  }

  return {
    ok: true,
    copy: messages.slice(0, idx + 1),
    editedUser: null,
    forkedFromMessageId: pivot.id,
  };
}

/** Build a fork title from the source title. */
export function forkChatTitle(sourceTitle: string, edited: boolean): string {
  const base = sourceTitle.trim() || "New chat";
  const suffix = edited ? " (edit)" : " (fork)";
  const max = 80;
  if (base.length + suffix.length <= max) return `${base}${suffix}`;
  return `${base.slice(0, max - suffix.length).trimEnd()}${suffix}`;
}
