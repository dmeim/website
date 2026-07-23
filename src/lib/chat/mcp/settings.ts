import {
  MCP_SERVERS,
  type McpServerId,
  getMcpServer,
} from "./registry";

export type McpServerSettings = {
  enabled: boolean;
  /**
   * Per-tool on/off. Known `defaultTools` are seeded `true` in defaults.
   * Unknown / newly discovered tools stay off unless explicitly set `true`
   * (allowlist — do not auto-enable new tools from the server).
   */
  tools: Record<string, boolean>;
};

export type ChatMcpSettings = Record<McpServerId, McpServerSettings>;

function toolsMapFor(serverId: McpServerId): Record<string, boolean> {
  const server = getMcpServer(serverId);
  const tools: Record<string, boolean> = {};
  for (const name of server?.defaultTools ?? []) {
    tools[name] = true;
  }
  return tools;
}

export function defaultMcpSettings(): ChatMcpSettings {
  return {
    exa: { enabled: true, tools: toolsMapFor("exa") },
    context7: { enabled: true, tools: toolsMapFor("context7") },
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeServerSettings(
  id: McpServerId,
  raw: unknown,
): McpServerSettings {
  const defaults = toolsMapFor(id);
  if (!isPlainObject(raw)) {
    return { enabled: true, tools: defaults };
  }
  const tools: Record<string, boolean> = { ...defaults };
  if (isPlainObject(raw.tools)) {
    for (const [name, on] of Object.entries(raw.tools)) {
      if (typeof name === "string" && name.trim() && typeof on === "boolean") {
        tools[name] = on;
      }
    }
  }
  // Ensure every known default tool has an entry (restore path).
  for (const name of Object.keys(defaults)) {
    if (tools[name] === undefined) tools[name] = true;
  }
  return {
    enabled: raw.enabled === false ? false : true,
    tools,
  };
}

/** Parse JSON from D1 / request body into a full settings object. */
export function parseMcpSettings(raw: unknown): ChatMcpSettings {
  const base = defaultMcpSettings();
  if (raw == null) return base;
  let value: unknown = raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return base;
    try {
      value = JSON.parse(trimmed) as unknown;
    } catch {
      return base;
    }
  }
  if (!isPlainObject(value)) return base;
  return {
    exa: normalizeServerSettings("exa", value.exa),
    context7: normalizeServerSettings("context7", value.context7),
  };
}

export function serializeMcpSettings(settings: ChatMcpSettings): string {
  return JSON.stringify(parseMcpSettings(settings));
}

/**
 * Whether a tool should be offered to the model for this chat.
 * Allowlist: only tools with an explicit `true` entry are enabled.
 */
export function isMcpToolEnabled(
  settings: ChatMcpSettings,
  serverId: McpServerId,
  toolName: string,
): boolean {
  const server = settings[serverId];
  if (!server?.enabled) return false;
  return server.tools[toolName] === true;
}

export function mcpServerIds(): McpServerId[] {
  return MCP_SERVERS.map((s) => s.id);
}
