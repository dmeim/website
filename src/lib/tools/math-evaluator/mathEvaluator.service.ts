import { evaluate, format } from "mathjs";

export type MathEvaluation = {
  result: string;
  error: string;
};

function isPlainObject(value: unknown): boolean {
  return typeof value === "object" && value !== null && Object.getPrototypeOf(value) === Object.prototype;
}

/** `String()` prints functions as source code and objects as `[object Object]`; mathjs `format` reads well for both. */
function stringifyResult(value: unknown): string {
  return typeof value === "function" || isPlainObject(value) ? format(value) : String(value);
}

/**
 * Evaluate a math expression with mathjs (it-tools parity), keeping the reason when it fails.
 * Blank expressions and expressions with no value (like a comment) give an empty result and no error.
 */
export function evaluateMath(expression: string): MathEvaluation {
  try {
    const value: unknown = evaluate(expression);
    return { result: value === null || value === undefined ? "" : stringifyResult(value), error: "" };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error";
    return { result: "", error: `We could not evaluate this expression. ${reason}.` };
  }
}

/** The result as a string; errors and empty values yield an empty string. */
export function evaluateExpression(expression: string): string {
  return evaluateMath(expression).result;
}
