import { useCallback, useMemo, useState } from "react";

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
    <div className="sp-tool">
      <div className="sp-tool__workspace">
        <section className="sp-panel" aria-labelledby="sp-settings-heading">
          <div className="sp-panel__heading">
            <h2 id="sp-settings-heading">Placeholder Settings</h2>
            <p className="sp-hint">Text is escaped before it is inserted into the generated SVG.</p>
          </div>

          <div className="sp-form-grid">
            <div className="sp-field">
              <label className="sp-field-label" htmlFor="sp-width">
                Width
              </label>
              <input
                id="sp-width"
                type="number"
                min={1}
                max={10000}
                step={1}
                value={width}
                onChange={(event) => setWidth(Number(event.target.value))}
              />
            </div>

            <div className="sp-field">
              <label className="sp-field-label" htmlFor="sp-height">
                Height
              </label>
              <input
                id="sp-height"
                type="number"
                min={1}
                max={10000}
                step={1}
                value={height}
                onChange={(event) => setHeight(Number(event.target.value))}
              />
            </div>

            <div className="sp-field">
              <label className="sp-field-label" htmlFor="sp-background">
                Background
              </label>
              <div className="sp-color-row">
                <input
                  id="sp-background"
                  type="color"
                  value={backgroundColor}
                  onChange={(event) => setBackgroundColor(event.target.value)}
                />
                <span className="sp-color-value">{backgroundColor}</span>
              </div>
            </div>

            <div className="sp-field">
              <label className="sp-field-label" htmlFor="sp-text-color">
                Text Color
              </label>
              <div className="sp-color-row">
                <input
                  id="sp-text-color"
                  type="color"
                  value={textColor}
                  onChange={(event) => setTextColor(event.target.value)}
                />
                <span className="sp-color-value">{textColor}</span>
              </div>
            </div>

            <div className="sp-field">
              <label className="sp-field-label" htmlFor="sp-font-size">
                Font Size
              </label>
              <input
                id="sp-font-size"
                type="number"
                min={1}
                max={1000}
                step={1}
                value={fontSize}
                onChange={(event) => setFontSize(Number(event.target.value))}
              />
            </div>

            <label className="sp-check-row sp-check-row--inline" htmlFor="sp-exact-size">
              <input
                id="sp-exact-size"
                type="checkbox"
                checked={useExactSize}
                onChange={(event) => setUseExactSize(event.target.checked)}
              />
              Add Exact Width/Height
            </label>

            <div className="sp-field sp-field--full">
              <label className="sp-field-label" htmlFor="sp-custom-text">
                Custom Text
              </label>
              <input
                id="sp-custom-text"
                type="text"
                placeholder={placeholderHint}
                value={customText}
                onChange={(event) => setCustomText(event.target.value)}
              />
            </div>
          </div>

          <div className="sp-actions">
            <button type="button" className="sp-btn sp-btn--primary" onClick={copySvg}>
              Copy SVG
            </button>
            <button type="button" className="sp-btn sp-btn--secondary" onClick={copyDataUri}>
              Copy Data URI
            </button>
            <button type="button" className="sp-btn sp-btn--secondary" onClick={downloadSvg}>
              Download SVG
            </button>
          </div>

          {actionStatus ? (
            <p className="sp-status" aria-live="polite">
              {actionStatus}
            </p>
          ) : null}
        </section>

        <section className="sp-panel sp-panel--preview" aria-labelledby="sp-preview-heading">
          <div className="sp-panel__heading">
            <h2 id="sp-preview-heading">Preview</h2>
            <p className="sp-status sp-status--accent">{filename}</p>
          </div>

          <div className="sp-preview-frame">
            <img src={dataUri} alt="Generated SVG placeholder preview" />
          </div>
        </section>
      </div>

      <section className="sp-panel" aria-labelledby="sp-output-heading">
        <div className="sp-panel__heading">
          <h2 id="sp-output-heading">Generated Output</h2>
          <p className="sp-hint">Both outputs are local strings generated from the current settings.</p>
        </div>

        <div className="sp-output-grid">
          <div className="sp-field sp-field--full">
            <label className="sp-field-label" htmlFor="sp-svg-output">
              SVG Markup
            </label>
            <textarea
              id="sp-svg-output"
              className="sp-code-textarea"
              readOnly
              value={svg}
            />
          </div>

          <div className="sp-field sp-field--full">
            <label className="sp-field-label" htmlFor="sp-data-uri-output">
              SVG Data URI
            </label>
            <textarea
              id="sp-data-uri-output"
              className="sp-code-textarea"
              readOnly
              value={dataUri}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
