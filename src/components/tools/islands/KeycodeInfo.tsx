import { useEffect, useMemo, useState } from "react";

import { KeyValue, Panel, Stat, ToolFrame } from "@/ui/react";
import {
  buildKeycodeFields,
  snapshotFromKeyboardEvent,
  type KeyEventSnapshot,
} from "@/lib/tools/keycode-info";

import "./KeycodeInfo.css";

export default function KeycodeInfo() {
  const [snapshot, setSnapshot] = useState<KeyEventSnapshot | null>(null);

  const fields = useMemo(() => buildKeycodeFields(snapshot), [snapshot]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      setSnapshot(snapshotFromKeyboardEvent(event));
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <ToolFrame>
      <Panel
        title="Keycode info"
        titleId="kci-heading"
        description="Press any key to see its JavaScript key, keyCode, code, location, and modifiers."
      >
        <div className="kci-prompt" role="status" aria-live="polite" tabIndex={0}>
          {snapshot ? (
            <Stat
              label="Pressed key"
              value={snapshot.key}
              size="xl"
              mono
              aria-label={`Pressed key ${snapshot.key}`}
            />
          ) : null}
          <p className="kci-prompt__hint">
            Press the key on your keyboard you want to get info about this key
          </p>
        </div>

        {fields.length > 0 ? (
          <KeyValue
            aria-label="Key event fields"
            items={fields.map((field) => ({
              label: field.label,
              value: field.value || field.placeholder,
              mono: true,
              tone: field.value ? "default" : "muted",
              copy: field.value ? field.value : false,
            }))}
          />
        ) : null}
      </Panel>
    </ToolFrame>
  );
}
