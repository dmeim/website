import { describe, expect, it, vi } from "vitest";

import {
  applyLengthFilter,
  clampNumber,
  formatCodeItem,
  generateCodeItems,
  getLengthLabel,
  padNumber,
  parseExtraWords,
  uniqueWords,
} from "./wordCode.service";

describe("wordCode.service", () => {
  it("parses extra words from lines and commas", () => {
    expect(parseExtraWords("alpha\nbeta, gamma")).toEqual(["alpha", "beta", "gamma"]);
  });

  it("deduplicates words case-insensitively via uniqueWords", () => {
    expect(uniqueWords(["Sun", "sun", "Moon", ""])).toEqual(["Sun", "Moon"]);
  });

  it("filters by word length", () => {
    expect(applyLengthFilter(["a", "ab", "abcd"], 2, 3)).toEqual(["ab"]);
  });

  it("pads digit suffixes and formats items", () => {
    expect(padNumber(7, 3)).toBe("007");
    expect(
      formatCodeItem(
        { word: "oak", number: "12" },
        { position: "end", wordCase: "normal" },
      ),
    ).toBe("oak12");
    expect(
      formatCodeItem(
        { word: "oak", number: "12" },
        { position: "start", wordCase: "uppercase" },
      ),
    ).toBe("12OAK");
  });

  it("generates the requested number of codes", () => {
    const codes = generateCodeItems({
      words: ["oak", "pine", "elm"],
      digits: 2,
      requested: 5,
      randomize: false,
      allowRepeats: true,
    });

    expect(codes).toHaveLength(5);
    expect(codes.every((code) => code.number.length === 2)).toBe(true);
  });

  it("clamps numbers and labels filtered length ranges", () => {
    expect(clampNumber(99, 1, 8, 2)).toBe(8);
    expect(
      getLengthLabel({ min: 2, max: 5, boundsMin: 1, boundsMax: 10 }),
    ).not.toBe("no limits");
    expect(
      getLengthLabel({ min: 1, max: 10, boundsMin: 1, boundsMax: 10 }),
    ).toBe("no limits");
  });

  it("uses Web Crypto only for random draws", () => {
    const spy = vi.spyOn(Math, "random");
    generateCodeItems({ words: ["a", "b"], digits: 4, requested: 50, randomize: true, allowRepeats: true });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("does not repeat words when repeats are off, and keeps list order when not randomizing", () => {
    const words = ["alpha", "beta", "gamma"];
    const shuffled = generateCodeItems({ words, digits: 2, requested: 3, randomize: true, allowRepeats: false });
    expect(shuffled.map((item) => item.word).sort()).toEqual(words);
    const ordered = generateCodeItems({ words, digits: 2, requested: 5, randomize: false, allowRepeats: true });
    expect(ordered.map((item) => item.word)).toEqual(["alpha", "beta", "gamma", "alpha", "beta"]);
  });

  it("writes length labels that read correctly mid-sentence", () => {
    expect(getLengthLabel({ min: 1, max: 1, boundsMin: 1, boundsMax: 10 })).toBe("up to 1 letter");
    expect(getLengthLabel({ min: 3, max: 5, boundsMin: 1, boundsMax: 10 })).toBe("3–5 letters");
    expect(getLengthLabel({ min: 3, max: 10, boundsMin: 1, boundsMax: 10 })).toBe("3+ letters");
    expect(getLengthLabel({ min: 4, max: 4, boundsMin: 1, boundsMax: 10 })).toBe("4 letters");
  });
});
