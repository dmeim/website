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
  canDecodeUrl,
  canEncodeUrl,
  decodeUrlSafe,
  encodeUrlSafe,
} from "@/lib/tools/url-encoder";

import "./UrlEncoder.css";

export default function UrlEncoder() {
  const [encodeInput, setEncodeInput] = useState("Hello world :)");
  const [decodeInput, setDecodeInput] = useState("Hello%20world%20%3A)");
  const [encodeStatus, setEncodeStatus] = useState("");
  const [decodeStatus, setDecodeStatus] = useState("");

  const encodeInvalid = !canEncodeUrl(encodeInput);
  const encodeOutput = useMemo(
    () => (encodeInvalid ? "" : encodeUrlSafe(encodeInput)),
    [encodeInput, encodeInvalid],
  );

  const decodeInvalid = decodeInput !== "" && !canDecodeUrl(decodeInput);
  const decodeOutput = useMemo(
    () => (decodeInvalid ? "" : decodeUrlSafe(decodeInput)),
    [decodeInput, decodeInvalid],
  );

  const copyEncoded = useCallback(async () => {
    if (!encodeOutput) {
      setEncodeStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(encodeOutput);
      setEncodeStatus("Encoded string copied.");
    } catch {
      setEncodeStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [encodeOutput]);

  const copyDecoded = useCallback(async () => {
    if (!decodeOutput) {
      setDecodeStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(decodeOutput);
      setDecodeStatus("Decoded string copied.");
    } catch {
      setDecodeStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [decodeOutput]);

  return (
    <ToolIsland className="urlenc-tool">
      <ToolWorkspace className="urlenc-tool__workspace" stagger>
        <ToolPanel labelledBy="urlenc-encode-heading" className="urlenc-tool__panel">
          <ToolSectionHeading
            title="Encode"
            titleId="urlenc-encode-heading"
            description={
              <ToolHint>
                Percent-encode a string with{" "}
                <code>encodeURIComponent</code> (spaces → <code>%20</code>,
                and so on).
              </ToolHint>
            }
          />

          <ToolTextarea
            id="urlenc-encode-input"
            label="Your string"
            full
            rows={3}
            value={encodeInput}
            placeholder="The string to encode"
            onChange={(event) => setEncodeInput(event.target.value)}
            autoFocus
            aria-invalid={encodeInvalid || undefined}
          />

          {encodeInvalid ? (
            <ToolStatus tone="error" live="polite">
              Impossible to parse this string
            </ToolStatus>
          ) : null}

          <ToolTextarea
            id="urlenc-encode-output"
            label="Your string encoded"
            full
            code
            readOnly
            rows={3}
            value={encodeOutput}
            placeholder="Your string encoded"
            className="urlenc-output"
            aria-live="polite"
          />

          <ToolActionRow>
            <ToolButton
              type="button"
              onClick={() => void copyEncoded()}
              disabled={!encodeOutput}
            >
              Copy
            </ToolButton>
          </ToolActionRow>

          {encodeStatus ? (
            <ToolStatus tone="success">{encodeStatus}</ToolStatus>
          ) : null}
        </ToolPanel>

        <ToolPanel labelledBy="urlenc-decode-heading" className="urlenc-tool__panel">
          <ToolSectionHeading
            title="Decode"
            titleId="urlenc-decode-heading"
            description={
              <ToolHint>
                Decode a percent-encoded string with{" "}
                <code>decodeURIComponent</code>.
              </ToolHint>
            }
          />

          <ToolTextarea
            id="urlenc-decode-input"
            label="Your encoded string"
            full
            code
            rows={3}
            value={decodeInput}
            placeholder="The string to decode"
            onChange={(event) => setDecodeInput(event.target.value)}
            aria-invalid={decodeInvalid || undefined}
          />

          {decodeInvalid ? (
            <ToolStatus tone="error" live="polite">
              Impossible to parse this string
            </ToolStatus>
          ) : null}

          <ToolTextarea
            id="urlenc-decode-output"
            label="Your string decoded"
            full
            readOnly
            rows={3}
            value={decodeOutput}
            placeholder="Your string decoded"
            className="urlenc-output"
            aria-live="polite"
          />

          <ToolActionRow>
            <ToolButton
              type="button"
              onClick={() => void copyDecoded()}
              disabled={!decodeOutput}
            >
              Copy
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
