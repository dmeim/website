import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolHint,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import { generatePort } from "@/lib/tools/random-port-generator";

import "./RandomPortGenerator.css";

export default function RandomPortGenerator() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionStatus, setActionStatus] = useState("");

  const port = useMemo(() => {
    void refreshKey;
    return generatePort();
  }, [refreshKey]);

  const portText = String(port);

  const refreshPort = useCallback(() => {
    setRefreshKey((value) => value + 1);
    setActionStatus("Port refreshed.");
  }, []);

  const copyPort = useCallback(async () => {
    try {
      await copyTextToClipboard(portText);
      setActionStatus("Port copied to the clipboard.");
    } catch {
      setActionStatus("Copy failed. Select the port and copy it manually.");
    }
  }, [portText]);

  return (
    <ToolIsland className="rpg-tool">
      <ToolPanel labelledBy="rpg-heading" className="rpg-tool__panel">
        <ToolSectionHeading
          title="Random port"
          titleId="rpg-heading"
          description={
            <ToolHint>
              A random port outside the well-known range (0–1023). Copy it or refresh for another.
            </ToolHint>
          }
        />

        <p className="rpg-port" aria-live="polite" data-testid="port">
          {portText}
        </p>

        <ToolActionRow>
          <ToolButton type="button" onClick={() => void copyPort()}>
            Copy
          </ToolButton>
          <ToolButton type="button" variant="ghost" onClick={refreshPort} data-testid="refresh">
            Refresh
          </ToolButton>
        </ToolActionRow>

        {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
      </ToolPanel>
    </ToolIsland>
  );
}
