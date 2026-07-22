import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolEmpty,
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
  UNKNOWN_VENDOR_MESSAGE,
  getVendorLines,
  isValidMacAddress,
  lookupMacVendor,
} from "@/lib/tools/mac-address-lookup";

import "./MacAddressLookup.css";

export default function MacAddressLookup() {
  const [macAddress, setMacAddress] = useState(DEFAULT_MAC_ADDRESS);
  const [actionStatus, setActionStatus] = useState("");

  const macValid = isValidMacAddress(macAddress);
  const vendor = useMemo(() => lookupMacVendor(macAddress), [macAddress]);
  const vendorLines = useMemo(() => getVendorLines(vendor), [vendor]);

  const copyVendor = useCallback(async () => {
    if (!vendor) {
      setActionStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(vendor);
      setActionStatus("Vendor info copied.");
    } catch {
      setActionStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [vendor]);

  return (
    <ToolIsland className="maclookup-tool">
      <ToolPanel labelledBy="maclookup-heading" className="maclookup-tool__panel">
        <ToolSectionHeading
          title="MAC address lookup"
          titleId="maclookup-heading"
          description={
            <ToolHint>
              Enter a MAC address to look up its IEEE OUI vendor and manufacturer
              details.
            </ToolHint>
          }
        />

        <ToolInput
          id="maclookup-mac"
          label="MAC address"
          full
          value={macAddress}
          placeholder="Type a MAC address"
          spellCheck={false}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
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
          className="maclookup-vendor"
          role="region"
          aria-label="Vendor info"
          data-testid="vendor-info"
        >
          <p className="maclookup-vendor__label">Vendor info</p>
          {vendorLines.length > 0 ? (
            <div className="maclookup-vendor__card">
              {vendorLines.map((line, index) => (
                <p key={`${index}-${line}`} className="maclookup-vendor__line">
                  {line}
                </p>
              ))}
            </div>
          ) : (
            <ToolEmpty className="maclookup-vendor__unknown">
              {UNKNOWN_VENDOR_MESSAGE}
            </ToolEmpty>
          )}
        </div>

        <ToolActionRow>
          <ToolButton
            type="button"
            onClick={() => void copyVendor()}
            disabled={!vendor}
          >
            Copy vendor info
          </ToolButton>
        </ToolActionRow>

        {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
      </ToolPanel>
    </ToolIsland>
  );
}
