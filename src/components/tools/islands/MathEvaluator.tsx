import { useMemo, useState } from "react";

import { Code, KeyValue, Notice, Panel, Textarea, ToolFrame } from "@/ui/react";
import { evaluateMath } from "@/lib/tools/math-evaluator";

export default function MathEvaluator() {
  const [expression, setExpression] = useState("");

  const { result, error } = useMemo(
    () => evaluateMath(expression),
    [expression],
  );

  return (
    <ToolFrame>
      <Panel
        title="Math evaluator"
        titleId="math-eval-heading"
        description={
          <>
            Evaluate expressions with functions like <Code>sqrt</Code>,{" "}
            <Code>sin</Code>, <Code>cos</Code>, <Code>abs</Code>, and more.
          </>
        }
      >
        <Textarea
          id="math-eval-expression"
          label="Expression"
          mono
          rows={3}
          autoFocus
          spellCheck={false}
          placeholder="Your math expression (ex: 2*sqrt(6) )…"
          value={expression}
          onChange={(event) => setExpression(event.target.value)}
          data-testid="math-eval-expression"
        />

        {result !== "" ? (
          <KeyValue
            aria-live="polite"
            items={[
              {
                label: "Result",
                value: <span data-testid="math-eval-result">{result}</span>,
                mono: true,
                copy: result,
              },
            ]}
          />
        ) : null}

        {error ? (
          <Notice tone="danger" live="polite">
            {error}
          </Notice>
        ) : null}
      </Panel>
    </ToolFrame>
  );
}
