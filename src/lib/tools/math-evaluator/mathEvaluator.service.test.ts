import { describe, expect, it } from "vitest";

import { evaluateExpression } from "./mathEvaluator.service";

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
});
