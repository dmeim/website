import { useMemo, useState } from "react";

import { Panel, ToolFrame, TransformPanel } from "@/ui/react";
import { textToNatoAlphabet } from "@/lib/tools/text-to-nato-alphabet";

export default function TextToNatoAlphabet() {
  const [input, setInput] = useState("");

  const natoText = useMemo(() => textToNatoAlphabet(input), [input]);

  return (
    <ToolFrame>
      <Panel
        title="NATO phonetic alphabet"
        description="Enter text to convert letters into Alpha…Zulu for clearer oral transmission."
      >
        <TransformPanel
          input={{
            label: "Your text to convert",
            value: input,
            onChange: setInput,
            placeholder: "Put your text here…",
            rows: 3,
          }}
          output={{ label: "NATO phonetic alphabet", value: natoText, mono: true, rows: 4 }}
        />
      </Panel>
    </ToolFrame>
  );
}
