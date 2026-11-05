import { useCallback, useMemo, useState } from "react";

import { useStoredState } from "@/components/tools/use-persisted-state";
import { Button, ButtonGroup, CopyButton, Input, OutputField, Panel, SegmentedControl, ToolFrame } from "@/ui/react";
import {
  ULID_FORMAT_DEFAULT,
  ULID_FORMATS,
  ULID_QUANTITY_DEFAULT,
  ULID_QUANTITY_MAX,
  ULID_QUANTITY_MIN,
  type UlidFormat,
  clampUlidQuantity,
  generateUlids,
  isUlidFormat,
  normalizeUlidFormat,
} from "@/lib/tools/ulid-generator";

const FORMAT_LABELS: Record<UlidFormat, string> = {
  raw: "Raw",
  json: "JSON",
};

export default function UlidGenerator() {
  const [quantity, setQuantity] = useStoredState("ulid-generator-amount", ULID_QUANTITY_DEFAULT);
  const [quantityDraft, setQuantityDraft] = useState<string | null>(null);
  const [format, setFormat] = useStoredState<UlidFormat>("ulid-generator-format", ULID_FORMAT_DEFAULT, isUlidFormat);
  const [refreshKey, setRefreshKey] = useState(0);

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
  }, []);

  const outputRows =
    safeFormat === "json"
      ? Math.min(14, Math.max(4, safeQuantity + 2))
      : Math.min(8, Math.max(2, safeQuantity));

  return (
    <ToolFrame>
      <Panel
        title="ULID settings"
        titleId="ulid-settings-heading"
        description="Choose quantity and output format, then copy or refresh the generated identifiers."
      >
        <Input
          id="ulid-quantity"
          label="Quantity"
          type="number"
          min={ULID_QUANTITY_MIN}
          max={ULID_QUANTITY_MAX}
          step={1}
          value={quantityDraft ?? safeQuantity}
          onChange={(event) => {
            setQuantityDraft(event.target.value);
            setQuantity(clampUlidQuantity(event.target.value));
          }}
          onBlur={() => setQuantityDraft(null)}
        />

        <SegmentedControl
          name="ulid-format"
          label="Format"
          options={ULID_FORMATS.map((option) => ({ value: option, label: FORMAT_LABELS[option] }))}
          value={safeFormat}
          onChange={(value) => setFormat(value as UlidFormat)}
        />

        <OutputField id="ulid-output" label="ULIDs" multiline copy={false} rows={outputRows} value={ulids} placeholder="Your ULIDs" />

        <ButtonGroup>
          <CopyButton value={ulids} disabled={!ulids} variant="primary" />
          <Button variant="ghost" iconStart="arrows-clockwise" onClick={refreshUlids} data-testid="refresh">
            Refresh
          </Button>
        </ButtonGroup>
      </Panel>
    </ToolFrame>
  );
}
