import { ChevronLeft, ChevronRight } from "lucide";
import { MCP_SERVERS, type McpServerId } from "@/lib/chat/mcp/registry";
import {
  defaultMcpSettings,
  parseMcpSettings,
  type ChatMcpSettings,
} from "@/lib/chat/mcp/settings";
import { LucideIcon } from "./LucideIcon";

type McpSettingsPanelProps = {
  settings: ChatMcpSettings;
  disabled?: boolean;
  /** Currently drilled-into server, or null for list. */
  detailServerId: McpServerId | null;
  onDetailServerIdChange: (id: McpServerId | null) => void;
  onChange: (next: ChatMcpSettings) => void;
};

function humanToolLabel(name: string): string {
  return name.replace(/_/g, " ").replace(/-/g, " ");
}

export function McpSettingsPanel({
  settings,
  disabled = false,
  detailServerId,
  onDetailServerIdChange,
  onChange,
}: McpSettingsPanelProps) {
  const safe = parseMcpSettings(settings);

  const setServerEnabled = (id: McpServerId, enabled: boolean) => {
    const current = safe[id];
    const tools =
      Object.keys(current.tools).length > 0
        ? current.tools
        : defaultMcpSettings()[id].tools;
    onChange({
      ...safe,
      [id]: { enabled, tools: { ...tools } },
    });
  };

  const setToolEnabled = (
    id: McpServerId,
    toolName: string,
    enabled: boolean,
  ) => {
    onChange({
      ...safe,
      [id]: {
        ...safe[id],
        tools: { ...safe[id].tools, [toolName]: enabled },
      },
    });
  };

  if (detailServerId) {
    const server = MCP_SERVERS.find((s) => s.id === detailServerId);
    const serverSettings = server ? safe[detailServerId] : null;
    if (!server || !serverSettings) {
      return (
        <div className="chat-mcp-settings" role="group" aria-label="MCP tools">
          <button
            type="button"
            className="chat-mcp-settings__back"
            onClick={() => onDetailServerIdChange(null)}
            disabled={disabled}
          >
            <LucideIcon icon={ChevronLeft} size={16} />
            <span>Tools</span>
          </button>
          <p className="chat-mcp-settings__hint">Unknown server.</p>
        </div>
      );
    }
    const toolNames = Array.from(
      new Set([
        ...server.defaultTools,
        ...Object.keys(serverSettings.tools),
      ]),
    );

    return (
      <div className="chat-mcp-settings" role="group" aria-label={`${server.label} tools`}>
        <button
          type="button"
          className="chat-mcp-settings__back"
          onClick={() => onDetailServerIdChange(null)}
          disabled={disabled}
        >
          <LucideIcon icon={ChevronLeft} size={16} />
          <span>Tools</span>
        </button>
        <p className="chat-mcp-settings__detail-title">{server.label}</p>
        <ul className="chat-mcp-settings__tools">
          {toolNames.map((toolName) => {
            const on = serverSettings.tools[toolName] === true;
            return (
              <li key={toolName} className="chat-mcp-settings__tool-row">
                <span className="chat-mcp-settings__tool-name">
                  {humanToolLabel(toolName)}
                </span>
                <label className="chat-mcp-settings__switch">
                  <span className="visually-hidden">
                    {on ? "Disable" : "Enable"} {toolName}
                  </span>
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={disabled || !serverSettings.enabled}
                    onChange={(event) =>
                      setToolEnabled(
                        detailServerId,
                        toolName,
                        event.target.checked,
                      )
                    }
                  />
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className="chat-mcp-settings" role="group" aria-label="MCP tools">
      <p className="chat-mcp-settings__hint">
        Enable web search and docs tools for this chat.
      </p>
      <ul className="chat-mcp-settings__list">
        {MCP_SERVERS.map((server) => {
          const serverSettings = safe[server.id];
          const enabledCount = Object.entries(serverSettings.tools).filter(
            ([, on]) => on !== false,
          ).length;
          return (
            <li key={server.id} className="chat-mcp-settings__row">
              <button
                type="button"
                className="chat-mcp-settings__row-main"
                onClick={() => onDetailServerIdChange(server.id)}
                disabled={disabled}
              >
                <span className="chat-mcp-settings__row-text">
                  <span className="chat-mcp-settings__row-label">
                    {server.label}
                  </span>
                  <span className="chat-mcp-settings__row-desc">
                    {server.description}
                    {serverSettings.enabled
                      ? ` · ${enabledCount} tool${enabledCount === 1 ? "" : "s"}`
                      : " · off"}
                  </span>
                </span>
                <LucideIcon icon={ChevronRight} size={16} />
              </button>
              <label className="chat-mcp-settings__switch">
                <span className="visually-hidden">
                  {serverSettings.enabled ? "Disable" : "Enable"} {server.label}
                </span>
                <input
                  type="checkbox"
                  checked={serverSettings.enabled}
                  disabled={disabled}
                  onChange={(event) =>
                    setServerEnabled(server.id, event.target.checked)
                  }
                  onClick={(event) => event.stopPropagation()}
                />
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
