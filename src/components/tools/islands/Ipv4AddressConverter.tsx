import { useCallback, useMemo, useState } from "react";

import {
  ToolButton,
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import {
  DEFAULT_IP,
  getConversionSections,
  isValidIpv4,
} from "@/lib/tools/ipv4-address-converter";

import "./Ipv4AddressConverter.css";

export default function Ipv4AddressConverter() {
  const [ip, setIp] = useState(DEFAULT_IP);
  const [actionStatus, setActionStatus] = useState("");

  const valid = isValidIpv4({ ip });
  const sections = useMemo(() => getConversionSections(ip), [ip]);

  const copyValue = useCallback(async (label: string, value: string) => {
    try {
      await copyTextToClipboard(value);
      setActionStatus(`${label} copied.`);
    } catch {
      setActionStatus("Copy failed. Select the value and copy it manually.");
    }
  }, []);

  return (
    <ToolIsland className="ipv4ac-tool">
      <ToolPanel labelledBy="ipv4ac-heading" className="ipv4ac-tool__panel">
        <ToolSectionHeading
          title="IPv4 converter"
          titleId="ipv4ac-heading"
          description={
            <ToolHint>
              Enter an IPv4 address to see its decimal, hexadecimal, binary, and
              IPv4-mapped IPv6 forms.
            </ToolHint>
          }
        />

        <ToolInput
          id="ipv4ac-ip"
          label="The IPv4 address"
          full
          value={ip}
          placeholder="The ipv4 address…"
          spellCheck={false}
          autoFocus
          onChange={(event) => {
            setIp(event.target.value);
            setActionStatus("");
          }}
          aria-invalid={!valid || undefined}
        />

        {!valid ? (
          <ToolStatus tone="error" live="polite">
            Invalid ipv4 address
          </ToolStatus>
        ) : null}

        <div className="ipv4ac-table-wrap" role="region" aria-label="Converted values">
          <table className="ipv4ac-table">
            <tbody>
              {sections.map((section) => {
                const canCopy = Boolean(section.value);
                return (
                  <tr key={section.key}>
                    <th scope="row" className="ipv4ac-table__label">
                      {section.label}
                    </th>
                    <td className="ipv4ac-table__value">
                      {canCopy ? (
                        <div className="ipv4ac-value-row">
                          <span
                            className="ipv4ac-value tool-code"
                            data-testid={section.key}
                          >
                            {section.value}
                          </span>
                          <ToolButton
                            type="button"
                            variant="ghost"
                            onClick={() =>
                              void copyValue(section.label, section.value)
                            }
                          >
                            Copy
                          </ToolButton>
                        </div>
                      ) : (
                        <span
                          className="ipv4ac-fallback"
                          data-testid={section.key}
                        >
                          Set a correct ipv4 address
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
      </ToolPanel>
    </ToolIsland>
  );
}
