import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolCheck,
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
  base64ToTextSafe,
  isValidBase64,
  textToBase64,
} from "@/lib/tools/base64-string-converter";

import "./Base64StringConverter.css";

export default function Base64StringConverter() {
  const [textInput, setTextInput] = useState("");
  const [base64Input, setBase64Input] = useState("");
  const [encodeUrlSafe, setEncodeUrlSafe] = useState(false);
  const [decodeUrlSafe, setDecodeUrlSafe] = useState(false);
  const [encodeStatus, setEncodeStatus] = useState("");
  const [decodeStatus, setDecodeStatus] = useState("");

  const base64Output = useMemo(
    () => textToBase64(textInput, { makeUrlSafe: encodeUrlSafe }),
    [textInput, encodeUrlSafe],
  );

  const trimmedBase64Input = base64Input.trim();
  const base64InputInvalid =
    trimmedBase64Input !== "" &&
    !isValidBase64(trimmedBase64Input, { makeUrlSafe: decodeUrlSafe });

  const textOutput = useMemo(
    () =>
      trimmedBase64Input === "" || base64InputInvalid
        ? ""
        : base64ToTextSafe(trimmedBase64Input, { makeUrlSafe: decodeUrlSafe }),
    [trimmedBase64Input, base64InputInvalid, decodeUrlSafe],
  );

  const copyBase64 = useCallback(async () => {
    if (!base64Output) {
      setEncodeStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(base64Output);
      setEncodeStatus("Base64 string copied.");
    } catch {
      setEncodeStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [base64Output]);

  const copyDecoded = useCallback(async () => {
    if (!textOutput) {
      setDecodeStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(textOutput);
      setDecodeStatus("Decoded string copied.");
    } catch {
      setDecodeStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [textOutput]);

  return (
    <ToolIsland className="b64s-tool">
      <ToolWorkspace className="b64s-tool__workspace" stagger>
        <ToolPanel labelledBy="b64s-encode-heading" className="b64s-tool__panel">
          <ToolSectionHeading
            title="String to base64"
            titleId="b64s-encode-heading"
            description={
              <ToolHint>
                Encode a string into its Base64 representation. Toggle URL-safe
                for the <code>-_</code> alphabet without padding.
              </ToolHint>
            }
          />

          <ToolCheck
            id="b64s-encode-url-safe"
            label="Encode URL safe"
            toggle
            checked={encodeUrlSafe}
            onChange={(event) => setEncodeUrlSafe(event.target.checked)}
          />

          <ToolTextarea
            id="b64s-text-input"
            label="String to encode"
            full
            rows={5}
            value={textInput}
            placeholder="Put your string here..."
            onChange={(event) => setTextInput(event.target.value)}
            autoFocus
          />

          <ToolTextarea
            id="b64s-base64-output"
            label="Base64 of string"
            full
            code
            readOnly
            rows={5}
            value={base64Output}
            placeholder="The base64 encoding of your string will be here"
            className="b64s-output"
            aria-live="polite"
          />

          <ToolActionRow>
            <ToolButton
              type="button"
              onClick={() => void copyBase64()}
              disabled={!base64Output}
            >
              Copy base64
            </ToolButton>
          </ToolActionRow>

          {encodeStatus ? (
            <ToolStatus tone="success">{encodeStatus}</ToolStatus>
          ) : null}
        </ToolPanel>

        <ToolPanel labelledBy="b64s-decode-heading" className="b64s-tool__panel">
          <ToolSectionHeading
            title="Base64 to string"
            titleId="b64s-decode-heading"
            description={
              <ToolHint>
                Decode a Base64 string back to text. Enable URL-safe when the
                input uses <code>-_</code> or omits padding.
              </ToolHint>
            }
          />

          <ToolCheck
            id="b64s-decode-url-safe"
            label="Decode URL safe"
            toggle
            checked={decodeUrlSafe}
            onChange={(event) => setDecodeUrlSafe(event.target.checked)}
          />

          <ToolTextarea
            id="b64s-base64-input"
            label="Base64 string to decode"
            full
            code
            rows={5}
            value={base64Input}
            placeholder="Your base64 string..."
            onChange={(event) => setBase64Input(event.target.value)}
            aria-invalid={base64InputInvalid || undefined}
          />

          {base64InputInvalid ? (
            <ToolStatus tone="error" live="polite">
              Invalid base64 string
            </ToolStatus>
          ) : null}

          <ToolTextarea
            id="b64s-text-output"
            label="Decoded string"
            full
            readOnly
            rows={5}
            value={textOutput}
            placeholder="The decoded string will be here"
            className="b64s-output"
            aria-live="polite"
          />

          <ToolActionRow>
            <ToolButton
              type="button"
              onClick={() => void copyDecoded()}
              disabled={!textOutput}
            >
              Copy decoded string
            </ToolButton>
          </ToolActionRow>

          {decodeStatus ? (
            <ToolStatus tone="success">{decodeStatus}</ToolStatus>
          ) : null}
        </ToolPanel>
      </ToolWorkspace>
    </ToolIsland>
  );
}
