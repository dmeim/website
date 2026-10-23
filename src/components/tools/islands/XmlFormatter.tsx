import { useMemo, useState } from "react";

import { FormGrid, Input, Panel, Switch, ToolFrame, TransformPanel } from "@/ui/react";
import {
  DEFAULT_COLLAPSE_CONTENT,
  DEFAULT_INDENT_SIZE,
  DEFAULT_RAW_XML,
  MAX_INDENT_SIZE,
  MIN_INDENT_SIZE,
  clampIndentSize,
  formatXml,
  isValidXml,
} from "@/lib/tools/xml-formatter";

export default function XmlFormatter() {
  const [rawXml, setRawXml] = useState(DEFAULT_RAW_XML);
  const [collapseContent, setCollapseContent] = useState(DEFAULT_COLLAPSE_CONTENT);
  const [indentSize, setIndentSize] = useState(DEFAULT_INDENT_SIZE);

  const inputInvalid = rawXml.trim() !== "" && !isValidXml(rawXml);

  const output = useMemo(
    () => (inputInvalid ? "" : formatXml({ rawXml, indentSize, collapseContent })),
    [rawXml, collapseContent, indentSize, inputInvalid],
  );

  return (
    <ToolFrame>
      <Panel
        title="XML formatter"
        description="Paste XML to format it. Optionally collapse simple text content onto one line and set the indent size."
      >
        <TransformPanel
          input={{
            label: "Your XML",
            value: rawXml,
            onChange: setRawXml,
            placeholder: "Paste your XML here...",
            mono: true,
            rows: 12,
          }}
          output={{ label: "Formatted XML from your XML", value: output, mono: true, rows: 12 }}
          error={inputInvalid ? "Provided XML is not valid." : undefined}
          options={
            <FormGrid columns={2}>
              <Switch
                id="xf-collapse"
                label="Collapse content"
                checked={collapseContent}
                onChange={(event) => setCollapseContent(event.target.checked)}
              />
              <Input
                id="xf-indent"
                label="Indent size"
                type="number"
                min={MIN_INDENT_SIZE}
                max={MAX_INDENT_SIZE}
                step={1}
                value={indentSize}
                onChange={(event) => {
                  const next = event.target.valueAsNumber;
                  setIndentSize(
                    Number.isNaN(next) ? DEFAULT_INDENT_SIZE : clampIndentSize(next),
                  );
                }}
              />
            </FormGrid>
          }
        />
      </Panel>
    </ToolFrame>
  );
}
