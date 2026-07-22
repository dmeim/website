import { evaluate } from "mathjs";

/**
 * Evaluate a math expression with mathjs (it-tools parity).
 * Errors and nullish results yield an empty string (`withDefaultOnError` + `?? ''`).
 */
export function evaluateExpression(expression: string): string {
  try {
    const value = evaluate(expression) ?? "";
    if (value === "") {
      return "";
    }
    return String(value);
  } catch {
    return "";
  }
}
