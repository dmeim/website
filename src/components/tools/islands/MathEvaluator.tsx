import { useMemo, useState } from "react";

import {
  ToolHint,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
  ToolTextarea,
} from "@/components/tools/ui";
import { evaluateExpression } from "@/lib/tools/math-evaluator";

import "./MathEvaluator.css";

export default function MathEvaluator() {
  const [expression, setExpression] = useState("");

  const result = useMemo(
    () => evaluateExpression(expression),
    [expression],
  );

  return (
    <ToolIsland className="math-eval-tool">
      <ToolPanel labelledBy="math-eval-heading" className="math-eval-tool__panel">
        <ToolSectionHeading
          title="Math evaluator"
          titleId="math-eval-heading"
          description={
            <ToolHint>
              Evaluate expressions with functions like{" "}
              <code>sqrt</code>, <code>sin</code>, <code>cos</code>,{" "}
              <code>abs</code>, and more.
            </ToolHint>
          }
        />

        <ToolTextarea
          id="math-eval-expression"
          label="Expression"
          full
          code
          rows={3}
          autoFocus
          spellCheck={false}
          placeholder="Your math expression (ex: 2*sqrt(6) )..."
          value={expression}
          onChange={(event) => setExpression(event.target.value)}
          data-testid="math-eval-expression"
        />

        {result !== "" ? (
          <div className="math-eval-result" aria-live="polite">
            <p className="math-eval-result__label">Result</p>
            <p
              className="math-eval-result__value"
              data-testid="math-eval-result"
            >
              {result}
            </p>
          </div>
        ) : (
          <ToolStatus live="polite">
            Enter a valid math expression to see the result.
          </ToolStatus>
        )}
      </ToolPanel>
    </ToolIsland>
  );
}
