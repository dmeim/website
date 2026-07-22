import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolFormGrid,
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import {
  DEFAULT_END_IP,
  DEFAULT_START_IP,
  areInputsValid,
  calculateCidr,
  getResultRows,
  isValidIpv4,
} from "@/lib/tools/ipv4-range-expander";

import "./Ipv4RangeExpander.css";

export default function Ipv4RangeExpander() {
  const [startIp, setStartIp] = useState(DEFAULT_START_IP);
  const [endIp, setEndIp] = useState(DEFAULT_END_IP);
  const [actionStatus, setActionStatus] = useState("");

  const startValid = isValidIpv4({ ip: startIp });
  const endValid = isValidIpv4({ ip: endIp });
  const inputsValid = areInputsValid(startIp, endIp);

  const result = useMemo(
    () =>
      inputsValid ? calculateCidr({ startIp, endIp }) : undefined,
    [startIp, endIp, inputsValid],
  );

  const rows = useMemo(
    () => getResultRows(startIp, endIp, result),
    [startIp, endIp, result],
  );

  const showResult = inputsValid && result !== undefined;
  const showInverted =
    inputsValid && result === undefined;

  const copyValue = useCallback(async (label: string, value: string) => {
    if (!value) return;
    try {
      await copyTextToClipboard(value);
      setActionStatus(`${label} copied.`);
    } catch {
      setActionStatus("Copy failed. Select the value and copy it manually.");
    }
  }, []);

  const switchAddresses = useCallback(() => {
    setStartIp(endIp);
    setEndIp(startIp);
    setActionStatus("Switched start and end addresses.");
  }, [startIp, endIp]);

  return (
    <ToolIsland className="ipv4re-tool">
      <ToolPanel labelledBy="ipv4re-heading" className="ipv4re-tool__panel">
        <ToolSectionHeading
          title="IPv4 range expander"
          titleId="ipv4re-heading"
          description={
            <ToolHint>
              Enter a start and end IPv4 address to calculate the covering CIDR
              subnet and compare the original range to the expanded block.
            </ToolHint>
          }
        />

        <ToolFormGrid className="ipv4re-inputs">
          <ToolInput
            id="ipv4re-start"
            label="Start address"
            full
            value={startIp}
            placeholder="Start IPv4 address…"
            spellCheck={false}
            autoFocus
            onChange={(event) => {
              setStartIp(event.target.value);
              setActionStatus("");
            }}
            aria-invalid={!startValid || undefined}
          />
          <ToolInput
            id="ipv4re-end"
            label="End address"
            full
            value={endIp}
            placeholder="End IPv4 address…"
            spellCheck={false}
            onChange={(event) => {
              setEndIp(event.target.value);
              setActionStatus("");
            }}
            aria-invalid={!endValid || undefined}
          />
        </ToolFormGrid>

        {!startValid ? (
          <ToolStatus tone="error" live="polite">
            Invalid start ipv4 address
          </ToolStatus>
        ) : null}
        {!endValid ? (
          <ToolStatus tone="error" live="polite">
            Invalid end ipv4 address
          </ToolStatus>
        ) : null}

        {showResult ? (
          <div
            className="ipv4re-table-wrap"
            role="region"
            aria-label="Expanded range"
          >
            <table className="ipv4re-table">
              <thead>
                <tr>
                  <th scope="col" className="ipv4re-table__label-col">
                    <span className="visually-hidden">Field</span>
                  </th>
                  <th scope="col">Old value</th>
                  <th scope="col">New value</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key}>
                    <th scope="row" className="ipv4re-table__label">
                      {row.label}
                    </th>
                    <td className="ipv4re-table__value">
                      {row.oldValue ? (
                        <div className="ipv4re-value-row">
                          <span
                            className="ipv4re-value tool-code"
                            data-testid={`${row.key}.old`}
                          >
                            {row.oldValue}
                          </span>
                          <ToolButton
                            type="button"
                            variant="ghost"
                            onClick={() =>
                              void copyValue(`${row.label} (old)`, row.oldValue)
                            }
                          >
                            Copy
                          </ToolButton>
                        </div>
                      ) : (
                        <span
                          className="ipv4re-empty"
                          data-testid={`${row.key}.old`}
                        >
                          —
                        </span>
                      )}
                    </td>
                    <td className="ipv4re-table__value">
                      {row.newValue ? (
                        <div className="ipv4re-value-row">
                          <span
                            className="ipv4re-value tool-code"
                            data-testid={`${row.key}.new`}
                          >
                            {row.newValue}
                          </span>
                          <ToolButton
                            type="button"
                            variant="ghost"
                            onClick={() =>
                              void copyValue(`${row.label} (new)`, row.newValue)
                            }
                          >
                            Copy
                          </ToolButton>
                        </div>
                      ) : (
                        <span
                          className="ipv4re-empty"
                          data-testid={`${row.key}.new`}
                        >
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {showInverted ? (
          <div className="ipv4re-inverted">
            <ToolStatus tone="error" live="polite">
              Invalid combination of start and end IPv4 address. The end address
              is lower than the start address — switch them to calculate a
              result.
            </ToolStatus>
            <ToolActionRow>
              <ToolButton type="button" onClick={switchAddresses}>
                Switch start and end
              </ToolButton>
            </ToolActionRow>
          </div>
        ) : null}

        {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
      </ToolPanel>
    </ToolIsland>
  );
}
