import { useMemo, useState } from "react";

import { CopyButton, Input, KeyValue, Notice, Panel, SectionHeading, Table, ToolFrame } from "@/ui/react";
import {
  DEFAULT_URL,
  isValidUrl,
  parseUrl,
  type UrlPropertyKey,
} from "@/lib/tools/url-parser";

import "./UrlParser.css";

const EMPTY_PROPERTIES: { title: string; key: UrlPropertyKey; value: string }[] = [
  { title: "Protocol", key: "protocol", value: "" },
  { title: "Username", key: "username", value: "" },
  { title: "Password", key: "password", value: "" },
  { title: "Hostname", key: "hostname", value: "" },
  { title: "Port", key: "port", value: "" },
  { title: "Path", key: "pathname", value: "" },
  { title: "Params", key: "search", value: "" },
  { title: "Hash", key: "hash", value: "" },
];

function ParamCell({ text, label }: { text: string; label: string }) {
  return (
    <td>
      <code>{text || "–"}</code>{" "}
      {text ? <CopyButton appearance="icon" size="sm" value={text} label={label} /> : null}
    </td>
  );
}

export default function UrlParser() {
  const [urlInput, setUrlInput] = useState(DEFAULT_URL);

  const invalid = urlInput.trim() !== "" && !isValidUrl(urlInput);
  const parsed = useMemo(() => parseUrl(urlInput), [urlInput]);
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
            This is not a valid URL. Enter a full address that includes the protocol, such as https://example.com.
          </Notice>
        ) : null}

        <KeyValue
          aria-label="URL parts"
          aria-live="polite"
          items={properties.map((property) => ({
            label: property.title,
            value: property.value || "–",
            mono: true,
            tone: property.value ? "default" : "muted",
            copy: property.value ? property.value : false,
          }))}
        />

        {parsed && parsed.searchParams.length > 0 ? (
          <section className="urlp-params" aria-labelledby="urlp-params-heading">
            <SectionHeading title="Query parameters" titleId="urlp-params-heading" level={3} />
            <Table caption="Query parameters" captionHidden density="compact">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Value</th>
                </tr>
              </thead>
              <tbody>
                {parsed.searchParams.map((param, index) => (
                  <tr key={`${param.key}-${index}`}>
                    <ParamCell text={param.key} label={`Copy parameter name ${param.key}`} />
                    <ParamCell text={param.value} label={`Copy value of ${param.key}`} />
                  </tr>
                ))}
              </tbody>
            </Table>
          </section>
        ) : null}
      </Panel>
    </ToolFrame>
  );
}
