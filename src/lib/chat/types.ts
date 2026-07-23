/**
 * Shared chat domain types (D1-shaped + API DTOs).
 */

import type { ChatGenerationMetadata } from "./message-metrics";
import type { ChatMcpSettings } from "./mcp/settings";

export type ChatRole = "user" | "assistant" | "system";

export type { ChatGenerationMetadata, ChatTokenUsage, ChatPerformanceMetrics } from "./message-metrics";
export type { ChatMcpSettings, McpServerSettings } from "./mcp/settings";
export type { McpServerId } from "./mcp/registry";

export type LibraryKind = "image" | "video" | "pdf" | "other";

export type ProviderKind = "openai-compatible" | "anthropic";

/** UI thinking / reasoning effort levels (model may support a subset). */
export type ThinkingLevel = "off" | "low" | "medium" | "high" | "xhigh";

export interface ChatRow {
  id: string;
  title: string;
  model_id: string;
  archived_at: string | null;
  generating_at: string | null;
  /** Last stream failure message (rate limit, provider error); null when healthy. */
  last_error: string | null;
  /** Source chat when this row was created via fork / edit-branch. */
  forked_from_chat_id: string | null;
  /** Pivot message id in the source chat (inclusive fork point or edited user msg). */
  forked_from_message_id: string | null;
  /** JSON blob of per-chat MCP server/tool prefs; null ⇒ defaults. */
  mcp_settings: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageRow {
  id: string;
  chat_id: string;
  role: ChatRole;
  content: string;
  /** Model chain-of-thought / reasoning text when present. */
  reasoning: string | null;
  /** JSON blob of generation usage/performance when present. */
  metadata: string | null;
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
  /** ISO timestamp while server is generating an assistant reply; null when idle. */
  generatingAt: string | null;
  /** Surfaced provider / stream error for retry UI; null when clear. */
  lastError: string | null;
  forkedFromChatId: string | null;
  forkedFromMessageId: string | null;
  /** Per-chat MCP preferences (defaults when unset). */
  mcpSettings: ChatMcpSettings;
  createdAt: string;
  updatedAt: string;
}

export interface ChatStatusDto {
  chatId: string;
  generating: boolean;
  generatingAt: string | null;
  lastError: string | null;
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
  /** Assistant reasoning / thinking text when the model returned any. */
  reasoning: string | null;
  /** Assistant generation usage/performance when available. */
  generation?: ChatGenerationMetadata | null;
  createdAt: string;
  seq: number;
  attachments: MessageAttachmentSummary[];
}

export interface GoModelInfo {
  id: string;
  name: string;
  /** API family for the request (OpenAI-compatible vs Anthropic messages). */
  provider: ProviderKind;
  /** Catalog / service provider (e.g. OpenCode Go). */
  chatProvider: "opencode-go";
  /** Thinking levels this model accepts in the UI. */
  thinkingLevels: ThinkingLevel[];
}

export interface ChatShellView {
  mode: "chat" | "library";
}
