import { useMemo, useState } from "react";

import { Code, Panel, Switch, ToolFrame, TransformPanel } from "@/ui/react";
import {
  base64ToTextSafe,
  isValidBase64,
  textToBase64,
} from "@/lib/tools/base64-string-converter";

export default function Base64StringConverter() {
  const [textInput, setTextInput] = useState("");
  const [base64Input, setBase64Input] = useState("");
  const [encodeUrlSafe, setEncodeUrlSafe] = useState(false);
  const [decodeUrlSafe, setDecodeUrlSafe] = useState(false);

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

  return (
    <ToolFrame layout="split" stagger>
      <Panel
        title="String to Base64"
        description={
          <>
            Encode a string into its Base64 representation. Toggle URL-safe for the{" "}
            <Code>-_</Code> alphabet without padding.
          </>
        }
      >
        <TransformPanel
          input={{
            label: "String to encode",
            value: textInput,
            onChange: setTextInput,
            placeholder: "Put your string here…",
            rows: 5,
          }}
          options={
            <Switch
              label="Encode URL safe"
              checked={encodeUrlSafe}
              onChange={(event) => setEncodeUrlSafe(event.target.checked)}
            />
          }
          output={{ label: "Base64 of string", value: base64Output, mono: true, rows: 5 }}
        />
      </Panel>

      <Panel
        title="Base64 to string"
        description={
          <>
            Decode a Base64 string back to text. Enable URL-safe when the input uses{" "}
            <Code>-_</Code> or omits padding.
          </>
        }
      >
        <TransformPanel
          input={{
            label: "Base64 string to decode",
            value: base64Input,
            onChange: setBase64Input,
            placeholder: "Your Base64 string…",
            mono: true,
            rows: 5,
          }}
          options={
            <Switch
              label="Decode URL safe"
              checked={decodeUrlSafe}
              onChange={(event) => setDecodeUrlSafe(event.target.checked)}
            />
          }
          error={base64InputInvalid ? "Invalid Base64 string" : undefined}
          output={{ label: "Decoded string", value: textOutput, rows: 5 }}
        />
      </Panel>
    </ToolFrame>
  );
}
