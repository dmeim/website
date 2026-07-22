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
  isValidUuidNamespace,
  normalizeUuidVersion,
} from "@/lib/tools/uuid-generator";

import "./UuidGenerator.css";

export default function UuidGenerator() {
  const [version, setVersion] = useState<UuidVersion>(UUID_VERSION_DEFAULT);
  const [quantity, setQuantity] = useState(UUID_QUANTITY_DEFAULT);
  const [namespace, setNamespace] = useState(UUID_NAMESPACE_DEFAULT);
  const [name, setName] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionStatus, setActionStatus] = useState("");

  const safeVersion = normalizeUuidVersion(version);
  const safeQuantity = clampUuidQuantity(quantity);
  const needsNameArgs = safeVersion === "v3" || safeVersion === "v5";
  const namespaceValid = !needsNameArgs || isValidUuidNamespace(namespace);

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
    setActionStatus("UUIDs refreshed.");
  }, []);

  const copyUuids = useCallback(async () => {
    if (!uuids) {
      setActionStatus(
        needsNameArgs && !namespaceValid
          ? "Enter a valid namespace UUID before copying."
          : "Nothing to copy yet.",
      );
      return;
    }

    try {
      await copyTextToClipboard(uuids);
      setActionStatus(safeQuantity === 1 ? "UUID copied." : "UUIDs copied.");
    } catch {
      setActionStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [uuids, needsNameArgs, namespaceValid, safeQuantity]);

  return (
    <ToolIsland className="ug-tool">
      <ToolPanel labelledBy="ug-settings-heading" className="ug-tool__panel">
        <ToolSectionHeading
          title="UUID settings"
          titleId="ug-settings-heading"
          description={
            <ToolHint>
              Pick a UUID version and quantity, then copy or refresh the generated identifiers.
            </ToolHint>
          }
        />

        <ToolField label="UUID version" full>
          <div className="ug-segment" role="radiogroup" aria-label="UUID version">
            {UUID_VERSIONS.map((option) => {
              const selected = safeVersion === option;

              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`ug-segment__btn${selected ? " is-selected" : ""}`}
                  onClick={() => setVersion(option)}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </ToolField>

        <ToolInput
          id="ug-quantity"
          label="Quantity"
          full
          type="number"
          min={UUID_QUANTITY_MIN}
          max={UUID_QUANTITY_MAX}
          step={1}
          value={safeQuantity}
          onChange={(event) => setQuantity(clampUuidQuantity(event.target.value))}
        />

        {needsNameArgs ? (
          <div className="ug-name-args">
            <ToolField label="Namespace" full>
              <div className="ug-segment" role="radiogroup" aria-label="Namespace preset">
                {UUID_NAMESPACE_OPTIONS.map((option) => {
                  const selected = namespace === option.value;

                  return (
                    <button
                      key={option.key}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      className={`ug-segment__btn${selected ? " is-selected" : ""}`}
                      onClick={() => setNamespace(option.value)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </ToolField>

            <ToolInput
              id="ug-namespace"
              label="Custom namespace"
              full
              value={namespace}
              placeholder="Namespace UUID"
              spellCheck={false}
              autoComplete="off"
              aria-invalid={namespaceValid ? undefined : true}
              onChange={(event) => setNamespace(event.target.value)}
              className="ug-namespace-input"
            />

            {!namespaceValid ? (
              <ToolStatus tone="error">Invalid UUID namespace.</ToolStatus>
            ) : null}

            <ToolInput
              id="ug-name"
              label="Name"
              full
              value={name}
              placeholder="Name"
              spellCheck={false}
              autoComplete="off"
              onChange={(event) => setName(event.target.value)}
            />
          </div>
        ) : null}

        <ToolTextarea
          id="ug-output"
          label="UUIDs"
          full
          code
          readOnly
          rows={Math.min(8, Math.max(2, safeQuantity))}
          value={uuids}
          placeholder="Your UUIDs"
          className="ug-output"
          aria-live="polite"
        />

        <ToolActionRow>
          <ToolButton type="button" onClick={() => void copyUuids()} disabled={!uuids}>
            Copy
          </ToolButton>
          <ToolButton type="button" variant="ghost" onClick={refreshUuids}>
            Refresh
          </ToolButton>
        </ToolActionRow>

        {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
      </ToolPanel>
    </ToolIsland>
  );
}
