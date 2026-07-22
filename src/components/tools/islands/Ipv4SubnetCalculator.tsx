import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
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
  getSubnetSections,
  isValidIpv4Cidr,
  parseSubnet,
  switchBlock,
} from "@/lib/tools/ipv4-subnet-calculator";

import "./Ipv4SubnetCalculator.css";

export default function Ipv4SubnetCalculator() {
  const [ip, setIp] = useState(DEFAULT_IP);
  const [actionStatus, setActionStatus] = useState("");

  const valid = isValidIpv4Cidr(ip);
  const info = useMemo(() => (valid ? parseSubnet(ip) : undefined), [ip, valid]);
  const sections = useMemo(
    () => (info ? getSubnetSections(info) : []),
    [info],
  );

  const copyValue = useCallback(async (label: string, value: string) => {
    try {
      await copyTextToClipboard(value);
      setActionStatus(`${label} copied.`);
    } catch {
      setActionStatus("Copy failed. Select the value and copy it manually.");
    }
  }, []);

  const goBlock = useCallback(
    (count: number) => {
      const next = switchBlock(ip, count);
      if (next) {
        setIp(next);
        setActionStatus(count < 0 ? "Moved to previous block." : "Moved to next block.");
      }
    },
    [ip],
  );

  return (
    <ToolIsland className="ipv4sc-tool">
      <ToolPanel labelledBy="ipv4sc-heading" className="ipv4sc-tool__panel">
        <ToolSectionHeading
          title="IPv4 subnet"
          titleId="ipv4sc-heading"
          description={
            <ToolHint>
              Enter an IPv4 address with or without a mask to inspect the subnet,
              then step to adjacent blocks of the same size.
            </ToolHint>
          }
        />

        <ToolInput
          id="ipv4sc-ip"
          label="An IPv4 address with or without mask"
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
            We cannot parse this address, check the format
          </ToolStatus>
        ) : null}

        {info ? (
          <>
            <div className="ipv4sc-table-wrap" role="region" aria-label="Subnet details">
              <table className="ipv4sc-table">
                <tbody>
                  {sections.map((section) => {
                    const display = section.value ?? section.undefinedFallback ?? "";
                    const canCopy = Boolean(section.value);
                    return (
                      <tr key={section.key}>
                        <th scope="row" className="ipv4sc-table__label">
                          {section.label}
                        </th>
                        <td className="ipv4sc-table__value">
                          {canCopy ? (
                            <div className="ipv4sc-value-row">
                              <span className="ipv4sc-value tool-code" data-testid={section.key}>
                                {section.value}
                              </span>
                              <ToolButton
                                type="button"
                                variant="ghost"
                                onClick={() =>
                                  void copyValue(section.label, section.value!)
                                }
                              >
                                Copy
                              </ToolButton>
                            </div>
                          ) : (
                            <span
                              className="ipv4sc-fallback"
                              data-testid={section.key}
                            >
                              {display}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ToolActionRow className="ipv4sc-nav">
              <ToolButton type="button" variant="ghost" onClick={() => goBlock(-1)}>
                Previous block
              </ToolButton>
              <ToolButton type="button" onClick={() => goBlock(1)}>
                Next block
              </ToolButton>
            </ToolActionRow>
          </>
        ) : null}

        {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
      </ToolPanel>
    </ToolIsland>
  );
}
