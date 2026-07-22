import { useMemo, useState } from "react";

import {
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
} from "@/components/tools/ui";
import { getPasswordCrackTimeEstimation } from "@/lib/tools/password-strength-analyser";

import "./PasswordStrengthAnalyser.css";

export default function PasswordStrengthAnalyser() {
  const [password, setPassword] = useState("");

  const estimation = useMemo(
    () => getPasswordCrackTimeEstimation({ password }),
    [password],
  );

  const entropyDisplay = Math.round(estimation.entropy * 100) / 100;
  const scoreDisplay = `${Math.round(estimation.score * 100)} / 100`;

  const details = [
    { label: "Password length", value: estimation.passwordLength },
    { label: "Entropy", value: entropyDisplay },
    { label: "Character set size", value: estimation.charsetLength },
    { label: "Score", value: scoreDisplay },
  ] as const;

  return (
    <ToolIsland className="psa-tool">
      <ToolPanel labelledBy="psa-heading" className="psa-tool__panel">
        <ToolSectionHeading
          title="Password strength"
          titleId="psa-heading"
          description={
            <ToolHint>
              Type a password to estimate brute-force crack time from entropy and charset size.
            </ToolHint>
          }
        />

        <ToolInput
          id="psa-password"
          label="Password"
          full
          type="password"
          autoComplete="new-password"
          autoFocus
          value={password}
          placeholder="Enter a password…"
          onChange={(event) => setPassword(event.target.value)}
          data-testid="password-input"
        />

        <div className="psa-hero" aria-live="polite">
          <p className="psa-hero__label">Duration to crack this password with brute force</p>
          <p className="psa-hero__value" data-testid="crack-duration">
            {estimation.crackDurationFormatted}
          </p>
        </div>

        <dl className="psa-details">
          {details.map(({ label, value }) => (
            <div key={label} className="psa-details__row">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <p className="psa-note">
          <span className="psa-note__label">Note: </span>
          The computed strength is based on the time it would take to crack the password using a
          brute force approach; it does not take into account the possibility of a dictionary
          attack.
        </p>
      </ToolPanel>
    </ToolIsland>
  );
}
