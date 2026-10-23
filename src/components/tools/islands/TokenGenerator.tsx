import { useCallback, useMemo, useState } from "react";

import { Button, ButtonGroup, CopyButton, FormGrid, OutputField, Panel, Slider, Switch, ToolFrame } from "@/ui/react";
import {
  TOKEN_LENGTH_DEFAULT,
  TOKEN_LENGTH_MAX,
  TOKEN_LENGTH_MIN,
  clampTokenLength,
  createToken,
} from "@/lib/tools/token-generator";

export default function TokenGenerator() {
  const [withUppercase, setWithUppercase] = useState(true);
  const [withLowercase, setWithLowercase] = useState(true);
  const [withNumbers, setWithNumbers] = useState(true);
  const [withSymbols, setWithSymbols] = useState(false);
  const [length, setLength] = useState(TOKEN_LENGTH_DEFAULT);
  const [refreshKey, setRefreshKey] = useState(0);

  const safeLength = clampTokenLength(length);

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
  }, []);

  return (
    <ToolFrame>
      <Panel
        title="Token settings"
        titleId="tg-settings-heading"
        description="Toggle character classes and length, then copy or refresh the generated token."
      >
        <FormGrid columns="auto">
          <Switch id="tg-uppercase" label="Uppercase" checked={withUppercase} onChange={(event) => setWithUppercase(event.target.checked)} />
          <Switch id="tg-lowercase" label="Lowercase" checked={withLowercase} onChange={(event) => setWithLowercase(event.target.checked)} />
          <Switch id="tg-numbers" label="Numbers" checked={withNumbers} onChange={(event) => setWithNumbers(event.target.checked)} />
          <Switch id="tg-symbols" label="Symbols" checked={withSymbols} onChange={(event) => setWithSymbols(event.target.checked)} />
        </FormGrid>

        <Slider
          id="tg-length"
          label="Length"
          min={TOKEN_LENGTH_MIN}
          max={TOKEN_LENGTH_MAX}
          step={1}
          value={safeLength}
          onChange={(value) => setLength(Number(value))}
          showValue
        />

        <OutputField
          id="tg-token"
          label="Token"
          multiline
          rows={3}
          value={token}
          copy={false}
          placeholder={hasAlphabet ? "Generating…" : "Enable at least one character class"}
        />

        <ButtonGroup>
          <CopyButton value={token} disabled={!token} variant="primary" />
          <Button variant="ghost" iconStart="arrows-clockwise" onClick={refreshToken} disabled={!hasAlphabet}>
            Refresh
          </Button>
        </ButtonGroup>
      </Panel>
    </ToolFrame>
  );
}
