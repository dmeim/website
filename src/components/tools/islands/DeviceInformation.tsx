import { useEffect, useState } from "react";

import {
  ToolHint,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolWorkspace,
} from "@/components/tools/ui";
import {
  buildDeviceInformation,
  readDeviceEnvironment,
  type DeviceInfoSection,
} from "@/lib/tools/device-information";

import "./DeviceInformation.css";

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
    <ToolIsland className="devinfo-tool">
      <ToolSectionHeading
        title="Device information"
        titleId="devinfo-heading"
        description={
          <ToolHint>
            Live screen and browser details from this device — size, pixel
            ratio, orientation, languages, and user agent.
          </ToolHint>
        }
      />

      {sections == null ? (
        <ToolPanel labelledBy="devinfo-heading" className="devinfo-tool__panel">
          <p className="devinfo-loading">Reading device environment…</p>
        </ToolPanel>
      ) : (
        <ToolWorkspace className="devinfo-workspace" stagger>
          {sections.map((section) => (
            <ToolPanel
              key={section.name}
              labelledBy={`devinfo-${section.name.toLowerCase()}-heading`}
              className="devinfo-tool__panel"
            >
              <h2
                id={`devinfo-${section.name.toLowerCase()}-heading`}
                className="devinfo-section-title"
              >
                {section.name}
              </h2>

              <div
                className="devinfo-grid"
                role="list"
                aria-label={`${section.name} information`}
              >
                {section.information.map((item) => (
                  <div key={item.label} className="devinfo-cell" role="listitem">
                    <div className="devinfo-cell__label">{item.label}</div>
                    <div
                      className={
                        item.value === "unknown"
                          ? "devinfo-cell__value devinfo-cell__value--unknown"
                          : "devinfo-cell__value"
                      }
                      title={item.value}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </ToolPanel>
          ))}
        </ToolWorkspace>
      )}
    </ToolIsland>
  );
}
