import type {
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
  input: { title?: string; modelId: string },
): Promise<ChatSummary> {
  const id = newId();
  const ts = nowIso();
  const title = input.title?.trim() || "New chat";
  await db
    .prepare(
      `INSERT INTO chats (id, title, model_id, archived_at, generating_at, created_at, updated_at)
       VALUES (?, ?, ?, NULL, NULL, ?, ?)`,
    )
    .bind(id, title, input.modelId, ts, ts)
    .run();
  return {
    id,
    title,
    modelId: input.modelId,
    archivedAt: null,
    generatingAt: null,
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
  },
): Promise<ChatSummary | null> {
  const existing = await getChat(db, id);
  if (!existing) return null;
  const title = patch.title !== undefined ? patch.title.trim() || existing.title : existing.title;
  const modelId = patch.modelId ?? existing.model_id;
  const archivedAt =
    patch.archivedAt !== undefined ? patch.archivedAt : existing.archived_at;
  const updatedAt = nowIso();
  await db
    .prepare(
      `UPDATE chats SET title = ?, model_id = ?, archived_at = ?, updated_at = ? WHERE id = ?`,
    )
    .bind(title, modelId, archivedAt, updatedAt, id)
    .run();
  return {
    id,
    title,
    modelId,
    archivedAt,
    generatingAt: existing.generating_at ?? null,
    createdAt: existing.created_at,
    updatedAt,
  };
}

export async function setChatGenerating(
  db: D1Database,
  id: string,
  generating: boolean,
): Promise<void> {
  const ts = nowIso();
  if (generating) {
    await db
      .prepare(
        `UPDATE chats SET generating_at = ?, updated_at = ? WHERE id = ?`,
      )
      .bind(ts, ts, id)
      .run();
    return;
  }
  await db
    .prepare(
      `UPDATE chats SET generating_at = NULL, updated_at = ? WHERE id = ?`,
    )
    .bind(ts, id)
    .run();
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
    attachmentIds?: string[];
  },
): Promise<ChatMessageDto> {
  const id = newId();
  const ts = nowIso();
  const seq = await nextMessageSeq(db, input.chatId);
  await db
    .prepare(
      `INSERT INTO messages (id, chat_id, role, content, created_at, seq)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, input.chatId, input.role, input.content, ts, seq)
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
