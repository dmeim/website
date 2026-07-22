import { describe, expect, it } from "vitest";

import {
  buildSvgDataUri,
  buildSvgPlaceholder,
  escapeSvgText,
  getSvgPlaceholderFilename,
} from "./svgPlaceholder.service";

describe("svgPlaceholder.service", () => {
  it("builds an SVG with default WxH label", () => {
    const svg = buildSvgPlaceholder({
      width: 600,
      height: 350,
      fontSize: 26,
      backgroundColor: "#0e1014",
      textColor: "#d4bc8a",
      customText: "",
      useExactSize: true,
    });

    expect(svg).toContain('viewBox="0 0 600 350"');
    expect(svg).toContain('width="600" height="350"');
    expect(svg).toContain(">600x350</text>");
  });

  it("omits exact size attributes when disabled", () => {
    const svg = buildSvgPlaceholder({
      width: 200,
      height: 100,
      fontSize: 20,
      backgroundColor: "#000",
      textColor: "#fff",
      customText: "Hero",
      useExactSize: false,
    });

    expect(svg).not.toMatch(/<svg[^>]*\swidth="/);
    expect(svg).toContain(">Hero</text>");
  });

  it("escapes text and builds a data URI", () => {
    expect(escapeSvgText(`a<b>&"c`)).toBe("a&lt;b&gt;&amp;\"c");
    const svg = buildSvgPlaceholder({
      width: 10,
      height: 10,
      fontSize: 8,
      backgroundColor: "#111",
      textColor: "#eee",
      customText: "ok",
      useExactSize: true,
    });
    expect(buildSvgDataUri(svg).startsWith("data:image/svg+xml;base64,")).toBe(true);
  });

  it("names download files from clamped dimensions", () => {
    expect(getSvgPlaceholderFilename(0, 99999)).toBe("placeholder-1x10000.svg");
  });
});
