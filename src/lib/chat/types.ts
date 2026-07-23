/**
 * Shared chat domain types (D1-shaped + API DTOs).
 */

export type ChatRole = "user" | "assistant" | "system";

export type LibraryKind = "image" | "video" | "pdf" | "other";

export type ProviderKind = "openai-compatible" | "anthropic";

export interface ChatRow {
  id: string;
  title: string;
  model_id: string;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageRow {
  id: string;
  chat_id: string;
  role: ChatRole;
  content: string;
  created_at: string;
  seq: number;
}

export interface LibraryAssetRow {
  id: string;
  r2_key: string;
  filename: string;
  content_type: string;
  byte_size: number;
  kind: LibraryKind;
  created_at: string;
}

export interface MessageAttachmentRow {
  id: string;
  message_id: string;
  library_asset_id: string;
}

export interface ChatSummary {
  id: string;
  title: string;
  modelId: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryAssetSummary {
  id: string;
  filename: string;
  contentType: string;
  byteSize: number;
  kind: LibraryKind;
  createdAt: string;
}

export interface MessageAttachmentSummary {
  id: string;
  libraryAssetId: string;
  filename: string;
  contentType: string;
  kind: LibraryKind;
  byteSize: number;
}

export interface ChatMessageDto {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  seq: number;
  attachments: MessageAttachmentSummary[];
}

export interface GoModelInfo {
  id: string;
  name: string;
  provider: ProviderKind;
}

export interface ChatShellView {
  mode: "chat" | "library";
}
