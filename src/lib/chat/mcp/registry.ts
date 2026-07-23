/**
 * Config-driven MCP registry (HTTP only — Workers cannot use stdio).
 */

export type McpServerId = "exa" | "context7";

export type McpServerConfig = {
  id: McpServerId;
  label: string;
  description: string;
  url: string;
  /** Env secret name; missing/blank ⇒ server skipped (chat still works). */
  secretEnv: "EXA_API_KEY" | "CONTEXT7_API_KEY";
  /** Build auth headers for the MCP HTTP transport. */
  authHeaders: (apiKey: string) => Record<string, string>;
  /** Known tool names for defaults / UI (server may expose a subset). */
  defaultTools: string[];
};

export const MCP_SERVERS: readonly McpServerConfig[] = [
  {
    id: "exa",
    label: "Exa",
    description: "Web search and page fetch",
    // Pin default search/fetch tools; omit agent_run unless opted in later.
    url: "https://mcp.exa.ai/mcp?tools=web_search_exa,web_fetch_exa",
    secretEnv: "EXA_API_KEY",
    authHeaders: (apiKey) => ({ "x-api-key": apiKey }),
    defaultTools: ["web_search_exa", "web_fetch_exa"],
  },
  {
    id: "context7",
    label: "Context7",
    description: "Up-to-date library documentation",
    url: "https://mcp.context7.com/mcp",
    secretEnv: "CONTEXT7_API_KEY",
    authHeaders: (apiKey) => ({ CONTEXT7_API_KEY: apiKey }),
    defaultTools: ["resolve-library-id", "query-docs"],
  },
] as const;

export function getMcpServer(id: string): McpServerConfig | undefined {
  return MCP_SERVERS.find((s) => s.id === id);
}

/** Prefixed tool name to avoid collisions across servers. */
export function mcpToolName(serverId: McpServerId, toolName: string): string {
  return `${serverId}__${toolName}`;
}

/** Strip server prefix when present; otherwise return as-is. */
export function parseMcpToolName(
  prefixed: string,
): { serverId: string; toolName: string } {
  const idx = prefixed.indexOf("__");
  if (idx <= 0) return { serverId: "", toolName: prefixed };
  return {
    serverId: prefixed.slice(0, idx),
    toolName: prefixed.slice(idx + 2),
  };
}
