import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolCheck,
  ToolFormGrid,
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
  ToolWorkspace,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
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
  const [actionStatus, setActionStatus] = useState("");

  const options = useMemo(
    () => ({ verbose, use24HourTimeFormat, dayOfWeekStartIndexZero }),
    [verbose, use24HourTimeFormat, dayOfWeekStartIndexZero],
  );

  const description = useMemo(
    () => describeCron(expression, options),
    [expression, options],
  );

  const invalidMessage = useMemo(
    () => cronValidationMessage(expression),
    [expression],
  );

  const showInvalid = invalidMessage !== null || description === null;

  const copyExpression = useCallback(async () => {
    try {
      await copyTextToClipboard(expression);
      setActionStatus("Cron expression copied to the clipboard.");
    } catch {
      setActionStatus("Copy failed. Select the expression and copy it manually.");
    }
  }, [expression]);

  return (
    <ToolIsland className="cg-tool">
      <ToolWorkspace className="cg-tool__workspace" stagger>
        <ToolPanel labelledBy="cg-heading" className="cg-tool__panel">
          <ToolSectionHeading
            title="Cron expression"
            titleId="cg-heading"
            description={
              <ToolHint>
                Enter a cron schedule to validate it and read the plain-English description.
              </ToolHint>
            }
          />

          <ToolInput
            id="cg-expression"
            label="Expression"
            full
            value={expression}
            placeholder="* * * * *"
            autoComplete="off"
            spellCheck={false}
            className="cg-expression"
            aria-invalid={showInvalid}
            aria-describedby="cg-description"
            onChange={(event) => setExpression(event.target.value)}
          />

          <p
            id="cg-description"
            className="cg-description"
            aria-live="polite"
            data-testid="cron-description"
          >
            {showInvalid ? "\u00a0" : description}
          </p>

          {showInvalid ? (
            <ToolStatus tone="error" live="polite">
              {invalidMessage ?? "This cron is invalid"}
            </ToolStatus>
          ) : null}

          <ToolFormGrid className="cg-toggles">
            <ToolCheck
              id="cg-verbose"
              label="Verbose"
              toggle
              checked={verbose}
              onChange={(event) => setVerbose(event.target.checked)}
            />
            <ToolCheck
              id="cg-24h"
              label="Use 24 hour time format"
              toggle
              checked={use24HourTimeFormat}
              onChange={(event) => setUse24HourTimeFormat(event.target.checked)}
            />
            <ToolCheck
              id="cg-dow-zero"
              label="Days start at 0"
              toggle
              checked={dayOfWeekStartIndexZero}
              onChange={(event) => setDayOfWeekStartIndexZero(event.target.checked)}
            />
          </ToolFormGrid>

          <ToolActionRow>
            <ToolButton type="button" onClick={() => void copyExpression()}>
              Copy
            </ToolButton>
          </ToolActionRow>

          {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
        </ToolPanel>

        <ToolPanel labelledBy="cg-ref-heading" className="cg-tool__ref">
          <ToolSectionHeading
            title="Cron format"
            titleId="cg-ref-heading"
            description={
              <ToolHint>
                Field order and common symbols. Shortcuts like @daily are shown for reference —
                expand them to a five-field expression to validate here.
              </ToolHint>
            }
          />

          <pre className="cg-diagram" aria-label="Cron field diagram">
            {CRON_FORMAT_DIAGRAM}
          </pre>

          <div className="cg-table-wrap">
            <table className="cg-table">
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
                    <td>
                      {row.example ? <code>{row.example}</code> : "—"}
                    </td>
                    <td>
                      {row.equivalent ? <code>{row.equivalent}</code> : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="cg-helper-cards">
            {CRON_HELPERS.map((row) => (
              <li key={`card-${row.symbol}`} className="cg-helper-card">
                <div>
                  Symbol: <strong>{row.symbol}</strong>
                </div>
                <div>
                  Meaning: <strong>{row.meaning}</strong>
                </div>
                <div>
                  Example:{" "}
                  <strong>
                    {row.example ? <code>{row.example}</code> : "—"}
                  </strong>
                </div>
                <div>
                  Equivalent:{" "}
                  <strong>
                    {row.equivalent ? <code>{row.equivalent}</code> : "—"}
                  </strong>
                </div>
              </li>
            ))}
          </ul>
        </ToolPanel>
      </ToolWorkspace>
    </ToolIsland>
  );
}
