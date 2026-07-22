import { useCallback, useEffect, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolFormGrid,
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolSelect,
  ToolStatus,
  ToolTextarea,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import {
  ASCII_FONTS,
  DEFAULT_FONT,
  DEFAULT_INPUT,
  DEFAULT_WIDTH,
  WIDTH_MAX,
  WIDTH_MIN,
  clampWidth,
  configureBrowserFigletFonts,
  normalizeFont,
  tryRenderAsciiText,
} from "@/lib/tools/ascii-text-drawer";

import "./AsciiTextDrawer.css";

export default function AsciiTextDrawer() {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [font, setFont] = useState(DEFAULT_FONT);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [output, setOutput] = useState("");
  const [processing, setProcessing] = useState(true);
  const [errored, setErrored] = useState(false);
  const [actionStatus, setActionStatus] = useState("");

  useEffect(() => {
    configureBrowserFigletFonts();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const safeFont = normalizeFont(font);
    const safeWidth = clampWidth(width);

    setProcessing(true);

    void tryRenderAsciiText(input, { font: safeFont, width: safeWidth }).then(
      (result) => {
        if (cancelled) {
          return;
        }

        if (result.ok) {
          setOutput(result.text);
          setErrored(false);
        } else {
          setOutput("");
          setErrored(true);
        }
        setProcessing(false);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [input, font, width]);

  const copyOutput = useCallback(async () => {
    if (!output) {
      setActionStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(output);
      setActionStatus("ASCII art copied.");
    } catch {
      setActionStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [output]);

  return (
    <ToolIsland className="ascii-drawer-tool">
      <ToolPanel
        labelledBy="ascii-drawer-heading"
        className="ascii-drawer-tool__panel"
      >
        <ToolSectionHeading
          title="ASCII art text"
          titleId="ascii-drawer-heading"
          description={
            <ToolHint>
              Type text, pick a FIGlet font and wrap width, then copy the ASCII
              art output.
            </ToolHint>
          }
        />

        <ToolTextarea
          id="ascii-drawer-input"
          label="Your text"
          full
          rows={4}
          value={input}
          placeholder="Your text to draw"
          spellCheck={false}
          autoFocus
          onChange={(event) => {
            setInput(event.target.value);
            setActionStatus("");
          }}
        />

        <ToolFormGrid className="ascii-drawer-settings">
          <ToolSelect
            id="ascii-drawer-font"
            label="Font"
            value={normalizeFont(font)}
            onChange={(event) => {
              setFont(normalizeFont(event.target.value));
              setActionStatus("");
            }}
          >
            {ASCII_FONTS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </ToolSelect>

          <ToolInput
            id="ascii-drawer-width"
            label="Width"
            type="number"
            min={WIDTH_MIN}
            max={WIDTH_MAX}
            step={1}
            value={clampWidth(width)}
            placeholder="Width of the text"
            onChange={(event) => {
              const next = Number(event.target.value);
              setWidth(Number.isFinite(next) ? next : DEFAULT_WIDTH);
              setActionStatus("");
            }}
          />
        </ToolFormGrid>

        {processing ? (
          <ToolStatus tone="default" live="polite">
            Loading font…
          </ToolStatus>
        ) : null}

        {errored && !processing ? (
          <ToolStatus tone="error" live="assertive">
            Current settings resulted in error.
          </ToolStatus>
        ) : null}

        {!processing && !errored ? (
          <>
            <ToolTextarea
              id="ascii-drawer-output"
              label="ASCII art text"
              full
              code
              rows={12}
              readOnly
              value={output}
              className="ascii-drawer-output"
              aria-live="polite"
            />

            <ToolActionRow>
              <ToolButton
                type="button"
                onClick={() => void copyOutput()}
                disabled={!output}
              >
                Copy
              </ToolButton>
            </ToolActionRow>
          </>
        ) : null}

        {actionStatus ? (
          <ToolStatus tone="success" live="polite">
            {actionStatus}
          </ToolStatus>
        ) : null}
      </ToolPanel>
    </ToolIsland>
  );
}
