import { forkChatTitle, planForkMessages } from "./fork";
import {
  parseGenerationMetadata,
  serializeGenerationMetadata,
} from "./message-metrics";
import {
  defaultMcpSettings,
  parseMcpSettings,
  serializeMcpSettings,
  type ChatMcpSettings,
} from "./mcp/settings";
import type {
  ChatGenerationMetadata,
  ChatMessageDto,
  ChatRow,
  ChatSummary,
  LibraryAssetRow,
  LibraryAssetSummary,
  MessageAttachmentSummary,
  MessageRow,
} from "./types";

export function nowIso(): string {
  return new Date().toISOString();
}

export function newId(): string {
  return crypto.randomUUID();
}

export function chatToSummary(row: ChatRow): ChatSummary {
  return {
    id: row.id,
    title: row.title,
    modelId: row.model_id,
    archivedAt: row.archived_at,
    generatingAt: row.generating_at ?? null,
    lastError: row.last_error ?? null,
    forkedFromChatId: row.forked_from_chat_id ?? null,
    forkedFromMessageId: row.forked_from_message_id ?? null,
    mcpSettings: parseMcpSettings(row.mcp_settings),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function assetToSummary(row: LibraryAssetRow): LibraryAssetSummary {
  return {
    id: row.id,
    filename: row.filename,
    contentType: row.content_type,
    byteSize: row.byte_size,
    kind: row.kind,
    createdAt: row.created_at,
  };
}

export function getDb(env: Env): D1Database {
  if (!env.DB) {
    throw new Error("D1 binding DB is not configured");
  }
  return env.DB;
}

export function getLibraryBucket(env: Env): R2Bucket {
  if (!env.CHAT_LIBRARY) {
    throw new Error("R2 binding CHAT_LIBRARY is not configured");
  }
  return env.CHAT_LIBRARY;
}

export async function listChats(
  db: D1Database,
  archived: boolean,
): Promise<ChatSummary[]> {
  const rows = archived
    ? await db
        .prepare(
          `SELECT * FROM chats WHERE archived_at IS NOT NULL ORDER BY updated_at DESC`,
        )
        .all<ChatRow>()
    : await db
        .prepare(
          `SELECT * FROM chats WHERE archived_at IS NULL ORDER BY updated_at DESC`,
        )
        .all<ChatRow>();
  return (rows.results ?? []).map(chatToSummary);
}

export async function getChat(
  db: D1Database,
  id: string,
): Promise<ChatRow | null> {
  return (
    (await db.prepare(`SELECT * FROM chats WHERE id = ?`).bind(id).first<ChatRow>()) ??
    null
  );
}

export async function createChat(
  db: D1Database,
  input: {
    title?: string;
    modelId: string;
    forkedFromChatId?: string | null;
    forkedFromMessageId?: string | null;
    mcpSettings?: ChatMcpSettings | null;
  },
): Promise<ChatSummary> {
  const id = newId();
  const ts = nowIso();
  const title = input.title?.trim() || "New chat";
  const forkedFromChatId = input.forkedFromChatId ?? null;
  const forkedFromMessageId = input.forkedFromMessageId ?? null;
  const mcpSettings = parseMcpSettings(
    input.mcpSettings ?? defaultMcpSettings(),
  );
  const mcpSettingsJson = serializeMcpSettings(mcpSettings);
  await db
    .prepare(
      `INSERT INTO chats (
         id, title, model_id, archived_at, generating_at, last_error,
         forked_from_chat_id, forked_from_message_id, mcp_settings,
         created_at, updated_at
       ) VALUES (?, ?, ?, NULL, NULL, NULL, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      title,
      input.modelId,
      forkedFromChatId,
      forkedFromMessageId,
      mcpSettingsJson,
      ts,
      ts,
    )
    .run();
  return {
    id,
    title,
    modelId: input.modelId,
    archivedAt: null,
    generatingAt: null,
    lastError: null,
    forkedFromChatId,
    forkedFromMessageId,
    mcpSettings,
    createdAt: ts,
    updatedAt: ts,
  };
}

export async function updateChat(
  db: D1Database,
  id: string,
  patch: {
    title?: string;
    modelId?: string;
    archivedAt?: string | null;
    mcpSettings?: ChatMcpSettings;
  },
): Promise<ChatSummary | null> {
  const existing = await getChat(db, id);
  if (!existing) return null;
  const title = patch.title !== undefined ? patch.title.trim() || existing.title : existing.title;
  const modelId = patch.modelId ?? existing.model_id;
  const archivedAt =
    patch.archivedAt !== undefined ? patch.archivedAt : existing.archived_at;
  const mcpSettings =
    patch.mcpSettings !== undefined
      ? parseMcpSettings(patch.mcpSettings)
      : parseMcpSettings(existing.mcp_settings);
  const mcpSettingsJson = serializeMcpSettings(mcpSettings);
  const updatedAt = nowIso();
  await db
    .prepare(
      `UPDATE chats SET title = ?, model_id = ?, archived_at = ?, mcp_settings = ?, updated_at = ? WHERE id = ?`,
    )
    .bind(title, modelId, archivedAt, mcpSettingsJson, updatedAt, id)
    .run();
  return {
    id,
    title,
    modelId,
    archivedAt,
    generatingAt: existing.generating_at ?? null,
    lastError: existing.last_error ?? null,
    forkedFromChatId: existing.forked_from_chat_id ?? null,
    forkedFromMessageId: existing.forked_from_message_id ?? null,
    mcpSettings,
    createdAt: existing.created_at,
    updatedAt,
  };
}

export type ForkChatResult =
  | { ok: true; chat: ChatSummary; messages: ChatMessageDto[]; edited: boolean }
  | { ok: false; error: string; status: number };

/**
 * Create a new chat that copies history from `sourceChatId` up to an optional
 * pivot message. When `editContent` is set, the pivot must be a user message:
 * messages before it are copied, then the edited user turn is inserted (original
 * chat is never rewritten).
 */
export async function forkChat(
  db: D1Database,
  input: {
    sourceChatId: string;
    throughMessageId?: string | null;
    editContent?: string | null;
  },
): Promise<ForkChatResult> {
  const source = await getChat(db, input.sourceChatId);
  if (!source) {
    return { ok: false, error: "Chat not found", status: 404 };
  }

  const history = await listMessages(db, input.sourceChatId);
  const plan = planForkMessages(history, {
    throughMessageId: input.throughMessageId,
    editContent: input.editContent,
  });
  if (!plan.ok) {
    return { ok: false, error: plan.error, status: 400 };
  }

  const edited = plan.editedUser !== null;
  const chat = await createChat(db, {
    title: forkChatTitle(source.title, edited),
    modelId: source.model_id,
    forkedFromChatId: source.id,
    forkedFromMessageId: plan.forkedFromMessageId,
    mcpSettings: parseMcpSettings(source.mcp_settings),
  });

  let seq = 0;
  const ts = nowIso();

  for (const m of plan.copy) {
    seq += 1;
    const newMsgId = newId();
    await db
      .prepare(
        `INSERT INTO messages (id, chat_id, role, content, reasoning, metadata, created_at, seq)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        newMsgId,
        chat.id,
        m.role,
        m.content,
        m.reasoning,
        serializeGenerationMetadata(m.generation),
        ts,
        seq,
      )
      .run();
    for (const a of m.attachments) {
      await db
        .prepare(
          `INSERT OR IGNORE INTO message_attachments (id, message_id, library_asset_id)
           VALUES (?, ?, ?)`,
        )
        .bind(newId(), newMsgId, a.libraryAssetId)
        .run();
    }
  }

  if (plan.editedUser) {
    seq += 1;
    const newMsgId = newId();
    await db
      .prepare(
        `INSERT INTO messages (id, chat_id, role, content, reasoning, metadata, created_at, seq)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        newMsgId,
        chat.id,
        "user",
        plan.editedUser.content,
        null,
        null,
        ts,
        seq,
      )
      .run();
    for (const a of plan.editedUser.source.attachments) {
      await db
        .prepare(
          `INSERT OR IGNORE INTO message_attachments (id, message_id, library_asset_id)
           VALUES (?, ?, ?)`,
        )
        .bind(newId(), newMsgId, a.libraryAssetId)
        .run();
    }
  }

  await db
    .prepare(`UPDATE chats SET updated_at = ? WHERE id = ?`)
    .bind(ts, chat.id)
    .run();

  const messages = await listMessages(db, chat.id);
  return { ok: true, chat: { ...chat, updatedAt: ts }, messages, edited };
}

/**
 * Mark chat busy / idle. When `generating` is true, returns the new
 * `generating_at` timestamp — pass it to clearChatGeneratingIfMatch so an
 * older generation's cleanup cannot clear a newer run.
 *
 * Note: there is no server TTL; a stuck flag is cleared by Stop, stream
 * callbacks, or (client) stale age-out. Prefer match-clear over blind clear.
 */
export async function setChatGenerating(
  db: D1Database,
  id: string,
  generating: boolean,
): Promise<string | null> {
  const ts = nowIso();
  if (generating) {
    await db
      .prepare(
        `UPDATE chats SET generating_at = ?, last_error = NULL, updated_at = ? WHERE id = ?`,
      )
      .bind(ts, ts, id)
      .run();
    return ts;
  }
  await db
    .prepare(
      `UPDATE chats SET generating_at = NULL, updated_at = ? WHERE id = ?`,
    )
    .bind(ts, id)
    .run();
  return null;
}

/** Clear generating only if `generating_at` still equals `expectedGeneratingAt`. */
export async function clearChatGeneratingIfMatch(
  db: D1Database,
  id: string,
  expectedGeneratingAt: string,
): Promise<boolean> {
  const ts = nowIso();
  const result = await db
    .prepare(
      `UPDATE chats SET generating_at = NULL, updated_at = ? WHERE id = ? AND generating_at = ?`,
    )
    .bind(ts, id, expectedGeneratingAt)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

export async function setChatLastError(
  db: D1Database,
  id: string,
  error: string | null,
): Promise<void> {
  const ts = nowIso();
  await db
    .prepare(`UPDATE chats SET last_error = ?, updated_at = ? WHERE id = ?`)
    .bind(error, ts, id)
    .run();
}

/** Delete messages at or after `fromSeq` (inclusive). Attachments cascade via FK. */
export async function deleteMessagesFromSeq(
  db: D1Database,
  chatId: string,
  fromSeq: number,
): Promise<number> {
  const result = await db
    .prepare(`DELETE FROM messages WHERE chat_id = ? AND seq >= ?`)
    .bind(chatId, fromSeq)
    .run();
  return result.meta.changes ?? 0;
}

/**
 * Remove trailing assistant turns after the last user message.
 * Returns the last user message dto, or null if none.
 */
export async function truncateAfterLastUser(
  db: D1Database,
  chatId: string,
): Promise<ChatMessageDto | null> {
  const messages = await listMessages(db, chatId);
  let lastUserIdx = -1;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === "user") {
      lastUserIdx = i;
      break;
    }
  }
  if (lastUserIdx < 0) return null;
  const lastUser = messages[lastUserIdx]!;
  const trailing = messages.slice(lastUserIdx + 1);
  if (trailing.length > 0) {
    const fromSeq = trailing[0]!.seq;
    await deleteMessagesFromSeq(db, chatId, fromSeq);
  }
  return lastUser;
}

export async function deleteChat(db: D1Database, id: string): Promise<boolean> {
  const result = await db.prepare(`DELETE FROM chats WHERE id = ?`).bind(id).run();
  return (result.meta.changes ?? 0) > 0;
}

export async function listMessages(
  db: D1Database,
  chatId: string,
): Promise<ChatMessageDto[]> {
  const messages = await db
    .prepare(
      `SELECT * FROM messages WHERE chat_id = ? ORDER BY seq ASC, created_at ASC`,
    )
    .bind(chatId)
    .all<MessageRow>();

  const rows = messages.results ?? [];
  if (rows.length === 0) return [];

  const attachments = await db
    .prepare(
      `SELECT ma.id AS attachment_id, ma.message_id, ma.library_asset_id,
              la.filename, la.content_type, la.kind, la.byte_size
       FROM message_attachments ma
       JOIN library_assets la ON la.id = ma.library_asset_id
       JOIN messages m ON m.id = ma.message_id
       WHERE m.chat_id = ?`,
    )
    .bind(chatId)
    .all<{
      attachment_id: string;
      message_id: string;
      library_asset_id: string;
      filename: string;
      content_type: string;
      kind: MessageAttachmentSummary["kind"];
      byte_size: number;
    }>();

  const byMessage = new Map<string, MessageAttachmentSummary[]>();
  for (const a of attachments.results ?? []) {
    const list = byMessage.get(a.message_id) ?? [];
    list.push({
      id: a.attachment_id,
      libraryAssetId: a.library_asset_id,
      filename: a.filename,
      contentType: a.content_type,
      kind: a.kind,
      byteSize: a.byte_size,
    });
    byMessage.set(a.message_id, list);
  }

  return rows.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    reasoning: m.reasoning ?? null,
    generation: parseGenerationMetadata(m.metadata),
    createdAt: m.created_at,
    seq: m.seq,
    attachments: byMessage.get(m.id) ?? [],
  }));
}

export async function nextMessageSeq(
  db: D1Database,
  chatId: string,
): Promise<number> {
  const row = await db
    .prepare(`SELECT COALESCE(MAX(seq), 0) AS max_seq FROM messages WHERE chat_id = ?`)
    .bind(chatId)
    .first<{ max_seq: number }>();
  return (row?.max_seq ?? 0) + 1;
}

export async function insertMessage(
  db: D1Database,
  input: {
    chatId: string;
    role: MessageRow["role"];
    content: string;
    reasoning?: string | null;
    generation?: ChatGenerationMetadata | null;
    attachmentIds?: string[];
  },
): Promise<ChatMessageDto> {
  const id = newId();
  const ts = nowIso();
  const seq = await nextMessageSeq(db, input.chatId);
  const reasoning =
    typeof input.reasoning === "string" && input.reasoning.trim()
      ? input.reasoning.trim()
      : null;
  const metadata = serializeGenerationMetadata(input.generation);
  await db
    .prepare(
      `INSERT INTO messages (id, chat_id, role, content, reasoning, metadata, created_at, seq)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, input.chatId, input.role, input.content, reasoning, metadata, ts, seq)
    .run();

  const attachments: MessageAttachmentSummary[] = [];
  for (const assetId of input.attachmentIds ?? []) {
    const asset = await db
      .prepare(`SELECT * FROM library_assets WHERE id = ?`)
      .bind(assetId)
      .first<LibraryAssetRow>();
    if (!asset) continue;
    const attachmentId = newId();
    await db
      .prepare(
        `INSERT OR IGNORE INTO message_attachments (id, message_id, library_asset_id)
         VALUES (?, ?, ?)`,
      )
      .bind(attachmentId, id, assetId)
      .run();
    attachments.push({
      id: attachmentId,
      libraryAssetId: asset.id,
      filename: asset.filename,
      contentType: asset.content_type,
      kind: asset.kind,
      byteSize: asset.byte_size,
    });
  }

  await db
    .prepare(`UPDATE chats SET updated_at = ? WHERE id = ?`)
    .bind(ts, input.chatId)
    .run();

  return {
    id,
    role: input.role,
    content: input.content,
    reasoning,
    generation: parseGenerationMetadata(metadata),
    createdAt: ts,
    seq,
    attachments,
  };
}

export async function listLibraryAssets(
  db: D1Database,
): Promise<LibraryAssetSummary[]> {
  const rows = await db
    .prepare(`SELECT * FROM library_assets ORDER BY created_at DESC`)
    .all<LibraryAssetRow>();
  return (rows.results ?? []).map(assetToSummary);
}

export async function getLibraryAsset(
  db: D1Database,
  id: string,
): Promise<LibraryAssetRow | null> {
  return (
    (await db
      .prepare(`SELECT * FROM library_assets WHERE id = ?`)
      .bind(id)
      .first<LibraryAssetRow>()) ?? null
  );
}

export async function insertLibraryAsset(
  db: D1Database,
  input: {
    id: string;
    r2Key: string;
    filename: string;
    contentType: string;
    byteSize: number;
    kind: LibraryAssetRow["kind"];
  },
): Promise<LibraryAssetSummary> {
  const ts = nowIso();
  await db
    .prepare(
      `INSERT INTO library_assets (id, r2_key, filename, content_type, byte_size, kind, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.r2Key,
      input.filename,
      input.contentType,
      input.byteSize,
      input.kind,
      ts,
    )
    .run();
  return {
    id: input.id,
    filename: input.filename,
    contentType: input.contentType,
    byteSize: input.byteSize,
    kind: input.kind,
    createdAt: ts,
  };
}

export async function referencingChatsForAsset(
  db: D1Database,
  assetId: string,
): Promise<{ id: string; title: string }[]> {
  const rows = await db
    .prepare(
      `SELECT DISTINCT c.id, c.title
       FROM chats c
       JOIN messages m ON m.chat_id = c.id
       JOIN message_attachments ma ON ma.message_id = m.id
       WHERE ma.library_asset_id = ?
       ORDER BY c.updated_at DESC`,
    )
    .bind(assetId)
    .all<{ id: string; title: string }>();
  return rows.results ?? [];
}

export async function deleteLibraryAsset(
  db: D1Database,
  id: string,
): Promise<"ok" | "missing" | "referenced"> {
  const refs = await referencingChatsForAsset(db, id);
  if (refs.length > 0) return "referenced";
  const result = await db
    .prepare(`DELETE FROM library_assets WHERE id = ?`)
    .bind(id)
    .run();
  if ((result.meta.changes ?? 0) === 0) return "missing";
  return "ok";
}
