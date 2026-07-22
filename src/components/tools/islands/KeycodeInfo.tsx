import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
  ToolWorkspace,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import {
  buildKeycodeFields,
  snapshotFromKeyboardEvent,
  type KeyEventSnapshot,
} from "@/lib/tools/keycode-info";

import "./KeycodeInfo.css";

export default function KeycodeInfo() {
  const [snapshot, setSnapshot] = useState<KeyEventSnapshot | null>(null);
  const [actionStatus, setActionStatus] = useState("");

  const fields = useMemo(() => buildKeycodeFields(snapshot), [snapshot]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      setSnapshot(snapshotFromKeyboardEvent(event));
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const copyField = useCallback(async (label: string, value: string) => {
    if (!value) {
      setActionStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(value);
      setActionStatus(`${label} copied.`);
    } catch {
      setActionStatus("Copy failed. Select the value and copy it manually.");
    }
  }, []);

  return (
    <ToolIsland className="kci-tool">
      <ToolWorkspace className="kci-workspace" stagger>
        <ToolPanel labelledBy="kci-heading" className="kci-tool__panel">
          <ToolSectionHeading
            title="Keycode info"
            titleId="kci-heading"
            description={
              <ToolHint>
                Press any key to see its JavaScript key, keyCode, code,
                location, and modifiers.
              </ToolHint>
            }
          />

          <div
            className="kci-prompt"
            role="status"
            aria-live="polite"
            tabIndex={0}
          >
            {snapshot ? (
              <div className="kci-prompt__key" aria-label={`Pressed key ${snapshot.key}`}>
                {snapshot.key}
              </div>
            ) : null}
            <p className="kci-prompt__hint">
              Press the key on your keyboard you want to get info about this key
            </p>
          </div>

          {fields.length > 0 ? (
            <div className="kci-fields" role="list" aria-label="Key event fields">
              {fields.map((field) => (
                <div key={field.id} className="kci-field" role="listitem">
                  <span className="kci-field__label">{field.label}</span>
                  <ToolInput
                    id={`kci-${field.id}`}
                    label={field.label}
                    full
                    readOnly
                    value={field.value}
                    placeholder={field.placeholder}
                    className="kci-field__value tool-code"
                    aria-live="polite"
                  />
                  <ToolActionRow className="kci-field__actions">
                    <ToolButton
                      type="button"
                      onClick={() => void copyField(field.label, field.value)}
                      disabled={!field.value}
                    >
                      Copy
                    </ToolButton>
                  </ToolActionRow>
                </div>
              ))}
            </div>
          ) : null}

          {actionStatus ? (
            <ToolStatus tone="success">{actionStatus}</ToolStatus>
          ) : null}
        </ToolPanel>
      </ToolWorkspace>
    </ToolIsland>
  );
}
