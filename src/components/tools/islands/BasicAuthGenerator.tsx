import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolFormGrid,
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
  ToolTextarea,
} from "@/components/tools/ui";
import { basicAuthHeader } from "@/lib/tools/basic-auth-generator";
import { copyTextToClipboard } from "@/lib/tools/clipboard";

import "./BasicAuthGenerator.css";

export default function BasicAuthGenerator() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [actionStatus, setActionStatus] = useState("");

  const header = useMemo(
    () => basicAuthHeader(username, password),
    [username, password],
  );

  const copyHeader = useCallback(async () => {
    try {
      await copyTextToClipboard(header);
      setActionStatus("Header copied to the clipboard.");
    } catch {
      setActionStatus("Copy failed. Select the header and copy it manually.");
    }
  }, [header]);

  return (
    <ToolIsland className="basicauth-tool">
      <ToolPanel labelledBy="basicauth-heading" className="basicauth-tool__panel">
        <ToolSectionHeading
          title="Basic auth header"
          titleId="basicauth-heading"
          description={
            <ToolHint>
              Enter a username and password to build an{" "}
              <code>Authorization: Basic …</code> header (UTF-8 → Base64).
            </ToolHint>
          }
        />

        <ToolFormGrid>
          <ToolInput
            id="basicauth-username"
            label="Username"
            full
            autoComplete="username"
            value={username}
            placeholder="Your username…"
            onChange={(event) => setUsername(event.target.value)}
            autoFocus
          />

          <ToolInput
            id="basicauth-password"
            label="Password"
            type="password"
            full
            autoComplete="current-password"
            value={password}
            placeholder="Your password…"
            onChange={(event) => setPassword(event.target.value)}
          />
        </ToolFormGrid>

        <ToolTextarea
          id="basicauth-header"
          label="Authorization header"
          full
          code
          readOnly
          rows={2}
          value={header}
          className="basicauth-header"
          aria-live="polite"
        />

        <ToolActionRow>
          <ToolButton type="button" onClick={() => void copyHeader()}>
            Copy header
          </ToolButton>
        </ToolActionRow>

        {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
      </ToolPanel>
    </ToolIsland>
  );
}
