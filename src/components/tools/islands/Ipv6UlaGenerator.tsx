import { useCallback, useEffect, useState } from "react";

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
  DEFAULT_MAC_ADDRESS,
  emptyUlaSections,
  generateIpv6Ula,
  isValidMacAddress,
  type Ipv6UlaSection,
} from "@/lib/tools/ipv6-ula-generator";

import "./Ipv6UlaGenerator.css";

export default function Ipv6UlaGenerator() {
  const [macAddress, setMacAddress] = useState(DEFAULT_MAC_ADDRESS);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sections, setSections] = useState<Ipv6UlaSection[]>(emptyUlaSections);
  const [actionStatus, setActionStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const macValid = isValidMacAddress(macAddress);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!isValidMacAddress(macAddress)) {
        if (!cancelled) {
          setSections(emptyUlaSections());
          setBusy(false);
        }
        return;
      }

      setBusy(true);
      try {
        const result = await generateIpv6Ula({ macAddress });
        if (!cancelled) {
          setSections(result?.sections ?? emptyUlaSections());
        }
      } catch {
        if (!cancelled) {
          setSections(emptyUlaSections());
          setActionStatus("Generation failed. Try again.");
        }
      } finally {
        if (!cancelled) {
          setBusy(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [macAddress, refreshKey]);

  const refresh = useCallback(() => {
    setRefreshKey((value) => value + 1);
    setActionStatus("ULA regenerated.");
  }, []);

  const copyValue = useCallback(async (label: string, value: string) => {
    try {
      await copyTextToClipboard(value);
      setActionStatus(`${label} copied.`);
    } catch {
      setActionStatus("Copy failed. Select the value and copy it manually.");
    }
  }, []);

  return (
    <ToolIsland className="ipv6ula-tool">
      <ToolPanel labelledBy="ipv6ula-heading" className="ipv6ula-tool__panel">
        <ToolSectionHeading
          title="IPv6 ULA generator"
          titleId="ipv6ula-heading"
          description={
            <ToolHint>
              Uses the IETF-suggested method: current timestamp plus MAC address,
              SHA-1 hashed, lower 40 bits → a random Unique Local Address prefix
              (RFC 4193).
            </ToolHint>
          }
        />

        <ToolInput
          id="ipv6ula-mac"
          label="MAC address"
          full
          value={macAddress}
          placeholder="Type a MAC address"
          spellCheck={false}
          autoFocus
          onChange={(event) => {
            setMacAddress(event.target.value);
            setActionStatus("");
          }}
          aria-invalid={!macValid || undefined}
        />

        {!macValid ? (
          <ToolStatus tone="error" live="polite">
            Invalid MAC address
          </ToolStatus>
        ) : null}

        <div
          className="ipv6ula-table-wrap"
          role="region"
          aria-label="Generated ULA values"
          aria-busy={busy || undefined}
        >
          <table className="ipv6ula-table">
            <tbody>
              {sections.map((section) => {
                const canCopy = Boolean(section.value);
                return (
                  <tr key={section.key}>
                    <th scope="row" className="ipv6ula-table__label">
                      {section.label}
                    </th>
                    <td className="ipv6ula-table__value">
                      {canCopy ? (
                        <div className="ipv6ula-value-row">
                          <span
                            className="ipv6ula-value tool-code"
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
                          className="ipv6ula-fallback"
                          data-testid={section.key}
                        >
                          Enter a valid MAC address
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <ToolActionRow>
          <ToolButton
            type="button"
            variant="ghost"
            onClick={refresh}
            disabled={!macValid || busy}
            data-testid="refresh"
          >
            Refresh
          </ToolButton>
        </ToolActionRow>

        {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
      </ToolPanel>
    </ToolIsland>
  );
}
