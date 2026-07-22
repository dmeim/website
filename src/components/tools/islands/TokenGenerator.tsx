import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolCheck,
  ToolField,
  ToolFormGrid,
  ToolHint,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
  ToolTextarea,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import {
  TOKEN_LENGTH_DEFAULT,
  TOKEN_LENGTH_MAX,
  TOKEN_LENGTH_MIN,
  clampTokenLength,
  createToken,
} from "@/lib/tools/token-generator";

import "./TokenGenerator.css";

export default function TokenGenerator() {
  const [withUppercase, setWithUppercase] = useState(true);
  const [withLowercase, setWithLowercase] = useState(true);
  const [withNumbers, setWithNumbers] = useState(true);
  const [withSymbols, setWithSymbols] = useState(false);
  const [length, setLength] = useState(TOKEN_LENGTH_DEFAULT);
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionStatus, setActionStatus] = useState("");

  const safeLength = clampTokenLength(length);
  const lengthFillPercent =
    ((safeLength - TOKEN_LENGTH_MIN) / (TOKEN_LENGTH_MAX - TOKEN_LENGTH_MIN)) * 100;

  const token = useMemo(() => {
    void refreshKey;
    return createToken({
      withUppercase,
      withLowercase,
      withNumbers,
      withSymbols,
      length: safeLength,
    });
  }, [withUppercase, withLowercase, withNumbers, withSymbols, safeLength, refreshKey]);

  const hasAlphabet = withUppercase || withLowercase || withNumbers || withSymbols;

  const refreshToken = useCallback(() => {
    setRefreshKey((value) => value + 1);
    setActionStatus("Token refreshed.");
  }, []);

  const copyToken = useCallback(async () => {
    if (!token) {
      setActionStatus("Enable at least one character class to generate a token.");
      return;
    }

    try {
      await copyTextToClipboard(token);
      setActionStatus("Token copied.");
    } catch {
      setActionStatus("Copy failed. Select the token and copy it manually.");
    }
  }, [token]);

  return (
    <ToolIsland className="tg-tool">
      <ToolPanel labelledBy="tg-settings-heading" className="tg-tool__panel">
        <ToolSectionHeading
          title="Token settings"
          titleId="tg-settings-heading"
          description={
            <ToolHint>
              Toggle character classes and length, then copy or refresh the generated token.
            </ToolHint>
          }
        />

        <ToolFormGrid className="tg-toggles">
          <ToolCheck
            id="tg-uppercase"
            label="Uppercase"
            toggle
            checked={withUppercase}
            onChange={(event) => setWithUppercase(event.target.checked)}
          />
          <ToolCheck
            id="tg-lowercase"
            label="Lowercase"
            toggle
            checked={withLowercase}
            onChange={(event) => setWithLowercase(event.target.checked)}
          />
          <ToolCheck
            id="tg-numbers"
            label="Numbers"
            toggle
            checked={withNumbers}
            onChange={(event) => setWithNumbers(event.target.checked)}
          />
          <ToolCheck
            id="tg-symbols"
            label="Symbols"
            toggle
            checked={withSymbols}
            onChange={(event) => setWithSymbols(event.target.checked)}
          />
        </ToolFormGrid>

        <ToolField label={`Length (${safeLength})`} htmlFor="tg-length" full>
          <div className="tg-range-slider">
            <div className="tg-range-track" />
            <div className="tg-range-fill" style={{ width: `${lengthFillPercent}%` }} />
            <input
              id="tg-length"
              type="range"
              min={TOKEN_LENGTH_MIN}
              max={TOKEN_LENGTH_MAX}
              step={1}
              value={safeLength}
              onChange={(event) => setLength(Number(event.target.value))}
              aria-valuemin={TOKEN_LENGTH_MIN}
              aria-valuemax={TOKEN_LENGTH_MAX}
              aria-valuenow={safeLength}
            />
          </div>
          <div className="tg-range-labels" aria-hidden="true">
            <span>{TOKEN_LENGTH_MIN}</span>
            <span>{TOKEN_LENGTH_MAX}</span>
          </div>
        </ToolField>

        <ToolTextarea
          id="tg-token"
          label="Token"
          full
          code
          readOnly
          rows={3}
          value={token}
          placeholder={hasAlphabet ? "Generating…" : "Enable at least one character class"}
          className="tg-token-display"
          aria-live="polite"
        />

        <ToolActionRow>
          <ToolButton type="button" onClick={() => void copyToken()} disabled={!token}>
            Copy
          </ToolButton>
          <ToolButton type="button" variant="ghost" onClick={refreshToken} disabled={!hasAlphabet}>
            Refresh
          </ToolButton>
        </ToolActionRow>

        {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
      </ToolPanel>
    </ToolIsland>
  );
}
