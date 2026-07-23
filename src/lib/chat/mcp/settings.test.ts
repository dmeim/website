import { describe, expect, it } from "vitest";
import {
  defaultMcpSettings,
  isMcpToolEnabled,
  parseMcpSettings,
  serializeMcpSettings,
} from "./settings";

describe("parseMcpSettings", () => {
  it("returns defaults for null/empty", () => {
    const d = defaultMcpSettings();
    expect(parseMcpSettings(null)).toEqual(d);
    expect(parseMcpSettings("")).toEqual(d);
    expect(parseMcpSettings("{}")).toEqual(d);
  });

  it("preserves tool toggles when master is off", () => {
    const parsed = parseMcpSettings({
      exa: {
        enabled: false,
        tools: { web_search_exa: true, web_fetch_exa: false },
      },
    });
    expect(parsed.exa.enabled).toBe(false);
    expect(parsed.exa.tools.web_search_exa).toBe(true);
    expect(parsed.exa.tools.web_fetch_exa).toBe(false);
    expect(isMcpToolEnabled(parsed, "exa", "web_search_exa")).toBe(false);
  });

  it("round-trips via serialize", () => {
    const settings = parseMcpSettings({
      context7: {
        enabled: true,
        tools: { "resolve-library-id": false, "query-docs": true },
      },
    });
    expect(parseMcpSettings(serializeMcpSettings(settings))).toEqual(settings);
  });

  it("does not auto-enable unknown tools (allowlist)", () => {
    const settings = defaultMcpSettings();
    expect(isMcpToolEnabled(settings, "exa", "web_search_exa")).toBe(true);
    expect(isMcpToolEnabled(settings, "exa", "brand_new_agent_tool")).toBe(
      false,
    );
    const withOptIn = parseMcpSettings({
      exa: {
        enabled: true,
        tools: { ...settings.exa.tools, brand_new_agent_tool: true },
      },
    });
    expect(isMcpToolEnabled(withOptIn, "exa", "brand_new_agent_tool")).toBe(
      true,
    );
  });
});
