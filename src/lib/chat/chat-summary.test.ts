import { describe, expect, it } from "vitest";
import { chatToSummary } from "./db";
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
      created_at: "2026-07-22T11:00:00.000Z",
      updated_at: "2026-07-22T12:00:00.000Z",
    };
    expect(chatToSummary(row)).toMatchObject({
      id: "c1",
      generatingAt: "2026-07-22T12:00:00.000Z",
      lastError: null,
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
  });

  it("maps last_error onto lastError", () => {
    const row: ChatRow = {
      id: "c3",
      title: "Err",
      model_id: "deepseek-v4-flash",
      archived_at: null,
      generating_at: null,
      last_error: "Rate limited: 429",
      created_at: "2026-07-22T11:00:00.000Z",
      updated_at: "2026-07-22T12:00:00.000Z",
    };
    expect(chatToSummary(row).lastError).toBe("Rate limited: 429");
  });
});
