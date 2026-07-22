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
import {
  convertTextToUnicode,
  convertUnicodeToText,
} from "@/lib/tools/text-to-unicode";

import "./TextToUnicode.css";

export default function TextToUnicode() {
  const [inputText, setInputText] = useState("");
  const [inputUnicode, setInputUnicode] = useState("");
  const [textStatus, setTextStatus] = useState("");
  const [unicodeStatus, setUnicodeStatus] = useState("");

  const unicodeFromText = useMemo(
    () => (inputText.trim() === "" ? "" : convertTextToUnicode(inputText)),
    [inputText],
  );

  const textFromUnicode = useMemo(
    () => (inputUnicode.trim() === "" ? "" : convertUnicodeToText(inputUnicode)),
    [inputUnicode],
  );

  const copyUnicode = useCallback(async () => {
    if (!unicodeFromText) {
      setTextStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(unicodeFromText);
      setTextStatus("Unicode entities copied.");
    } catch {
      setTextStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [unicodeFromText]);

  const copyText = useCallback(async () => {
    if (!textFromUnicode) {
      setUnicodeStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(textFromUnicode);
      setUnicodeStatus("Text copied.");
    } catch {
      setUnicodeStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [textFromUnicode]);

  return (
    <ToolIsland className="ttu-tool">
      <ToolWorkspace className="ttu-tool__workspace" stagger>
        <ToolPanel labelledBy="ttu-text-heading" className="ttu-tool__panel">
          <ToolSectionHeading
            title="Text to Unicode"
            titleId="ttu-text-heading"
            description={
              <ToolHint>
                Enter text to convert into HTML decimal entities (`&#N;`).
              </ToolHint>
            }
          />

          <ToolTextarea
            id="ttu-text-input"
            label="Enter text to convert to unicode"
            full
            rows={4}
            value={inputText}
            placeholder="e.g. Hello Avengers"
            onChange={(event) => setInputText(event.target.value)}
            autoFocus
          />

          <ToolTextarea
            id="ttu-text-output"
            label="Unicode from your text"
            full
            code
            readOnly
            rows={4}
            value={unicodeFromText}
            placeholder="The unicode representation of your text will be here"
            className="ttu-output"
            aria-live="polite"
          />

          <ToolActionRow>
            <ToolButton
              type="button"
              onClick={() => void copyUnicode()}
              disabled={!unicodeFromText}
            >
              Copy
            </ToolButton>
          </ToolActionRow>

          {textStatus ? <ToolStatus tone="success">{textStatus}</ToolStatus> : null}
        </ToolPanel>

        <ToolPanel labelledBy="ttu-unicode-heading" className="ttu-tool__panel">
          <ToolSectionHeading
            title="Unicode to Text"
            titleId="ttu-unicode-heading"
            description={
              <ToolHint>
                Paste `&#N;` entities to decode them back into readable text.
              </ToolHint>
            }
          />

          <ToolTextarea
            id="ttu-unicode-input"
            label="Enter unicode to convert to text"
            full
            code
            rows={4}
            value={inputUnicode}
            placeholder="e.g. &#72;&#101;&#108;&#108;&#111;"
            onChange={(event) => setInputUnicode(event.target.value)}
          />

          <ToolTextarea
            id="ttu-unicode-output"
            label="Text from your Unicode"
            full
            readOnly
            rows={4}
            value={textFromUnicode}
            placeholder="The text representation of your unicode will be here"
            className="ttu-output"
            aria-live="polite"
          />

          <ToolActionRow>
            <ToolButton
              type="button"
              onClick={() => void copyText()}
              disabled={!textFromUnicode}
            >
              Copy
            </ToolButton>
          </ToolActionRow>

          {unicodeStatus ? (
            <ToolStatus tone="success">{unicodeStatus}</ToolStatus>
          ) : null}
        </ToolPanel>
      </ToolWorkspace>
    </ToolIsland>
  );
}
