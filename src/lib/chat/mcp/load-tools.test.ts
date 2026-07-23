import { describe, expect, it } from "vitest";
import { mcpLoadFailureNote, type LoadedMcpTools } from "./load-tools";

function emptyLoaded(
  skipped: LoadedMcpTools["skipped"],
  tools: LoadedMcpTools["tools"] = {},
): LoadedMcpTools {
  return { tools, clients: [], skipped };
}

describe("mcpLoadFailureNote", () => {
  it("returns null when tools loaded and nothing failed", () => {
    expect(
      mcpLoadFailureNote(
        emptyLoaded([{ id: "exa", reason: "disabled" }], {
          exa__web_search_exa: {} as never,
        }),
      ),
    ).toBeNull();
  });

  it("returns null when everything is merely disabled", () => {
    expect(
      mcpLoadFailureNote(
        emptyLoaded([
          { id: "exa", reason: "disabled" },
          { id: "context7", reason: "disabled" },
        ]),
      ),
    ).toBeNull();
  });

  it("summarizes connect / key failures when no tools attached", () => {
    const note = mcpLoadFailureNote(
      emptyLoaded([
        { id: "exa", reason: "missing_api_key" },
        {
          id: "context7",
          reason:
            "Illegal invocation: function called with incorrect `this` reference.",
        },
      ]),
    );
    expect(note).toContain("MCP tools unavailable");
    expect(note).toContain("exa: missing API key");
    expect(note).toContain("context7: Illegal invocation");
  });

  it("surfaces skipped servers even when some tools loaded", () => {
    const note = mcpLoadFailureNote(
      emptyLoaded(
        [
          { id: "exa", reason: "connect_timeout" },
          { id: "context7", reason: "disabled" },
        ],
        { context7__query_docs: {} as never },
      ),
    );
    expect(note).toContain("MCP partial");
    expect(note).toContain("exa: connect timeout");
    expect(note).not.toContain("context7");
  });
});
