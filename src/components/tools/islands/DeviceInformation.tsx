import { useEffect, useState } from "react";

import { KeyValue, Panel, ToolFrame } from "@/ui/react";
import {
  buildDeviceInformation,
  readDeviceEnvironment,
  type DeviceInfoSection,
} from "@/lib/tools/device-information";

export default function DeviceInformation() {
  const [sections, setSections] = useState<DeviceInfoSection[] | null>(null);

  useEffect(() => {
    const refresh = () => {
      const env = readDeviceEnvironment();
      setSections(env ? buildDeviceInformation(env) : null);
    };

    refresh();

    window.addEventListener("resize", refresh);
    window.screen.orientation?.addEventListener?.("change", refresh);

    return () => {
      window.removeEventListener("resize", refresh);
      window.screen.orientation?.removeEventListener?.("change", refresh);
    };
  }, []);

  return (
    <ToolFrame stagger>
      <Panel
        title="Device information"
        titleId="devinfo-heading"
        description="Live screen and browser details from this device: size, pixel ratio, orientation, languages, and user agent."
      >
        {sections == null ? <p aria-busy="true">Reading device environment…</p> : null}
      </Panel>

      {sections?.map((section) => (
        <Panel
          key={section.name}
          title={section.name}
          titleId={`devinfo-${section.name.toLowerCase()}-heading`}
        >
          <KeyValue
            aria-label={`${section.name} information`}
            items={section.information.map((item) => ({
              label: item.label,
              value: item.value,
              mono: true,
              tone: item.value === "unknown" ? "muted" : "default",
            }))}
          />
        </Panel>
      ))}
    </ToolFrame>
  );
}
