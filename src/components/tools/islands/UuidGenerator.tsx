import { useCallback, useMemo, useState } from "react";

import { useStoredState } from "@/components/tools/use-persisted-state";
import { Button, ButtonGroup, CopyButton, Input, OutputField, Panel, SegmentedControl, ToolFrame } from "@/ui/react";
import {
  UUID_NAMESPACE_DEFAULT,
  UUID_NAMESPACE_OPTIONS,
  UUID_QUANTITY_DEFAULT,
  UUID_QUANTITY_MAX,
  UUID_QUANTITY_MIN,
  UUID_VERSION_DEFAULT,
  UUID_VERSIONS,
  type UuidVersion,
  clampUuidQuantity,
  generateUuids,
  isUuidVersion,
  isValidUuidNamespace,
  normalizeUuidVersion,
} from "@/lib/tools/uuid-generator";

const CUSTOM_NAMESPACE = "__custom__";

export default function UuidGenerator() {
  const [version, setVersion] = useStoredState<UuidVersion>("uuid-generator:version", UUID_VERSION_DEFAULT, isUuidVersion);
  const [quantity, setQuantity] = useStoredState("uuid-generator:quantity", UUID_QUANTITY_DEFAULT);
  const [quantityDraft, setQuantityDraft] = useState<string | null>(null);
  const [namespace, setNamespace] = useState<string>(UUID_NAMESPACE_DEFAULT);
  const [name, setName] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const safeVersion = normalizeUuidVersion(version);
  const safeQuantity = clampUuidQuantity(quantity);
  const needsNameArgs = safeVersion === "v3" || safeVersion === "v5";
  const namespaceValid = !needsNameArgs || isValidUuidNamespace(namespace);
  const presetMatch = UUID_NAMESPACE_OPTIONS.find((option) => option.value === namespace);

  const uuids = useMemo(() => {
    void refreshKey;
    return generateUuids({
      version: safeVersion,
      quantity: safeQuantity,
      namespace,
      name,
    });
  }, [safeVersion, safeQuantity, namespace, name, refreshKey]);

  const refreshUuids = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  return (
    <ToolFrame>
      <Panel
        title="UUID settings"
        titleId="ug-settings-heading"
        description="Pick a UUID version and quantity, then copy or refresh the generated identifiers."
      >
        <SegmentedControl
          name="ug-version"
          label="UUID version"
          options={UUID_VERSIONS.map((option) => ({ value: option, label: option }))}
          value={safeVersion}
          onChange={(value) => setVersion(value as UuidVersion)}
        />

        <Input
          id="ug-quantity"
          label="Quantity"
          type="number"
          min={UUID_QUANTITY_MIN}
          max={UUID_QUANTITY_MAX}
          step={1}
          value={quantityDraft ?? safeQuantity}
          onChange={(event) => {
            setQuantityDraft(event.target.value);
            setQuantity(clampUuidQuantity(event.target.value));
          }}
          onBlur={() => setQuantityDraft(null)}
        />

        {needsNameArgs ? (
          <>
            <SegmentedControl
              name="ug-namespace-preset"
              label="Namespace"
              options={UUID_NAMESPACE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
              value={presetMatch ? presetMatch.value : CUSTOM_NAMESPACE}
              onChange={(value) => setNamespace(value)}
            />

            <Input
              id="ug-namespace"
              label="Custom namespace"
              mono
              value={namespace}
              placeholder="Namespace UUID"
              spellCheck={false}
              autoComplete="off"
              error={namespaceValid ? undefined : "Enter a valid namespace UUID, like 6ba7b811-9dad-11d1-80b4-00c04fd430c8."}
              onChange={(event) => setNamespace(event.target.value)}
            />

            <Input
              id="ug-name"
              label="Name"
              value={name}
              placeholder="Name"
              spellCheck={false}
              autoComplete="off"
              onChange={(event) => setName(event.target.value)}
            />
          </>
        ) : null}

        <OutputField
          id="ug-output"
          label="UUIDs"
          multiline
          copy={false}
          rows={Math.min(8, Math.max(2, safeQuantity))}
          value={uuids}
          placeholder="Your UUIDs"
        />

        <ButtonGroup>
          <CopyButton value={uuids} disabled={!uuids} variant="primary" />
          <Button variant="ghost" iconStart="arrows-clockwise" onClick={refreshUuids}>
            Refresh
          </Button>
        </ButtonGroup>
      </Panel>
    </ToolFrame>
  );
}
