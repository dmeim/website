import { useCallback, useMemo, useState } from "react";

import { Button, ButtonGroup, CopyButton, Panel, Stat, ToolFrame } from "@/ui/react";
import { generatePort } from "@/lib/tools/random-port-generator";

export default function RandomPortGenerator() {
  const [refreshKey, setRefreshKey] = useState(0);

  const port = useMemo(() => {
    void refreshKey;
    return generatePort();
  }, [refreshKey]);

  const portText = String(port);

  const refreshPort = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  return (
    <ToolFrame>
      <Panel
        title="Random port"
        titleId="rpg-heading"
        description="A random port outside the well-known range (0–1023). Copy it or refresh for another."
      >
        <Stat label="Port" value={portText} size="xl" mono live data-testid="port" />

        <ButtonGroup>
          <CopyButton value={portText} />
          <Button variant="ghost" iconStart="arrows-clockwise" onClick={refreshPort} data-testid="refresh">
            Refresh
          </Button>
        </ButtonGroup>
      </Panel>
    </ToolFrame>
  );
}
