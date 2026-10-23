import { useEffect, useState } from "react";

import { FormGrid, Input, Notice, OutputField, Panel, Select, Textarea, ToolFrame } from "@/ui/react";
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

  return (
    <ToolFrame>
      <Panel
        title="ASCII art text"
        titleId="ascii-drawer-heading"
        description="Type text, pick a FIGlet font and wrap width, then copy the ASCII art output."
      >
        <Textarea
          id="ascii-drawer-input"
          label="Your text"
          rows={4}
          value={input}
          placeholder="Your text to draw"
          spellCheck={false}
          autoFocus
          onChange={(event) => setInput(event.target.value)}
        />

        <FormGrid columns={2}>
          <Select
            id="ascii-drawer-font"
            label="Font"
            value={normalizeFont(font)}
            onChange={(event) => setFont(normalizeFont(event.target.value))}
            options={ASCII_FONTS.map((name) => ({ value: name, label: name }))}
          />

          <Input
            id="ascii-drawer-width"
            label="Width"
            type="number"
            min={WIDTH_MIN}
            max={WIDTH_MAX}
            step={1}
            mono
            value={clampWidth(width)}
            placeholder="Width of the text"
            onChange={(event) => {
              const next = Number(event.target.value);
              setWidth(Number.isFinite(next) ? next : DEFAULT_WIDTH);
            }}
          />
        </FormGrid>

        {processing ? (
          <Notice tone="neutral" live="polite">
            Loading font…
          </Notice>
        ) : null}

        {errored && !processing ? (
          <Notice tone="danger" live="assertive">
            Current settings resulted in error.
          </Notice>
        ) : null}

        {!processing && !errored ? (
          <OutputField
            id="ascii-drawer-output"
            label="ASCII art text"
            multiline
            rows={12}
            value={output}
            className="ascii-drawer-output"
          />
        ) : null}
      </Panel>
    </ToolFrame>
  );
}
