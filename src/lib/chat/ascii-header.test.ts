import { describe, expect, it } from "vitest";
import { toAsciiHeaderValue } from "./ascii-header";

describe("toAsciiHeaderValue", () => {
  it("passes through ASCII unchanged", () => {
    expect(toAsciiHeaderValue("degraded: photo.jpg")).toBe(
      "degraded: photo.jpg",
    );
  });

  it("replaces Unicode ellipsis with ASCII ...", () => {
    expect(toAsciiHeaderValue("truncated\u2026more")).toBe("truncated...more");
  });

  it("replaces other non-ASCII with ?", () => {
    expect(toAsciiHeaderValue("café — résumé")).toBe("caf? ? r?sum?");
  });

  it("truncates with ASCII ellipsis under maxLen", () => {
    const long = "a".repeat(20);
    expect(toAsciiHeaderValue(long, 10)).toBe("aaaaaaa...");
  });
});
