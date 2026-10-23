import { useState } from "react";
import { OutputField, ReferenceList, ToolFrame, TransformPanel } from "@/ui/react/groups/composites";
import { List, ListRow, Panel } from "@/ui/react/groups/display";
import { Stack } from "@/ui/react/groups/layout";
import { ThemePair } from "./ThemePair";

const CODES = [
  { code: "200", label: "OK" },
  { code: "201", label: "Created" },
  { code: "301", label: "Moved Permanently" },
  { code: "404", label: "Not Found" },
  { code: "500", label: "Internal Server Error" },
];

function encode(text: string): { value: string; error?: string } {
  try {
    return { value: btoa(text) };
  } catch {
    return { value: "", error: "Only Latin-1 characters can be encoded in this demo." };
  }
}

function TransformDemo() {
  const [text, setText] = useState("Hello, world");
  const result = encode(text);
  return (
    <Panel title="Base64" description="Input to output with a built-in copy button">
      <TransformPanel
        input={{ label: "Text", value: text, onChange: setText, placeholder: "Type something" , rows: 3 }}
        output={{ label: "Base64", value: result.value, mono: true, rows: 3 }}
        error={result.error}
        swap={() => setText(result.value)}
        hint="Try typing an emoji to see the error state."
      />
    </Panel>
  );
}

function ReferenceDemo() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const rows = CODES.filter((c) => !q || `${c.code} ${c.label}`.toLowerCase().includes(q));
  return (
    <Panel title="Status codes">
      <ReferenceList
        searchLabel="Search status codes"
        query={query}
        onQueryChange={setQuery}
        count={rows.length}
        empty={{ icon: "magnifying-glass", title: "No matches", description: "Try a code like 404.", size: "sm" }}
      >
        <List divided density="compact">
          {rows.map((c) => <ListRow key={c.code} label={c.code} title={c.label} mono />)}
        </List>
      </ReferenceList>
    </Panel>
  );
}

export function CompositesShowcase() {
  return (
    <ThemePair>
      <Stack gap="lg">
        <h4 className="ui-showcase-sub">ToolFrame split + stagger</h4>
        <ToolFrame layout="split" stagger>
          <TransformDemo />
          <ReferenceDemo />
        </ToolFrame>
        <h4 className="ui-showcase-sub">OutputField</h4>
        <ToolFrame layout="single">
          <OutputField label="UUID" value="3f1c9a52-7d0e-4b8a-9c61-2e5f0d7b8a14" hint="Version 4, random" />
          <OutputField label="Public key" multiline rows={3} value={"-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE\n-----END PUBLIC KEY-----"} />
          <OutputField label="Empty" value="" placeholder="Generate a value first" error="Nothing generated yet" />
        </ToolFrame>
      </Stack>
    </ThemePair>
  );
}
