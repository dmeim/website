import { useMemo, useState } from "react";

import { Code, Panel, ToolFrame, TransformPanel } from "@/ui/react";
import {
  canDecodeUrl,
  canEncodeUrl,
  decodeUrlSafe,
  encodeUrlSafe,
} from "@/lib/tools/url-encoder";

const PARSE_ERROR = "Impossible to parse this string";

export default function UrlEncoder() {
  const [encodeInput, setEncodeInput] = useState("Hello world :)");
  const [decodeInput, setDecodeInput] = useState("Hello%20world%20%3A)");

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

  return (
    <ToolFrame layout="split" stagger>
      <Panel
        title="Encode"
        description={
          <>
            Percent-encode a string with <Code>encodeURIComponent</Code> (spaces become{" "}
            <Code>%20</Code>, and so on).
          </>
        }
      >
        <TransformPanel
          input={{
            label: "Your string",
            value: encodeInput,
            onChange: setEncodeInput,
            placeholder: "The string to encode",
            rows: 3,
          }}
          error={encodeInvalid ? PARSE_ERROR : undefined}
          output={{ label: "Your string encoded", value: encodeOutput, mono: true, rows: 3 }}
        />
      </Panel>

      <Panel
        title="Decode"
        description={<>Decode a percent-encoded string with <Code>decodeURIComponent</Code>.</>}
      >
        <TransformPanel
          input={{
            label: "Your encoded string",
            value: decodeInput,
            onChange: setDecodeInput,
            placeholder: "The string to decode",
            mono: true,
            rows: 3,
          }}
          error={decodeInvalid ? PARSE_ERROR : undefined}
          output={{ label: "Your string decoded", value: decodeOutput, rows: 3 }}
        />
      </Panel>
    </ToolFrame>
  );
}
