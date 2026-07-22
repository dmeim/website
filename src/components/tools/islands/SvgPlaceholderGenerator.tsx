import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolCheck,
  ToolField,
  ToolFormGrid,
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
  ToolTextarea,
  ToolWorkspace,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import { downloadTextFile } from "@/lib/tools/download";
import {
  buildSvgDataUri,
  buildSvgPlaceholder,
  getSvgPlaceholderFilename,
} from "@/lib/tools/svg-placeholder/svgPlaceholder.service";

import "./SvgPlaceholderGenerator.css";

/** Locked palette defaults — night elevated + gold */
const DEFAULT_BACKGROUND = "#0e1014";
const DEFAULT_TEXT = "#d4bc8a";

export default function SvgPlaceholderGenerator() {
  const [width, setWidth] = useState(600);
  const [height, setHeight] = useState(350);
  const [fontSize, setFontSize] = useState(26);
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_BACKGROUND);
  const [textColor, setTextColor] = useState(DEFAULT_TEXT);
  const [customText, setCustomText] = useState("");
  const [useExactSize, setUseExactSize] = useState(true);
  const [actionStatus, setActionStatus] = useState("");

  const svg = useMemo(
    () =>
      buildSvgPlaceholder({
        width,
        height,
        fontSize,
        backgroundColor,
        textColor,
        customText,
        useExactSize,
      }),
    [width, height, fontSize, backgroundColor, textColor, customText, useExactSize],
  );

  const dataUri = useMemo(() => buildSvgDataUri(svg), [svg]);
  const filename = useMemo(() => getSvgPlaceholderFilename(width, height), [width, height]);
  const placeholderHint = `${width || 600}x${height || 350}`;

  const copyWithStatus = useCallback(async (value: string, message: string) => {
    try {
      await copyTextToClipboard(value);
      setActionStatus(message);
    } catch {
      setActionStatus("Copy failed. Select the output and copy it manually.");
    }
  }, []);

  const copySvg = useCallback(() => {
    void copyWithStatus(svg, "SVG copied.");
  }, [copyWithStatus, svg]);

  const copyDataUri = useCallback(() => {
    void copyWithStatus(dataUri, "Data URI copied.");
  }, [copyWithStatus, dataUri]);

  const downloadSvg = useCallback(() => {
    downloadTextFile(filename, svg, "image/svg+xml;charset=utf-8");
    setActionStatus("SVG download started.");
  }, [filename, svg]);

  return (
    <ToolIsland className="sp-tool">
      <ToolWorkspace className="sp-tool__workspace">
        <ToolPanel labelledBy="sp-settings-heading">
          <ToolSectionHeading
            title="Placeholder Settings"
            titleId="sp-settings-heading"
            description={
              <ToolHint>Text is escaped before it is inserted into the generated SVG.</ToolHint>
            }
          />

          <ToolFormGrid>
            <ToolInput
              label="Width"
              id="sp-width"
              type="number"
              min={1}
              max={10000}
              step={1}
              value={width}
              onChange={(event) => setWidth(Number(event.target.value))}
            />

            <ToolInput
              label="Height"
              id="sp-height"
              type="number"
              min={1}
              max={10000}
              step={1}
              value={height}
              onChange={(event) => setHeight(Number(event.target.value))}
            />

            <ToolField label="Background" htmlFor="sp-background">
              <div className="sp-color-row">
                <input
                  id="sp-background"
                  type="color"
                  value={backgroundColor}
                  onChange={(event) => setBackgroundColor(event.target.value)}
                />
                <span className="sp-color-value">{backgroundColor}</span>
              </div>
            </ToolField>

            <ToolField label="Text Color" htmlFor="sp-text-color">
              <div className="sp-color-row">
                <input
                  id="sp-text-color"
                  type="color"
                  value={textColor}
                  onChange={(event) => setTextColor(event.target.value)}
                />
                <span className="sp-color-value">{textColor}</span>
              </div>
            </ToolField>

            <ToolInput
              label="Font Size"
              id="sp-font-size"
              type="number"
              min={1}
              max={1000}
              step={1}
              value={fontSize}
              onChange={(event) => setFontSize(Number(event.target.value))}
            />

            <ToolCheck
              id="sp-exact-size"
              className="sp-check-inline"
              label="Add Exact Width/Height"
              checked={useExactSize}
              onChange={(event) => setUseExactSize(event.target.checked)}
            />

            <ToolInput
              label="Custom Text"
              id="sp-custom-text"
              full
              type="text"
              placeholder={placeholderHint}
              value={customText}
              onChange={(event) => setCustomText(event.target.value)}
            />
          </ToolFormGrid>

          <ToolActionRow>
            <ToolButton variant="primary" onClick={copySvg}>
              Copy SVG
            </ToolButton>
            <ToolButton onClick={copyDataUri}>Copy Data URI</ToolButton>
            <ToolButton onClick={downloadSvg}>Download SVG</ToolButton>
          </ToolActionRow>

          {actionStatus ? <ToolStatus>{actionStatus}</ToolStatus> : null}
        </ToolPanel>

        <ToolPanel className="sp-panel--preview" labelledBy="sp-preview-heading">
          <ToolSectionHeading
            title="Preview"
            titleId="sp-preview-heading"
            description={<ToolStatus tone="accent">{filename}</ToolStatus>}
          />

          <div className="sp-preview-frame">
            <img src={dataUri} alt="Generated SVG placeholder preview" />
          </div>
        </ToolPanel>
      </ToolWorkspace>

      <ToolPanel labelledBy="sp-output-heading">
        <ToolSectionHeading
          title="Generated Output"
          titleId="sp-output-heading"
          description={
            <ToolHint>Both outputs are local strings generated from the current settings.</ToolHint>
          }
        />

        <ToolFormGrid className="sp-output-grid">
          <ToolTextarea
            label="SVG Markup"
            id="sp-svg-output"
            full
            code
            readOnly
            value={svg}
          />
          <ToolTextarea
            label="SVG Data URI"
            id="sp-data-uri-output"
            full
            code
            readOnly
            value={dataUri}
          />
        </ToolFormGrid>
      </ToolPanel>
    </ToolIsland>
  );
}
