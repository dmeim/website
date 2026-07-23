import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";
import type { Tool } from "ai";
import {
  MCP_SERVERS,
  mcpToolName,
  type McpServerConfig,
  type McpServerId,
} from "./registry";
import {
  isMcpToolEnabled,
  type ChatMcpSettings,
} from "./settings";

export type LoadedMcpTools = {
  tools: Record<string, Tool>;
  clients: MCPClient[];
  /** Servers skipped (missing key or connect failure). */
  skipped: Array<{ id: McpServerId; reason: string }>;
};

/** Connect + tools() budget per server (Workers-friendly). */
export const MCP_CONNECT_TIMEOUT_MS = 12_000;

function readSecret(
  env: Env,
  name: McpServerConfig["secretEnv"],
): string | undefined {
  const value = env[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

async function closeQuietly(client: MCPClient): Promise<void> {
  try {
    await client.close();
  } catch {
    // Best-effort cleanup.
  }
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(label)), ms);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

/**
 * Cloudflare Workers throw `Illegal invocation` when `globalThis.fetch` is
 * stored and called unbound (as `@ai-sdk/mcp` does by default). Call through
 * an arrow so `this` stays correct.
 *
 * Always forces `redirect: "manual"`: Workers reject `redirect: "error"`, and
 * `redirect: "follow"` re-issues the request (including API key headers) to the
 * Location host — a cross-origin credential leak. Redirect responses fail the
 * connect for that server instead.
 */
export function workersSafeFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  return globalThis
    .fetch(input, { ...init, redirect: "manual" })
    .then((res) => {
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("Location") ?? "";
        const loc = location.replace(/[^\x20-\x7E]/g, "?").slice(0, 80);
        throw new Error(
          `MCP redirect refused (${res.status}${loc ? ` -> ${loc}` : ""})`,
        );
      }
      return res;
    });
}

function formatSkipReason(reason: string): string {
  if (reason === "missing_api_key") return "missing API key";
  if (reason === "no_enabled_tools") return "no tools enabled";
  if (reason === "connect_timeout") return "connect timeout";
  // Keep reasons short + ASCII for response headers / banners.
  const ascii = reason.replace(/[^\x20-\x7E]/g, "?");
  return ascii.length > 80 ? `${ascii.slice(0, 77)}...` : ascii;
}

/** Human-readable note when enabled MCP servers failed to contribute tools. */
export function mcpLoadFailureNote(loaded: LoadedMcpTools): string | null {
  const failures = loaded.skipped.filter((s) => s.reason !== "disabled");
  if (failures.length === 0) return null;

  const toolCount = Object.keys(loaded.tools).length;
  const parts = failures.map((s) => `${s.id}: ${formatSkipReason(s.reason)}`);

  if (toolCount === 0) {
    return `MCP tools unavailable (${parts.join("; ")})`;
  }
  // Surface partial skips even when other servers contributed tools.
  return `MCP partial: skipped ${parts.join("; ")}`;
}

/**
 * Connect enabled MCP servers that have API keys, discover tools, prefix names,
 * and filter by per-chat settings. Missing keys skip that server (chat continues).
 */
export async function loadMcpTools(
  env: Env,
  settings: ChatMcpSettings,
): Promise<LoadedMcpTools> {
  const tools: Record<string, Tool> = {};
  const clients: MCPClient[] = [];
  const skipped: LoadedMcpTools["skipped"] = [];

  for (const server of MCP_SERVERS) {
    if (!settings[server.id]?.enabled) {
      skipped.push({ id: server.id, reason: "disabled" });
      continue;
    }

    const apiKey = readSecret(env, server.secretEnv);
    if (!apiKey) {
      skipped.push({ id: server.id, reason: "missing_api_key" });
      continue;
    }

    let client: MCPClient | undefined;
    try {
      client = await withTimeout(
        createMCPClient({
          transport: {
            type: "http",
            url: server.url,
            headers: server.authHeaders(apiKey),
            // MCP types only allow follow|error; Workers reject "error".
            // workersSafeFetch forces "manual" and refuses 3xx (no key forward).
            redirect: "follow",
            fetch: workersSafeFetch,
          },
        }),
        MCP_CONNECT_TIMEOUT_MS,
        "connect_timeout",
      );
      const discovered = await withTimeout(
        client.tools(),
        MCP_CONNECT_TIMEOUT_MS,
        "connect_timeout",
      );
      let any = false;
      for (const [name, tool] of Object.entries(discovered)) {
        if (!isMcpToolEnabled(settings, server.id, name)) continue;
        tools[mcpToolName(server.id, name)] = tool as Tool;
        any = true;
      }
      if (!any) {
        await closeQuietly(client);
        skipped.push({ id: server.id, reason: "no_enabled_tools" });
        continue;
      }
      clients.push(client);
    } catch (err) {
      if (client) await closeQuietly(client);
      const message = err instanceof Error ? err.message : "connect_failed";
      skipped.push({ id: server.id, reason: message });
    }
  }

  return { tools, clients, skipped };
}

export async function closeMcpClients(clients: MCPClient[]): Promise<void> {
  await Promise.all(clients.map(closeQuietly));
}
