import { useMemo, useState } from "react";

import { Input, OutputField, Panel, ToolFrame } from "@/ui/react";
import { generateNumeronym } from "@/lib/tools/numeronym-generator";

export default function NumeronymGenerator() {
  const [word, setWord] = useState("");

  const numeronym = useMemo(() => generateNumeronym(word), [word]);

  return (
    <ToolFrame>
      <Panel
        title="Numeronym generator"
        description="Abbreviate a word as first letter + middle letter count + last letter (e.g. internationalization → i18n)."
      >
        <Input
          label="Word"
          value={word}
          placeholder="Enter a word, e.g. internationalization"
          onChange={(event) => setWord(event.target.value)}
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
        <OutputField
          label="Numeronym"
          value={numeronym}
          placeholder="Your numeronym will be here, e.g. i18n"
        />
      </Panel>
    </ToolFrame>
  );
}
