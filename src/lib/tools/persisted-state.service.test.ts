import { describe, expect, it } from "vitest";
import { parseQueryValue, parseStoredValue, withQueryValue } from "./persisted-state";

describe("parseStoredValue", () => {
  it("returns stored values of the same type", () => {
    expect(parseStoredValue("3", 1)).toBe(3);
    expect(parseStoredValue('"abc"', "x")).toBe("abc");
    expect(parseStoredValue("false", true)).toBe(false);
    expect(parseStoredValue("[1,2]", [] as number[])).toEqual([1, 2]);
    expect(parseStoredValue('{"a":1}', { a: 0 })).toEqual({ a: 1 });
  });

  it("falls back when missing, corrupt, or the wrong shape", () => {
    expect(parseStoredValue(null, 1)).toBe(1);
    expect(parseStoredValue("{nope", 1)).toBe(1);
    expect(parseStoredValue('"text"', 1)).toBe(1);
    expect(parseStoredValue("[1]", { a: 0 })).toEqual({ a: 0 });
    expect(parseStoredValue("null", { a: 0 })).toEqual({ a: 0 });
  });

  it("applies the validator", () => {
    expect(parseStoredValue("500", 2, (value) => value <= 100)).toBe(2);
    expect(parseStoredValue("50", 2, (value) => value <= 100)).toBe(50);
  });
});

describe("parseQueryValue", () => {
  it("decodes to the type of the fallback", () => {
    expect(parseQueryValue("12", 64)).toBe(12);
    expect(parseQueryValue("false", true)).toBe(false);
    expect(parseQueryValue("Base64", "Hex")).toBe("Base64");
  });

  it("falls back on missing or unusable values", () => {
    expect(parseQueryValue(null, 64)).toBe(64);
    expect(parseQueryValue("abc", 64)).toBe(64);
    expect(parseQueryValue("", 64)).toBe(64);
    expect(parseQueryValue("Infinity", 64)).toBe(64);
    expect(parseQueryValue("yes", true)).toBe(true);
    expect(parseQueryValue("Nope", "Hex", (value) => value === "Hex")).toBe("Hex");
  });
});

describe("withQueryValue", () => {
  it("sets non-default values and keeps other parameters", () => {
    expect(withQueryValue("?a=1", "length", 12, 64)).toBe("?a=1&length=12");
  });

  it("removes a parameter at its default", () => {
    expect(withQueryValue("?length=12", "length", 64, 64)).toBe("");
    expect(withQueryValue("?a=1&length=12", "length", 64, 64)).toBe("?a=1");
  });
});
