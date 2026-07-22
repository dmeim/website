import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolField,
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
  ToolTextarea,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
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

import "./MacAddressGenerator.css";

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

  const copyAddresses = useCallback(async () => {
    if (!macAddresses) {
      setActionStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(macAddresses);
      setActionStatus(
        safeQuantity === 1 ? "MAC address copied." : "MAC addresses copied.",
      );
    } catch {
      setActionStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [macAddresses, safeQuantity]);

  const outputRows = Math.min(8, Math.max(2, safeQuantity));

  return (
    <ToolIsland className="macgen-tool">
      <ToolPanel labelledBy="macgen-heading" className="macgen-tool__panel">
        <ToolSectionHeading
          title="MAC address generator"
          titleId="macgen-heading"
          description={
            <ToolHint>
              Set quantity and an optional prefix, then choose case and separator.
              Refresh to regenerate; copy to put the list on the clipboard.
            </ToolHint>
          }
        />

        <ToolInput
          id="macgen-quantity"
          label="Quantity"
          full
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

        <ToolInput
          id="macgen-prefix"
          label="MAC address prefix"
          full
          value={prefix}
          placeholder="Set a prefix, e.g. 64:16:7F"
          spellCheck={false}
          onChange={(event) => {
            setPrefix(event.target.value);
            setActionStatus("");
          }}
          aria-invalid={!prefixValid || undefined}
        />

        {!prefixValid ? (
          <ToolStatus tone="error" live="polite">
            Invalid partial MAC address
          </ToolStatus>
        ) : null}

        <ToolField label="Case" full>
          <div className="macgen-segment" role="radiogroup" aria-label="Case">
            {MAC_CASES.map((option) => {
              const selected = safeCase === option;

              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`macgen-segment__btn${selected ? " is-selected" : ""}`}
                  onClick={() => {
                    setCaseStyle(option);
                    setActionStatus("");
                  }}
                >
                  {CASE_LABELS[option]}
                </button>
              );
            })}
          </div>
        </ToolField>

        <ToolField label="Separator" full>
          <div
            className="macgen-segment"
            role="radiogroup"
            aria-label="Separator"
          >
            {MAC_SEPARATORS.map((option) => {
              const selected = safeSeparator === option;
              const key = option === "" ? "none" : option;

              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`macgen-segment__btn${selected ? " is-selected" : ""}`}
                  onClick={() => {
                    setSeparator(option);
                    setActionStatus("");
                  }}
                >
                  {SEPARATOR_LABELS[option]}
                </button>
              );
            })}
          </div>
        </ToolField>

        <ToolTextarea
          id="macgen-output"
          label="MAC addresses"
          full
          code
          readOnly
          rows={outputRows}
          value={macAddresses}
          placeholder="Your MAC addresses"
          className="macgen-output"
          aria-live="polite"
          data-testid="mac-addresses"
        />

        <ToolActionRow>
          <ToolButton
            type="button"
            onClick={() => void copyAddresses()}
            disabled={!macAddresses}
          >
            Copy
          </ToolButton>
          <ToolButton
            type="button"
            variant="ghost"
            onClick={refreshAddresses}
            disabled={!prefixValid}
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
