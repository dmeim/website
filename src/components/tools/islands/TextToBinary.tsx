import { useMemo, useState } from "react";

import { Panel, ToolFrame, TransformPanel } from "@/ui/react";
import {
  convertAsciiBinaryToTextSafe,
  convertTextToAsciiBinary,
  isValidAsciiBinary,
} from "@/lib/tools/text-to-binary";

export default function TextToBinary() {
  const [inputText, setInputText] = useState("");
  const [inputBinary, setInputBinary] = useState("");

  const binaryFromText = useMemo(
    () => (inputText === "" ? "" : convertTextToAsciiBinary(inputText)),
    [inputText],
  );

  const binaryInputInvalid = inputBinary !== "" && !isValidAsciiBinary(inputBinary);

  const textFromBinary = useMemo(
    () =>
      inputBinary === "" || binaryInputInvalid
        ? ""
        : convertAsciiBinaryToTextSafe(inputBinary),
    [inputBinary, binaryInputInvalid],
  );

  return (
    <ToolFrame layout="split" stagger>
      <Panel
        title="Text to ASCII binary"
        description="Enter text to convert into space-separated 8-bit ASCII binary."
      >
        <TransformPanel
          input={{
            label: "Enter text to convert to binary",
            value: inputText,
            onChange: setInputText,
            placeholder: "e.g. Hello world",
            rows: 4,
          }}
          output={{ label: "Binary from your text", value: binaryFromText, mono: true, rows: 4 }}
        />
      </Panel>

      <Panel
        title="ASCII binary to text"
        description="Paste 8-bit ASCII binary (spaces optional) to decode it back into text."
      >
        <TransformPanel
          input={{
            label: "Enter binary to convert to text",
            value: inputBinary,
            onChange: setInputBinary,
            placeholder: "e.g. 01001000 01100101 01101100 01101100 01101111",
            mono: true,
            rows: 4,
          }}
          error={
            binaryInputInvalid
              ? "Binary should be a valid ASCII binary string with multiples of 8 bits"
              : undefined
          }
          output={{ label: "Text from your binary", value: textFromBinary, rows: 4 }}
        />
      </Panel>
    </ToolFrame>
  );
}
