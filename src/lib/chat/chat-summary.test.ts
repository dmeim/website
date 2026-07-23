import { describe, expect, it } from "vitest";
import { chatToSummary } from "./db";
import { defaultMcpSettings } from "./mcp/settings";
import type { ChatRow } from "./types";

describe("chatToSummary generatingAt", () => {
  it("maps generating_at onto generatingAt", () => {
    const row: ChatRow = {
      id: "c1",
      title: "Hello",
      model_id: "deepseek-v4-flash",
      archived_at: null,
      generating_at: "2026-07-22T12:00:00.000Z",
      last_error: null,
      forked_from_chat_id: null,
      forked_from_message_id: null,
      mcp_settings: null,
      created_at: "2026-07-22T11:00:00.000Z",
      updated_at: "2026-07-22T12:00:00.000Z",
    };
    expect(chatToSummary(row)).toMatchObject({
      id: "c1",
      generatingAt: "2026-07-22T12:00:00.000Z",
      lastError: null,
      forkedFromChatId: null,
      forkedFromMessageId: null,
      mcpSettings: defaultMcpSettings(),
    });
  });

  it("treats missing generating_at as null", () => {
    const row = {
      id: "c2",
      title: "Hi",
      model_id: "deepseek-v4-flash",
      archived_at: null,
      created_at: "2026-07-22T11:00:00.000Z",
      updated_at: "2026-07-22T11:00:00.000Z",
    } as ChatRow;
    expect(chatToSummary(row).generatingAt).toBeNull();
    expect(chatToSummary(row).lastError).toBeNull();
    expect(chatToSummary(row).mcpSettings).toEqual(defaultMcpSettings());
  });

  it("maps last_error onto lastError", () => {
    const row: ChatRow = {
      id: "c3",
      title: "Err",
      model_id: "deepseek-v4-flash",
      archived_at: null,
      generating_at: null,
      last_error: "Rate limited: 429",
      forked_from_chat_id: "c0",
      forked_from_message_id: "m1",
      mcp_settings: null,
      created_at: "2026-07-22T11:00:00.000Z",
      updated_at: "2026-07-22T12:00:00.000Z",
    };
    expect(chatToSummary(row).lastError).toBe("Rate limited: 429");
    expect(chatToSummary(row).forkedFromChatId).toBe("c0");
    expect(chatToSummary(row).forkedFromMessageId).toBe("m1");
  });

  it("parses mcp_settings JSON", () => {
    const row: ChatRow = {
      id: "c4",
      title: "Tools",
      model_id: "deepseek-v4-flash",
      archived_at: null,
      generating_at: null,
      last_error: null,
      forked_from_chat_id: null,
      forked_from_message_id: null,
      mcp_settings: JSON.stringify({
        exa: { enabled: false, tools: { web_search_exa: true } },
      }),
      created_at: "2026-07-22T11:00:00.000Z",
      updated_at: "2026-07-22T12:00:00.000Z",
    };
    expect(chatToSummary(row).mcpSettings.exa.enabled).toBe(false);
    expect(chatToSummary(row).mcpSettings.exa.tools.web_search_exa).toBe(true);
    expect(chatToSummary(row).mcpSettings.context7.enabled).toBe(true);
  });
});
