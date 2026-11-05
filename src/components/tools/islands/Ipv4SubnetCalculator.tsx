import { useCallback, useMemo, useState } from "react";

import { useStoredState } from "@/components/tools/use-persisted-state";
import { Button, ButtonGroup, Input, KeyValue, Notice, Panel, ToolFrame } from "@/ui/react";
import {
  DEFAULT_IP,
  getSubnetSections,
  isValidIpv4Cidr,
  parseSubnet,
  switchBlock,
} from "@/lib/tools/ipv4-subnet-calculator";

export default function Ipv4SubnetCalculator() {
  const [ip, setIp] = useStoredState("ipv4-subnet-calculator:ip", DEFAULT_IP);
  const [actionStatus, setActionStatus] = useState("");

  const valid = isValidIpv4Cidr(ip);
  const previousBlock = useMemo(() => switchBlock(ip, -1), [ip]);
  const nextBlock = useMemo(() => switchBlock(ip, 1), [ip]);
  const info = useMemo(() => (valid ? parseSubnet(ip) : undefined), [ip, valid]);
  const sections = useMemo(() => (info ? getSubnetSections(info) : []), [info]);

  const goBlock = useCallback(
    (count: number) => {
      const next = switchBlock(ip, count);
      if (next) {
        setIp(next);
        setActionStatus(count < 0 ? "Moved to previous block." : "Moved to next block.");
      }
    },
    [ip, setIp],
  );

  return (
    <ToolFrame>
      <Panel
        title="IPv4 subnet"
        titleId="ipv4sc-heading"
        description="Enter an IPv4 address with or without a mask to inspect the subnet, then step to adjacent blocks of the same size."
      >
        <Input
          id="ipv4sc-ip"
          label="An IPv4 address with or without mask"
          mono
          value={ip}
          placeholder="The IPv4 address…"
          spellCheck={false}
          autoFocus
          onChange={(event) => {
            setIp(event.target.value);
            setActionStatus("");
          }}
          error={!valid && ip.trim() !== "" ? "We cannot parse this address. Try a format like 192.168.0.1/24 or 192.168.0.1/255.255.255.0." : undefined}
        />

        {info ? (
          <>
            <KeyValue
              aria-label="Subnet details"
              items={sections.map((section) => ({
                label: section.label,
                value: (
                  <span data-testid={section.key}>{section.value ?? section.undefinedFallback ?? ""}</span>
                ),
                mono: Boolean(section.value),
                tone: section.value ? "default" : "muted",
                copy: section.value ? section.value : false,
              }))}
            />

            <ButtonGroup>
              <Button variant="ghost" iconStart="caret-left" disabled={!previousBlock} onClick={() => goBlock(-1)}>
                Previous block
              </Button>
              <Button variant="secondary" iconEnd="caret-right" disabled={!nextBlock} onClick={() => goBlock(1)}>
                Next block
              </Button>
            </ButtonGroup>
          </>
        ) : null}

        {actionStatus ? <Notice tone="success">{actionStatus}</Notice> : null}
      </Panel>
    </ToolFrame>
  );
}
