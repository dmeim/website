import { useCallback, useEffect, useState } from "react";

import { Button, Input, KeyValue, Notice, Panel, ToolFrame } from "@/ui/react";
import {
  DEFAULT_MAC_ADDRESS,
  emptyUlaSections,
  generateIpv6Ula,
  isValidMacAddress,
  type Ipv6UlaSection,
} from "@/lib/tools/ipv6-ula-generator";

export default function Ipv6UlaGenerator() {
  const [macAddress, setMacAddress] = useState(DEFAULT_MAC_ADDRESS);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sections, setSections] = useState<Ipv6UlaSection[]>(emptyUlaSections);
  const [actionStatus, setActionStatus] = useState("");
  const [generationFailed, setGenerationFailed] = useState(false);
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
          setGenerationFailed(false);
        }
      } catch {
        if (!cancelled) {
          setSections(emptyUlaSections());
          setGenerationFailed(true);
          setActionStatus("");
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

  return (
    <ToolFrame>
      <Panel
        title="IPv6 ULA generator"
        titleId="ipv6ula-heading"
        description="Uses the IETF-suggested method: current timestamp plus MAC address, SHA-1 hashed, lower 40 bits give a random Unique Local Address prefix (RFC 4193)."
        actions={
          <Button
            variant="ghost"
            size="sm"
            iconStart="arrows-clockwise"
            onClick={refresh}
            disabled={!macValid || busy}
            data-testid="refresh"
          >
            Refresh
          </Button>
        }
      >
        <Input
          id="ipv6ula-mac"
          label="MAC address"
          mono
          value={macAddress}
          placeholder="Type a MAC address"
          spellCheck={false}
          clearable
          autoFocus
          onChange={(event) => {
            setMacAddress(event.target.value);
            setActionStatus("");
          }}
          error={!macValid && macAddress.trim() !== "" ? "Invalid MAC address. Use a format like 20:37:06:12:34:56." : undefined}
        />

        <KeyValue
          aria-label="Generated ULA values"
          aria-busy={busy || undefined}
          items={sections.map((section) => ({
            label: section.label,
            value: <span data-testid={section.key}>{section.value || "Enter a valid MAC address"}</span>,
            mono: Boolean(section.value),
            tone: section.value ? "default" : "muted",
            copy: section.value ? section.value : false,
          }))}
        />

        {actionStatus ? <Notice tone="success">{actionStatus}</Notice> : null}
        {generationFailed ? <Notice tone="danger">We could not generate a ULA. Try again.</Notice> : null}
      </Panel>
    </ToolFrame>
  );
}
