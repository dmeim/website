import { useCallback, useMemo, useState } from "react";

import { useStoredState } from "@/components/tools/use-persisted-state";
import { Button, CopyButton, FormGrid, Input, Notice, Panel, Table, ToolFrame } from "@/ui/react";
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
  const [startIp, setStartIp] = useStoredState("ipv4-range-expander:startAddress", DEFAULT_START_IP);
  const [endIp, setEndIp] = useStoredState("ipv4-range-expander:endAddress", DEFAULT_END_IP);
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

  const switchAddresses = useCallback(() => {
    setStartIp(endIp);
    setEndIp(startIp);
    setActionStatus("Switched start and end addresses.");
  }, [startIp, endIp, setStartIp, setEndIp]);

  const renderValue = (testId: string, value: string, label: string) =>
    value ? (
      <span className="ipv4re-value">
        <span className="ipv4re-value__text" data-testid={testId}>
          {value}
        </span>
        <CopyButton appearance="icon" size="sm" value={value} label={`Copy ${label}`} />
      </span>
    ) : (
      <span className="ipv4re-empty" data-testid={testId}>
        –
      </span>
    );

  return (
    <ToolFrame>
      <Panel
        title="IPv4 range expander"
        titleId="ipv4re-heading"
        description="Enter a start and end IPv4 address to calculate the covering CIDR subnet and compare the original range to the expanded block."
      >
        <FormGrid columns={2}>
          <Input
            id="ipv4re-start"
            label="Start address"
            mono
            value={startIp}
            placeholder="Start IPv4 address…"
            spellCheck={false}
            clearable
            autoFocus
            onChange={(event) => {
              setStartIp(event.target.value);
              setActionStatus("");
            }}
            error={!startValid && startIp.trim() !== "" ? "Invalid start IPv4 address. Use four numbers from 0 to 255." : undefined}
          />
          <Input
            id="ipv4re-end"
            label="End address"
            mono
            value={endIp}
            placeholder="End IPv4 address…"
            spellCheck={false}
            clearable
            onChange={(event) => {
              setEndIp(event.target.value);
              setActionStatus("");
            }}
            error={!endValid && endIp.trim() !== "" ? "Invalid end IPv4 address. Use four numbers from 0 to 255." : undefined}
          />
        </FormGrid>

        {showResult ? (
          <Table caption="Expanded range" captionHidden>
            <thead>
              <tr>
                <th scope="col">
                  <span className="ui-visually-hidden">Field</span>
                </th>
                <th scope="col">Old value</th>
                <th scope="col">New value</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <th scope="row">{row.label}</th>
                  <td>{renderValue(`${row.key}.old`, row.oldValue, `${row.label} (old)`)}</td>
                  <td>{renderValue(`${row.key}.new`, row.newValue, `${row.label} (new)`)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : null}

        {showInverted ? (
          <Notice
            tone="danger"
            actions={
              <Button variant="secondary" size="sm" iconStart="arrows-left-right" onClick={switchAddresses}>
                Switch start and end
              </Button>
            }
          >
            Invalid combination of start and end IPv4 address. The end address is lower than the start address. Switch
            them to calculate a result.
          </Notice>
        ) : null}

        {actionStatus ? <Notice tone="success">{actionStatus}</Notice> : null}
      </Panel>
    </ToolFrame>
  );
}
