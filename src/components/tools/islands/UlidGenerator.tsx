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
  ULID_FORMAT_DEFAULT,
  ULID_FORMATS,
  ULID_QUANTITY_DEFAULT,
  ULID_QUANTITY_MAX,
  ULID_QUANTITY_MIN,
  type UlidFormat,
  clampUlidQuantity,
  generateUlids,
  normalizeUlidFormat,
} from "@/lib/tools/ulid-generator";

import "./UlidGenerator.css";

const FORMAT_LABELS: Record<UlidFormat, string> = {
  raw: "Raw",
  json: "JSON",
};

export default function UlidGenerator() {
  const [quantity, setQuantity] = useState(ULID_QUANTITY_DEFAULT);
  const [format, setFormat] = useState<UlidFormat>(ULID_FORMAT_DEFAULT);
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionStatus, setActionStatus] = useState("");

  const safeQuantity = clampUlidQuantity(quantity);
  const safeFormat = normalizeUlidFormat(format);

  const ulids = useMemo(() => {
    void refreshKey;
    return generateUlids({
      quantity: safeQuantity,
      format: safeFormat,
    });
  }, [safeQuantity, safeFormat, refreshKey]);

  const refreshUlids = useCallback(() => {
    setRefreshKey((value) => value + 1);
    setActionStatus("ULIDs refreshed.");
  }, []);

  const copyUlids = useCallback(async () => {
    if (!ulids) {
      setActionStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(ulids);
      setActionStatus(safeQuantity === 1 ? "ULID copied." : "ULIDs copied.");
    } catch {
      setActionStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [ulids, safeQuantity]);

  const outputRows =
    safeFormat === "json"
      ? Math.min(14, Math.max(4, safeQuantity + 2))
      : Math.min(8, Math.max(2, safeQuantity));

  return (
    <ToolIsland className="ulid-tool">
      <ToolPanel labelledBy="ulid-settings-heading" className="ulid-tool__panel">
        <ToolSectionHeading
          title="ULID settings"
          titleId="ulid-settings-heading"
          description={
            <ToolHint>
              Choose quantity and output format, then copy or refresh the generated identifiers.
            </ToolHint>
          }
        />

        <ToolInput
          id="ulid-quantity"
          label="Quantity"
          full
          type="number"
          min={ULID_QUANTITY_MIN}
          max={ULID_QUANTITY_MAX}
          step={1}
          value={safeQuantity}
          onChange={(event) => setQuantity(clampUlidQuantity(event.target.value))}
        />

        <ToolField label="Format" full>
          <div className="ulid-segment" role="radiogroup" aria-label="Output format">
            {ULID_FORMATS.map((option) => {
              const selected = safeFormat === option;

              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`ulid-segment__btn${selected ? " is-selected" : ""}`}
                  onClick={() => setFormat(option)}
                >
                  {FORMAT_LABELS[option]}
                </button>
              );
            })}
          </div>
        </ToolField>

        <ToolTextarea
          id="ulid-output"
          label="ULIDs"
          full
          code
          readOnly
          rows={outputRows}
          value={ulids}
          placeholder="Your ULIDs"
          className="ulid-output"
          aria-live="polite"
          data-testid="ulids"
        />

        <ToolActionRow>
          <ToolButton type="button" onClick={() => void copyUlids()} disabled={!ulids}>
            Copy
          </ToolButton>
          <ToolButton type="button" variant="ghost" onClick={refreshUlids} data-testid="refresh">
            Refresh
          </ToolButton>
        </ToolActionRow>

        {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
      </ToolPanel>
    </ToolIsland>
  );
}
