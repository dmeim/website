import { describe, expect, it } from "vitest";
import { providerKindForModelId, normalizeGoModelsPayload } from "./models";
import {
  libraryKindFromMime,
  safeFilename,
  validateLibraryUpload,
  libraryR2Key,
} from "./library";
import { titleFromPrompt } from "./title";

describe("providerKindForModelId", () => {
  it("maps deepseek-v4-flash to openai-compatible", () => {
    expect(providerKindForModelId("deepseek-v4-flash")).toBe("openai-compatible");
  });

  it("maps anthropic-endpoint models", () => {
    expect(providerKindForModelId("minimax-m2.7")).toBe("anthropic");
    expect(providerKindForModelId("qwen3.7-plus")).toBe("anthropic");
  });

  it("respects catalog provider override", () => {
    expect(providerKindForModelId("weird-id", "anthropic")).toBe("anthropic");
  });
});

describe("normalizeGoModelsPayload", () => {
  it("normalizes OpenAI-style data array", () => {
    const models = normalizeGoModelsPayload({
      data: [{ id: "deepseek-v4-flash", name: "DeepSeek V4 Flash" }],
    });
    expect(models).toEqual([
      {
        id: "deepseek-v4-flash",
        name: "DeepSeek V4 Flash",
        provider: "openai-compatible",
      },
    ]);
  });

  it("falls back when empty", () => {
    const models = normalizeGoModelsPayload({ data: [] });
    expect(models.some((m) => m.id === "deepseek-v4-flash")).toBe(true);
  });
});

describe("library helpers", () => {
  it("derives kind from mime", () => {
    expect(libraryKindFromMime("image/png")).toBe("image");
    expect(libraryKindFromMime("video/mp4")).toBe("video");
    expect(libraryKindFromMime("application/pdf")).toBe("pdf");
    expect(libraryKindFromMime("text/plain")).toBe("other");
  });

  it("sanitizes filenames", () => {
    expect(safeFilename("../../evil.exe")).toBe("evil.exe");
    expect(safeFilename("my file (1).pdf")).toBe("my file (1).pdf");
  });

  it("rejects blocked extensions and huge files", () => {
    expect(
      validateLibraryUpload({
        filename: "x.sh",
        contentType: "text/plain",
        byteSize: 10,
      }).ok,
    ).toBe(false);
    expect(
      validateLibraryUpload({
        filename: "a.png",
        contentType: "image/png",
        byteSize: 50 * 1024 * 1024,
      }).ok,
    ).toBe(false);
  });

  it("builds r2 keys", () => {
    expect(libraryR2Key("abc", "note.pdf")).toBe("library/abc/note.pdf");
  });
});

describe("titleFromPrompt", () => {
  it("returns New chat for empty", () => {
    expect(titleFromPrompt("   ")).toBe("New chat");
  });

  it("truncates long prompts on word boundary", () => {
    const title = titleFromPrompt(
      "hello world this is a fairly long prompt that should be truncated nicely",
      40,
    );
    expect(title.endsWith("…")).toBe(true);
    expect(title.length).toBeLessThanOrEqual(41);
  });
});
