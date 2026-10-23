import { useMemo, useState } from "react";

import { Code, Panel, ToolFrame, TransformPanel } from "@/ui/react";
import { convertTextToUnicode, convertUnicodeToText } from "@/lib/tools/text-to-unicode";

export default function TextToUnicode() {
  const [inputText, setInputText] = useState("");
  const [inputUnicode, setInputUnicode] = useState("");

  const unicodeFromText = useMemo(
    () => (inputText.trim() === "" ? "" : convertTextToUnicode(inputText)),
    [inputText],
  );

  const textFromUnicode = useMemo(
    () => (inputUnicode.trim() === "" ? "" : convertUnicodeToText(inputUnicode)),
    [inputUnicode],
  );

  return (
    <ToolFrame layout="split" stagger>
      <Panel
        title="Text to Unicode"
        description={<>Enter text to convert into HTML decimal entities (<Code>&amp;#N;</Code>).</>}
      >
        <TransformPanel
          input={{
            label: "Enter text to convert to unicode",
            value: inputText,
            onChange: setInputText,
            placeholder: "e.g. Hello Avengers",
            rows: 4,
          }}
          output={{ label: "Unicode from your text", value: unicodeFromText, mono: true, rows: 4 }}
        />
      </Panel>

      <Panel
        title="Unicode to Text"
        description={<>Paste <Code>&amp;#N;</Code> entities to decode them back into readable text.</>}
      >
        <TransformPanel
          input={{
            label: "Enter unicode to convert to text",
            value: inputUnicode,
            onChange: setInputUnicode,
            placeholder: "e.g. &#72;&#101;&#108;&#108;&#111;",
            mono: true,
            rows: 4,
          }}
          output={{ label: "Text from your Unicode", value: textFromUnicode, rows: 4 }}
        />
      </Panel>
    </ToolFrame>
  );
}
