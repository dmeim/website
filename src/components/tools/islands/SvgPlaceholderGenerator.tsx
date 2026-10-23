import { useMemo, useState } from "react";

import {
  Badge,
  Button,
  ButtonGroup,
  Checkbox,
  ColorInput,
  CopyButton,
  Figure,
  FormGrid,
  Input,
  Notice,
  OutputField,
  Panel,
  ToolFrame,
} from "@/ui/react";
import { downloadTextFile } from "@/lib/tools/download";
import {
  buildSvgDataUri,
  buildSvgPlaceholder,
  getSvgPlaceholderFilename,
} from "@/lib/tools/svg-placeholder/svgPlaceholder.service";

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
    [
      width,
      height,
      fontSize,
      backgroundColor,
      textColor,
      customText,
      useExactSize,
    ],
  );

  const dataUri = useMemo(() => buildSvgDataUri(svg), [svg]);
  const filename = useMemo(
    () => getSvgPlaceholderFilename(width, height),
    [width, height],
  );
  const placeholderHint = `${width || 600}x${height || 350}`;

  const downloadSvg = () => {
    downloadTextFile(filename, svg, "image/svg+xml;charset=utf-8");
    setActionStatus("SVG download started.");
  };

  return (
    <ToolFrame>
      <ToolFrame layout="split">
        <Panel
          title="Placeholder Settings"
          titleId="sp-settings-heading"
          description="Text is escaped before it is inserted into the generated SVG."
        >
          <FormGrid columns={2}>
            <Input
              label="Width"
              id="sp-width"
              type="number"
              min={1}
              max={10000}
              step={1}
              value={width}
              onChange={(event) => setWidth(Number(event.target.value))}
            />
            <Input
              label="Height"
              id="sp-height"
              type="number"
              min={1}
              max={10000}
              step={1}
              value={height}
              onChange={(event) => setHeight(Number(event.target.value))}
            />
            <ColorInput
              label="Background"
              id="sp-background"
              value={backgroundColor}
              onChange={setBackgroundColor}
            />
            <ColorInput
              label="Text Color"
              id="sp-text-color"
              value={textColor}
              onChange={setTextColor}
            />
            <Input
              label="Font Size"
              id="sp-font-size"
              type="number"
              min={1}
              max={1000}
              step={1}
              value={fontSize}
              onChange={(event) => setFontSize(Number(event.target.value))}
            />
            <Checkbox
              id="sp-exact-size"
              label="Add Exact Width/Height"
              checked={useExactSize}
              onChange={(event) => setUseExactSize(event.target.checked)}
            />
            <Input
              label="Custom Text"
              id="sp-custom-text"
              span="full"
              type="text"
              placeholder={placeholderHint}
              value={customText}
              onChange={(event) => setCustomText(event.target.value)}
            />
          </FormGrid>

          <ButtonGroup>
            <CopyButton variant="primary" value={svg} label="Copy SVG" />
            <CopyButton value={dataUri} label="Copy Data URI" />
            <Button iconStart="download-simple" onClick={downloadSvg}>
              Download SVG
            </Button>
          </ButtonGroup>

          {actionStatus ? <Notice live="polite">{actionStatus}</Notice> : null}
        </Panel>

        <Panel
          title="Preview"
          titleId="sp-preview-heading"
          actions={<Badge>{filename}</Badge>}
        >
          <Figure
            src={dataUri}
            alt="Generated SVG placeholder preview"
            frame
            priority
          />
        </Panel>
      </ToolFrame>

      <Panel
        title="Generated Output"
        titleId="sp-output-heading"
        description="Both outputs are local strings generated from the current settings."
      >
        <OutputField
          label="SVG Markup"
          id="sp-svg-output"
          multiline
          value={svg}
        />
        <OutputField
          label="SVG Data URI"
          id="sp-data-uri-output"
          multiline
          value={dataUri}
        />
      </Panel>
    </ToolFrame>
  );
}
