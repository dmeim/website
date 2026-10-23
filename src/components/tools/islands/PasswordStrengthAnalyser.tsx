import { useMemo, useState } from "react";

import { Input, KeyValue, Notice, Panel, Stat, ToolFrame } from "@/ui/react";
import { getPasswordCrackTimeEstimation } from "@/lib/tools/password-strength-analyser";

export default function PasswordStrengthAnalyser() {
  const [password, setPassword] = useState("");

  const estimation = useMemo(
    () => getPasswordCrackTimeEstimation({ password }),
    [password],
  );

  const entropyDisplay = Math.round(estimation.entropy * 100) / 100;
  const scoreDisplay = `${Math.round(estimation.score * 100)} / 100`;

  return (
    <ToolFrame>
      <Panel
        title="Password strength"
        titleId="psa-heading"
        description="Type a password to estimate brute-force crack time from entropy and charset size."
      >
        <Input
          id="psa-password"
          label="Password"
          type="password"
          revealable
          autoComplete="new-password"
          autoFocus
          value={password}
          placeholder="Enter a password…"
          onChange={(event) => setPassword(event.target.value)}
          data-testid="password-input"
        />

        <Stat
          label="Duration to crack this password with brute force"
          value={estimation.crackDurationFormatted}
          size="lg"
          live
          data-testid="crack-duration"
        />

        <Stat label="Score" value={scoreDisplay} mono />

        <KeyValue
          items={[
            { label: "Password length", value: estimation.passwordLength, mono: true },
            { label: "Entropy", value: entropyDisplay, mono: true },
            { label: "Character set size", value: estimation.charsetLength, mono: true },
          ]}
        />

        <Notice tone="neutral">
          The computed strength is based on the time it would take to crack the password using a brute force
          approach; it does not take into account the possibility of a dictionary attack.
        </Notice>
      </Panel>
    </ToolFrame>
  );
}
