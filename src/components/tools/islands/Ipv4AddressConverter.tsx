import { useMemo, useState } from "react";

import { Input, KeyValue, Panel, ToolFrame } from "@/ui/react";
import { DEFAULT_IP, getConversionSections, isValidIpv4 } from "@/lib/tools/ipv4-address-converter";

export default function Ipv4AddressConverter() {
  const [ip, setIp] = useState(DEFAULT_IP);

  const valid = isValidIpv4({ ip });
  const sections = useMemo(() => getConversionSections(ip), [ip]);

  return (
    <ToolFrame>
      <Panel
        title="IPv4 converter"
        titleId="ipv4ac-heading"
        description="Enter an IPv4 address to see its decimal, hexadecimal, binary, and IPv4-mapped IPv6 forms."
      >
        <Input
          id="ipv4ac-ip"
          label="The IPv4 address"
          mono
          value={ip}
          placeholder="The ipv4 address…"
          spellCheck={false}
          autoFocus
          onChange={(event) => setIp(event.target.value)}
          error={!valid ? "Invalid ipv4 address" : undefined}
        />

        <KeyValue
          aria-label="Converted values"
          items={sections.map((section) => ({
            label: section.label,
            value: <span data-testid={section.key}>{section.value || "Set a correct ipv4 address"}</span>,
            mono: Boolean(section.value),
            tone: section.value ? "default" : "muted",
            copy: section.value ? section.value : false,
          }))}
        />
      </Panel>
    </ToolFrame>
  );
}
