import { useMemo, useState } from "react";

import { Code, FormGrid, Input, OutputField, Panel, ToolFrame } from "@/ui/react";
import { basicAuthHeader } from "@/lib/tools/basic-auth-generator";

export default function BasicAuthGenerator() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const header = useMemo(
    () => basicAuthHeader(username, password),
    [username, password],
  );

  return (
    <ToolFrame>
      <Panel
        title="Basic auth header"
        titleId="basicauth-heading"
        description={
          <>
            Enter a username and password to build an <Code>Authorization: Basic …</Code> header (UTF-8 → Base64).
          </>
        }
      >
        <FormGrid columns={2}>
          <Input
            id="basicauth-username"
            label="Username"
            autoComplete="username"
            value={username}
            placeholder="Your username…"
            onChange={(event) => setUsername(event.target.value)}
            autoFocus
          />
          <Input
            id="basicauth-password"
            label="Password"
            type="password"
            revealable
            autoComplete="current-password"
            value={password}
            placeholder="Your password…"
            onChange={(event) => setPassword(event.target.value)}
          />
        </FormGrid>

        <OutputField id="basicauth-header" label="Authorization header" multiline rows={2} value={header} />
      </Panel>
    </ToolFrame>
  );
}
