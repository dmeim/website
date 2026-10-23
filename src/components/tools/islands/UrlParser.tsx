import { useMemo, useState } from "react";

import { Input, KeyValue, Notice, Panel, SectionHeading, ToolFrame } from "@/ui/react";
import {
  DEFAULT_URL,
  isValidUrl,
  parseUrl,
  type UrlPropertyKey,
} from "@/lib/tools/url-parser";

const EMPTY_PROPERTIES: { title: string; key: UrlPropertyKey; value: string }[] = [
  { title: "Protocol", key: "protocol", value: "" },
  { title: "Username", key: "username", value: "" },
  { title: "Password", key: "password", value: "" },
  { title: "Hostname", key: "hostname", value: "" },
  { title: "Port", key: "port", value: "" },
  { title: "Path", key: "pathname", value: "" },
  { title: "Params", key: "search", value: "" },
];

export default function UrlParser() {
  const [urlInput, setUrlInput] = useState(DEFAULT_URL);

  const invalid = !isValidUrl(urlInput);
  const parsed = useMemo(() => (invalid ? undefined : parseUrl(urlInput)), [urlInput, invalid]);
  const properties = parsed?.properties ?? EMPTY_PROPERTIES;

  return (
    <ToolFrame>
      <Panel
        title="URL parser"
        titleId="urlp-heading"
        description="Paste an absolute URL to split out protocol, credentials, host, port, path, and query parameters."
      >
        <Input
          id="urlp-input"
          label="Your URL to parse"
          mono
          value={urlInput}
          placeholder="Your URL to parse…"
          spellCheck={false}
          autoFocus
          onChange={(event) => setUrlInput(event.target.value)}
          aria-invalid={invalid || undefined}
        />

        {invalid ? (
          <Notice tone="danger" live="polite">
            Invalid URL
          </Notice>
        ) : null}

        <KeyValue
          aria-label="URL parts"
          aria-live="polite"
          items={properties.map((property) => ({
            label: property.title,
            value: property.value || "—",
            mono: true,
            tone: property.value ? "default" : "muted",
            copy: property.value ? property.value : false,
          }))}
        />

        {parsed && parsed.searchParams.length > 0 ? (
          <section aria-labelledby="urlp-params-heading">
            <SectionHeading title="Query parameters" titleId="urlp-params-heading" level={3} />
            <KeyValue
              aria-label="Query parameters"
              items={parsed.searchParams.map((param) => ({
                label: param.key,
                value: param.value || "—",
                mono: true,
                tone: param.value ? "default" : "muted",
                copy: param.value ? param.value : false,
              }))}
            />
          </section>
        ) : null}
      </Panel>
    </ToolFrame>
  );
}
