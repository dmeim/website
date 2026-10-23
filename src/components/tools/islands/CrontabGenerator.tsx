import { useMemo, useState } from "react";

import { CodeBlock, CopyButton, FormGrid, Input, Notice, Panel, Switch, Table, ToolFrame } from "@/ui/react";
import {
  CRON_FORMAT_DIAGRAM,
  CRON_HELPERS,
  DEFAULT_CRON_DESCRIBE_OPTIONS,
  DEFAULT_CRON_EXPRESSION,
  cronValidationMessage,
  describeCron,
} from "@/lib/tools/crontab-generator";
import "./CrontabGenerator.css";

export default function CrontabGenerator() {
  const [expression, setExpression] = useState(DEFAULT_CRON_EXPRESSION);
  const [verbose, setVerbose] = useState(DEFAULT_CRON_DESCRIBE_OPTIONS.verbose);
  const [use24HourTimeFormat, setUse24HourTimeFormat] = useState(
    DEFAULT_CRON_DESCRIBE_OPTIONS.use24HourTimeFormat,
  );
  const [dayOfWeekStartIndexZero, setDayOfWeekStartIndexZero] = useState(
    DEFAULT_CRON_DESCRIBE_OPTIONS.dayOfWeekStartIndexZero,
  );

  const options = useMemo(
    () => ({ verbose, use24HourTimeFormat, dayOfWeekStartIndexZero }),
    [verbose, use24HourTimeFormat, dayOfWeekStartIndexZero],
  );

  const description = useMemo(() => describeCron(expression, options), [expression, options]);

  const invalidMessage = useMemo(() => cronValidationMessage(expression), [expression]);

  const showInvalid = invalidMessage !== null || description === null;

  return (
    <ToolFrame layout="split" stagger>
      <Panel
        title="Cron expression"
        titleId="cg-heading"
        description="Enter a cron schedule to validate it and read the plain-English description."
        actions={<CopyButton value={expression} />}
      >
        <Input
          id="cg-expression"
          label="Expression"
          mono
          size="lg"
          value={expression}
          placeholder="* * * * *"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={showInvalid}
          aria-describedby="cg-description"
          onChange={(event) => setExpression(event.target.value)}
        />

        {showInvalid ? (
          <Notice tone="danger" live="polite">
            {invalidMessage ?? "This cron is invalid"}
          </Notice>
        ) : null}

        <p
          id="cg-description"
          className="cg-description"
          aria-live="polite"
          data-testid="cron-description"
        >
          {showInvalid ? " " : description}
        </p>

        <FormGrid columns={1} gap="sm">
          <Switch
            id="cg-verbose"
            label="Verbose"
            checked={verbose}
            onChange={(event) => setVerbose(event.target.checked)}
          />
          <Switch
            id="cg-24h"
            label="Use 24 hour time format"
            checked={use24HourTimeFormat}
            onChange={(event) => setUse24HourTimeFormat(event.target.checked)}
          />
          <Switch
            id="cg-dow-zero"
            label="Days start at 0"
            checked={dayOfWeekStartIndexZero}
            onChange={(event) => setDayOfWeekStartIndexZero(event.target.checked)}
          />
        </FormGrid>
      </Panel>

      <Panel
        title="Cron format"
        titleId="cg-ref-heading"
        description="Field order and common symbols. Shortcuts like @daily are shown for reference — expand them to a five-field expression to validate here."
      >
        <CodeBlock code={CRON_FORMAT_DIAGRAM} label="Cron field diagram" copy={false} aria-label="Cron field diagram" />

        <Table caption="Cron symbols" captionHidden density="compact">
          <thead>
            <tr>
              <th scope="col">Symbol</th>
              <th scope="col">Meaning</th>
              <th scope="col">Example</th>
              <th scope="col">Equivalent</th>
            </tr>
          </thead>
          <tbody>
            {CRON_HELPERS.map((row) => (
              <tr key={row.symbol}>
                <td>
                  <code>{row.symbol}</code>
                </td>
                <td>{row.meaning}</td>
                <td>{row.example ? <code>{row.example}</code> : "—"}</td>
                <td>{row.equivalent ? <code>{row.equivalent}</code> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </ToolFrame>
  );
}
