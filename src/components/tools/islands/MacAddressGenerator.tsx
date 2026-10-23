import { useCallback, useMemo, useState } from "react";

import { Button, ButtonGroup, CopyButton, Input, Notice, OutputField, Panel, SegmentedControl, ToolFrame } from "@/ui/react";
import {
  DEFAULT_MAC_CASE,
  DEFAULT_MAC_PREFIX,
  DEFAULT_MAC_SEPARATOR,
  MAC_CASES,
  MAC_QUANTITY_DEFAULT,
  MAC_QUANTITY_MAX,
  MAC_QUANTITY_MIN,
  MAC_SEPARATORS,
  type MacCase,
  type MacSeparator,
  clampMacQuantity,
  generateMacAddresses,
  isValidPartialMacAddress,
  normalizeMacCase,
  normalizeMacSeparator,
} from "@/lib/tools/mac-address-generator";

const CASE_LABELS: Record<MacCase, string> = {
  upper: "Uppercase",
  lower: "Lowercase",
};

const SEPARATOR_LABELS: Record<MacSeparator, string> = {
  ":": ":",
  "-": "-",
  ".": ".",
  "": "None",
};

export default function MacAddressGenerator() {
  const [quantity, setQuantity] = useState(MAC_QUANTITY_DEFAULT);
  const [prefix, setPrefix] = useState(DEFAULT_MAC_PREFIX);
  const [caseStyle, setCaseStyle] = useState<MacCase>(DEFAULT_MAC_CASE);
  const [separator, setSeparator] = useState<MacSeparator>(DEFAULT_MAC_SEPARATOR);
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionStatus, setActionStatus] = useState("");

  const safeQuantity = clampMacQuantity(quantity);
  const safeCase = normalizeMacCase(caseStyle);
  const safeSeparator = normalizeMacSeparator(separator);
  const prefixValid = isValidPartialMacAddress(prefix);

  const macAddresses = useMemo(() => {
    void refreshKey;
    return generateMacAddresses({
      quantity: safeQuantity,
      prefix,
      separator: safeSeparator,
      caseStyle: safeCase,
    });
  }, [safeQuantity, prefix, safeSeparator, safeCase, refreshKey]);

  const refreshAddresses = useCallback(() => {
    setRefreshKey((value) => value + 1);
    setActionStatus("MAC addresses refreshed.");
  }, []);

  const outputRows = Math.min(8, Math.max(2, safeQuantity));

  return (
    <ToolFrame>
      <Panel
        title="MAC address generator"
        titleId="macgen-heading"
        description="Set quantity and an optional prefix, then choose case and separator. Refresh to regenerate; copy to put the list on the clipboard."
      >
        <Input
          id="macgen-quantity"
          label="Quantity"
          type="number"
          min={MAC_QUANTITY_MIN}
          max={MAC_QUANTITY_MAX}
          step={1}
          value={safeQuantity}
          onChange={(event) => {
            setQuantity(clampMacQuantity(event.target.value));
            setActionStatus("");
          }}
        />

        <Input
          id="macgen-prefix"
          label="MAC address prefix"
          mono
          value={prefix}
          placeholder="Set a prefix, e.g. 64:16:7F"
          spellCheck={false}
          onChange={(event) => {
            setPrefix(event.target.value);
            setActionStatus("");
          }}
          error={!prefixValid ? "Invalid partial MAC address" : undefined}
        />

        <SegmentedControl
          name="macgen-case"
          label="Case"
          options={MAC_CASES.map((option) => ({ value: option, label: CASE_LABELS[option] }))}
          value={safeCase}
          onChange={(value) => {
            setCaseStyle(value as MacCase);
            setActionStatus("");
          }}
        />

        <SegmentedControl
          name="macgen-separator"
          label="Separator"
          options={MAC_SEPARATORS.map((option) => ({ value: option, label: SEPARATOR_LABELS[option] }))}
          value={safeSeparator}
          onChange={(value) => {
            setSeparator(value as MacSeparator);
            setActionStatus("");
          }}
        />

        <OutputField
          id="macgen-output"
          label="MAC addresses"
          multiline
          copy={false}
          rows={outputRows}
          value={macAddresses}
          placeholder="Your MAC addresses"
        />

        <ButtonGroup>
          <CopyButton value={macAddresses} disabled={!macAddresses} variant="primary" />
          <Button
            variant="ghost"
            iconStart="arrows-clockwise"
            onClick={refreshAddresses}
            disabled={!prefixValid}
            data-testid="refresh"
          >
            Refresh
          </Button>
        </ButtonGroup>

        {actionStatus ? <Notice tone="success">{actionStatus}</Notice> : null}
      </Panel>
    </ToolFrame>
  );
}
