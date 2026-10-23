import { useMemo, useState } from "react";

import { Card, CopyButton, EmptyState, Input, Panel, ToolFrame } from "@/ui/react";
import {
  DEFAULT_MAC_ADDRESS,
  UNKNOWN_VENDOR_MESSAGE,
  getVendorLines,
  isValidMacAddress,
  lookupMacVendor,
} from "@/lib/tools/mac-address-lookup";

import "./MacAddressLookup.css";

export default function MacAddressLookup() {
  const [macAddress, setMacAddress] = useState(DEFAULT_MAC_ADDRESS);

  const macValid = isValidMacAddress(macAddress);
  const vendor = useMemo(() => lookupMacVendor(macAddress), [macAddress]);
  const vendorLines = useMemo(() => getVendorLines(vendor), [vendor]);

  return (
    <ToolFrame>
      <Panel
        title="MAC address lookup"
        titleId="maclookup-heading"
        description="Enter a MAC address to look up its IEEE OUI vendor and manufacturer details."
        actions={<CopyButton value={vendor ?? ""} disabled={!vendor} label="Copy vendor info" size="sm" />}
      >
        <Input
          id="maclookup-mac"
          label="MAC address"
          mono
          value={macAddress}
          placeholder="Type a MAC address"
          spellCheck={false}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          onChange={(event) => setMacAddress(event.target.value)}
          error={!macValid ? "Invalid MAC address" : undefined}
        />

        <div className="maclookup-vendor" role="region" aria-label="Vendor info" data-testid="vendor-info">
          {vendorLines.length > 0 ? (
            <Card tone="inset" eyebrow="Vendor info">
              {vendorLines.map((line, index) => (
                <p key={`${index}-${line}`} className="maclookup-vendor__line">
                  {line}
                </p>
              ))}
            </Card>
          ) : (
            <EmptyState size="sm" icon="question" title="Vendor info" description={UNKNOWN_VENDOR_MESSAGE} />
          )}
        </div>
      </Panel>
    </ToolFrame>
  );
}
