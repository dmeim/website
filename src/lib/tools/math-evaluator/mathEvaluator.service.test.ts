import { describe, expect, it } from "vitest";

import { evaluateExpression, evaluateMath } from "./mathEvaluator.service";

describe("math-evaluator", () => {
  describe("evaluateExpression", () => {
    it("evaluates basic arithmetic", () => {
      expect(evaluateExpression("2+2")).toBe("4");
      expect(evaluateExpression("10 / 4")).toBe("2.5");
      expect(evaluateExpression("3 * (4 + 1)")).toBe("15");
    });

    it("supports common mathjs functions from it-tools keywords", () => {
      expect(evaluateExpression("2*sqrt(6)")).toBe(String(2 * Math.sqrt(6)));
      expect(evaluateExpression("abs(-3)")).toBe("3");
      expect(evaluateExpression("sin(pi/2)")).toBe("1");
      expect(evaluateExpression("cos(0)")).toBe("1");
      expect(evaluateExpression("sqrt(16)")).toBe("4");
      expect(evaluateExpression("log(100, 10)")).toBe("2");
    });

    it("returns empty string for empty or invalid expressions", () => {
      expect(evaluateExpression("")).toBe("");
      expect(evaluateExpression("   ")).toBe("");
      expect(evaluateExpression("2+")).toBe("");
      expect(evaluateExpression("not_a_function(1)")).toBe("");
      expect(evaluateExpression("@@@")).toBe("");
    });

    it("stringifies non-finite numeric results", () => {
      expect(evaluateExpression("1/0")).toBe("Infinity");
      expect(evaluateExpression("-1/0")).toBe("-Infinity");
    });
  });

  describe("evaluateMath", () => {
    it("explains failures and leaves no result", () => {
      for (const [input, reason] of [["2+", "Unexpected end of expression"], ["foo", "Undefined symbol foo"], ["foo(1)", "Undefined function foo"], ["1 cm + 1 s", "Units do not match"]] as const) {
        const { result, error } = evaluateMath(input);
        expect(result).toBe("");
        expect(error).toContain("We could not evaluate this expression.");
        expect(error).toContain(reason);
      }
    });

    it("stays quiet for blank input and comments", () => {
      expect(evaluateMath("")).toEqual({ result: "", error: "" });
      expect(evaluateMath("   \n ")).toEqual({ result: "", error: "" });
      expect(evaluateMath("# a comment")).toEqual({ result: "", error: "" });
    });

    it("prints complex results", () => {
      expect(evaluateExpression("sqrt(-4)")).toBe("2i");
      expect(evaluateExpression("sqrt(-1)")).toBe("i");
      expect(evaluateExpression("(1+2i)*(3-i)")).toBe("5 + 5i");
    });

    it("prints matrices, units, booleans, and zero", () => {
      expect(evaluateExpression("[1,2;3,4]*2")).toBe("[[2, 4], [6, 8]]");
      expect(evaluateExpression("100 cm to m")).toBe("1 m");
      expect(evaluateExpression("1>2")).toBe("false");
      expect(evaluateExpression("1-1")).toBe("0");
      expect(evaluateExpression("0/0")).toBe("NaN");
    });

    it("prints several lines as a list", () => {
      expect(evaluateExpression("x=3\nx+1")).toBe("[3, 4]");
    });

    it("never shows function source code or [object Object]", () => {
      expect(evaluateExpression("f(x)=x^2")).toBe("f(x)");
      expect(evaluateExpression("sin")).toBe("function");
      expect(evaluateExpression("{a:1}")).toBe('{"a": 1}');
    });
  });
});
