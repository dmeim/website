import { useMemo, useState } from "react";

import { Panel, ToolFrame, TransformPanel } from "@/ui/react";
import { slugifyString } from "@/lib/tools/slugify-string";

export default function SlugifyString() {
  const [input, setInput] = useState("");

  const slug = useMemo(() => slugifyString(input), [input]);

  return (
    <ToolFrame>
      <Panel
        title="Slugify string"
        description="Make a string URL, filename, and id safe: lowercased, hyphenated, and transliterated from Unicode."
      >
        <TransformPanel
          input={{
            label: "Your string to slugify",
            value: input,
            onChange: setInput,
            placeholder: "Put your string here (ex: My file path)",
            rows: 3,
          }}
          output={{ label: "Your slug", value: slug, mono: true, rows: 3 }}
        />
      </Panel>
    </ToolFrame>
  );
}
