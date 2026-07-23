-- Private AI chat schema (D1)
-- Spec: docs/superpowers/specs/2026-07-22-chat-design.md

CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL DEFAULT 'New chat',
  model_id TEXT NOT NULL DEFAULT 'deepseek-v4-flash',
  archived_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chats_archived_updated
  ON chats (archived_at, updated_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY NOT NULL,
  chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  seq INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_messages_chat_seq
  ON messages (chat_id, seq ASC);

CREATE TABLE IF NOT EXISTS library_assets (
  id TEXT PRIMARY KEY NOT NULL,
  r2_key TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('image', 'video', 'pdf', 'other')),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_library_assets_created
  ON library_assets (created_at DESC);

CREATE TABLE IF NOT EXISTS message_attachments (
  id TEXT PRIMARY KEY NOT NULL,
  message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  library_asset_id TEXT NOT NULL REFERENCES library_assets(id),
  UNIQUE (message_id, library_asset_id)
);

CREATE INDEX IF NOT EXISTS idx_message_attachments_asset
  ON message_attachments (library_asset_id);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message
  ON message_attachments (message_id);
