import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolHint,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
  ToolTextarea,
  ToolWorkspace,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import { escapeHtml, unescapeHtml } from "@/lib/tools/html-entities";

import "./HtmlEntities.css";

export default function HtmlEntities() {
  const [escapeInput, setEscapeInput] = useState("<title>IT Tool</title>");
  const [unescapeInput, setUnescapeInput] = useState(
    "&lt;title&gt;IT Tool&lt;/title&gt;",
  );
  const [escapeStatus, setEscapeStatus] = useState("");
  const [unescapeStatus, setUnescapeStatus] = useState("");

  const escapeOutput = useMemo(() => escapeHtml(escapeInput), [escapeInput]);
  const unescapeOutput = useMemo(
    () => unescapeHtml(unescapeInput),
    [unescapeInput],
  );

  const copyEscaped = useCallback(async () => {
    if (!escapeOutput) {
      setEscapeStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(escapeOutput);
      setEscapeStatus("Escaped string copied.");
    } catch {
      setEscapeStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [escapeOutput]);

  const copyUnescaped = useCallback(async () => {
    if (!unescapeOutput) {
      setUnescapeStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(unescapeOutput);
      setUnescapeStatus("Unescaped string copied.");
    } catch {
      setUnescapeStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [unescapeOutput]);

  return (
    <ToolIsland className="htmlent-tool">
      <ToolWorkspace className="htmlent-tool__workspace" stagger>
        <ToolPanel labelledBy="htmlent-escape-heading" className="htmlent-tool__panel">
          <ToolSectionHeading
            title="Escape"
            titleId="htmlent-escape-heading"
            description={
              <ToolHint>
                Replace <code>&amp;</code>, <code>&lt;</code>, <code>&gt;</code>,{" "}
                <code>&quot;</code>, and <code>&#39;</code> with HTML entities.
              </ToolHint>
            }
          />

          <ToolTextarea
            id="htmlent-escape-input"
            label="Your string"
            full
            rows={3}
            value={escapeInput}
            placeholder="The string to escape"
            onChange={(event) => setEscapeInput(event.target.value)}
            autoFocus
          />

          <ToolTextarea
            id="htmlent-escape-output"
            label="Your string escaped"
            full
            code
            readOnly
            rows={3}
            value={escapeOutput}
            placeholder="Your string escaped"
            className="htmlent-output"
            aria-live="polite"
          />

          <ToolActionRow>
            <ToolButton
              type="button"
              onClick={() => void copyEscaped()}
              disabled={!escapeOutput}
            >
              Copy
            </ToolButton>
          </ToolActionRow>

          {escapeStatus ? (
            <ToolStatus tone="success">{escapeStatus}</ToolStatus>
          ) : null}
        </ToolPanel>

        <ToolPanel
          labelledBy="htmlent-unescape-heading"
          className="htmlent-tool__panel"
        >
          <ToolSectionHeading
            title="Unescape"
            titleId="htmlent-unescape-heading"
            description={
              <ToolHint>
                Decode <code>&amp;amp;</code>, <code>&amp;lt;</code>,{" "}
                <code>&amp;gt;</code>, <code>&amp;quot;</code>, and{" "}
                <code>&amp;#39;</code> back to characters.
              </ToolHint>
            }
          />

          <ToolTextarea
            id="htmlent-unescape-input"
            label="Your escaped string"
            full
            code
            rows={3}
            value={unescapeInput}
            placeholder="The string to unescape"
            onChange={(event) => setUnescapeInput(event.target.value)}
          />

          <ToolTextarea
            id="htmlent-unescape-output"
            label="Your string unescaped"
            full
            readOnly
            rows={3}
            value={unescapeOutput}
            placeholder="Your string unescaped"
            className="htmlent-output"
            aria-live="polite"
          />

          <ToolActionRow>
            <ToolButton
              type="button"
              onClick={() => void copyUnescaped()}
              disabled={!unescapeOutput}
            >
              Copy
            </ToolButton>
          </ToolActionRow>

          {unescapeStatus ? (
            <ToolStatus tone="success">{unescapeStatus}</ToolStatus>
          ) : null}
        </ToolPanel>
      </ToolWorkspace>
    </ToolIsland>
  );
}
