/** Default / test model — cheap & fast (OpenCode Go). */
export const DEFAULT_CHAT_MODEL_ID = "deepseek-v4-flash";

export const OPENCODE_GO_BASE = "https://opencode.ai/zen/go/v1";
export const OPENCODE_GO_MODELS_URL = `${OPENCODE_GO_BASE}/models`;
export const OPENCODE_GO_CHAT_COMPLETIONS_URL = `${OPENCODE_GO_BASE}/chat/completions`;
export const OPENCODE_GO_MESSAGES_URL = `${OPENCODE_GO_BASE}/messages`;

/** Max Library upload size (25 MiB). */
export const LIBRARY_MAX_BYTES = 25 * 1024 * 1024;

export const LIBRARY_ALLOWED_MIME_PREFIXES = [
  "image/",
  "video/",
  "audio/",
  "text/",
] as const;

export const LIBRARY_ALLOWED_MIME_EXACT = new Set([
  "application/pdf",
  "application/json",
  "application/xml",
  "application/zip",
  "application/x-zip-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

/** Reject obvious executables / scripts even if MIME is spoofed via extension check. */
export const LIBRARY_BLOCKED_EXTENSIONS = new Set([
  "exe",
  "dll",
  "bat",
  "cmd",
  "com",
  "msi",
  "scr",
  "ps1",
  "sh",
  "bash",
  "zsh",
  "app",
  "dmg",
  "pkg",
  "deb",
  "rpm",
  "apk",
  "jar",
  "wasm",
]);
