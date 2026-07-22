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
  convertAsciiBinaryToTextSafe,
  convertTextToAsciiBinary,
  isValidAsciiBinary,
} from "@/lib/tools/text-to-binary";

import "./TextToBinary.css";

export default function TextToBinary() {
  const [inputText, setInputText] = useState("");
  const [inputBinary, setInputBinary] = useState("");
  const [textStatus, setTextStatus] = useState("");
  const [binaryStatus, setBinaryStatus] = useState("");

  const binaryFromText = useMemo(
    () => (inputText === "" ? "" : convertTextToAsciiBinary(inputText)),
    [inputText],
  );

  const binaryInputInvalid =
    inputBinary !== "" && !isValidAsciiBinary(inputBinary);

  const textFromBinary = useMemo(
    () =>
      inputBinary === "" || binaryInputInvalid
        ? ""
        : convertAsciiBinaryToTextSafe(inputBinary),
    [inputBinary, binaryInputInvalid],
  );

  const copyBinary = useCallback(async () => {
    if (!binaryFromText) {
      setTextStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(binaryFromText);
      setTextStatus("Binary copied.");
    } catch {
      setTextStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [binaryFromText]);

  const copyText = useCallback(async () => {
    if (!textFromBinary) {
      setBinaryStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(textFromBinary);
      setBinaryStatus("Text copied.");
    } catch {
      setBinaryStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [textFromBinary]);

  return (
    <ToolIsland className="ttb-tool">
      <ToolWorkspace className="ttb-tool__workspace" stagger>
        <ToolPanel labelledBy="ttb-text-heading" className="ttb-tool__panel">
          <ToolSectionHeading
            title="Text to ASCII binary"
            titleId="ttb-text-heading"
            description={
              <ToolHint>
                Enter text to convert into space-separated 8-bit ASCII binary.
              </ToolHint>
            }
          />

          <ToolTextarea
            id="ttb-text-input"
            label="Enter text to convert to binary"
            full
            rows={4}
            value={inputText}
            placeholder="e.g. Hello world"
            onChange={(event) => setInputText(event.target.value)}
            autoFocus
          />

          <ToolTextarea
            id="ttb-text-output"
            label="Binary from your text"
            full
            code
            readOnly
            rows={4}
            value={binaryFromText}
            placeholder="The binary representation of your text will be here"
            className="ttb-output"
            aria-live="polite"
          />

          <ToolActionRow>
            <ToolButton
              type="button"
              onClick={() => void copyBinary()}
              disabled={!binaryFromText}
            >
              Copy
            </ToolButton>
          </ToolActionRow>

          {textStatus ? <ToolStatus tone="success">{textStatus}</ToolStatus> : null}
        </ToolPanel>

        <ToolPanel labelledBy="ttb-binary-heading" className="ttb-tool__panel">
          <ToolSectionHeading
            title="ASCII binary to text"
            titleId="ttb-binary-heading"
            description={
              <ToolHint>
                Paste 8-bit ASCII binary (spaces optional) to decode it back into
                text.
              </ToolHint>
            }
          />

          <ToolTextarea
            id="ttb-binary-input"
            label="Enter binary to convert to text"
            full
            code
            rows={4}
            value={inputBinary}
            placeholder="e.g. 01001000 01100101 01101100 01101100 01101111"
            onChange={(event) => setInputBinary(event.target.value)}
            aria-invalid={binaryInputInvalid || undefined}
          />

          {binaryInputInvalid ? (
            <ToolStatus tone="error" live="polite">
              Binary should be a valid ASCII binary string with multiples of 8
              bits
            </ToolStatus>
          ) : null}

          <ToolTextarea
            id="ttb-binary-output"
            label="Text from your binary"
            full
            readOnly
            rows={4}
            value={textFromBinary}
            placeholder="The text representation of your binary will be here"
            className="ttb-output"
            aria-live="polite"
          />

          <ToolActionRow>
            <ToolButton
              type="button"
              onClick={() => void copyText()}
              disabled={!textFromBinary}
            >
              Copy
            </ToolButton>
          </ToolActionRow>

          {binaryStatus ? (
            <ToolStatus tone="success">{binaryStatus}</ToolStatus>
          ) : null}
        </ToolPanel>
      </ToolWorkspace>
    </ToolIsland>
  );
}
