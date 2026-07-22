import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import {
  DEFAULT_URL,
  isValidUrl,
  parseUrl,
  type UrlPropertyKey,
} from "@/lib/tools/url-parser";

import "./UrlParser.css";

const EMPTY_PROPERTIES: { title: string; key: UrlPropertyKey; value: string }[] =
  [
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
  const [actionStatus, setActionStatus] = useState("");

  const invalid = !isValidUrl(urlInput);
  const parsed = useMemo(
    () => (invalid ? undefined : parseUrl(urlInput)),
    [urlInput, invalid],
  );
  const properties = parsed?.properties ?? EMPTY_PROPERTIES;

  const copyValue = useCallback(async (label: string, value: string) => {
    if (!value) {
      setActionStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(value);
      setActionStatus(`${label} copied.`);
    } catch {
      setActionStatus("Copy failed. Select the value and copy it manually.");
    }
  }, []);

  return (
    <ToolIsland className="urlp-tool">
      <ToolPanel labelledBy="urlp-heading" className="urlp-tool__panel">
        <ToolSectionHeading
          title="URL parser"
          titleId="urlp-heading"
          description={
            <ToolHint>
              Paste an absolute URL to split out protocol, credentials,
              host, port, path, and query parameters.
            </ToolHint>
          }
        />

        <ToolInput
          id="urlp-input"
          label="Your URL to parse"
          full
          value={urlInput}
          placeholder="Your URL to parse…"
          spellCheck={false}
          autoFocus
          onChange={(event) => setUrlInput(event.target.value)}
          aria-invalid={invalid || undefined}
        />

        {invalid ? (
          <ToolStatus tone="error" live="polite">
            Invalid URL
          </ToolStatus>
        ) : null}

        <div className="urlp-parts" role="list" aria-label="URL parts">
          {properties.map((property) => (
            <div key={property.key} className="urlp-part" role="listitem">
              <span className="urlp-part__label">{property.title}</span>
              <ToolInput
                id={`urlp-part-${property.key}`}
                label={property.title}
                full
                readOnly
                value={property.value}
                placeholder=" "
                className="urlp-part__value tool-code"
                aria-live="polite"
              />
              <ToolActionRow className="urlp-part__actions">
                <ToolButton
                  type="button"
                  onClick={() => void copyValue(property.title, property.value)}
                  disabled={!property.value}
                >
                  Copy
                </ToolButton>
              </ToolActionRow>
            </div>
          ))}
        </div>

        {parsed && parsed.searchParams.length > 0 ? (
          <div
            className="urlp-params"
            role="list"
            aria-label="Query parameters"
          >
            {parsed.searchParams.map((param) => (
              <div
                key={`${param.key}=${param.value}`}
                className="urlp-param"
                role="listitem"
              >
                <span className="urlp-param__indent" aria-hidden="true">
                  ↳
                </span>
                <ToolInput
                  id={`urlp-param-key-${param.key}`}
                  label={`Param key ${param.key}`}
                  full
                  readOnly
                  value={param.key}
                  className="urlp-param__value tool-code"
                />
                <ToolActionRow className="urlp-part__actions">
                  <ToolButton
                    type="button"
                    onClick={() => void copyValue(`Key ${param.key}`, param.key)}
                    disabled={!param.key}
                  >
                    Copy
                  </ToolButton>
                </ToolActionRow>
                <ToolInput
                  id={`urlp-param-value-${param.key}`}
                  label={`Param value for ${param.key}`}
                  full
                  readOnly
                  value={param.value}
                  className="urlp-param__value tool-code"
                />
                <ToolActionRow className="urlp-part__actions">
                  <ToolButton
                    type="button"
                    onClick={() =>
                      void copyValue(`Value of ${param.key}`, param.value)
                    }
                    disabled={!param.value}
                  >
                    Copy
                  </ToolButton>
                </ToolActionRow>
              </div>
            ))}
          </div>
        ) : null}

        {actionStatus ? (
          <ToolStatus tone="success">{actionStatus}</ToolStatus>
        ) : null}
      </ToolPanel>
    </ToolIsland>
  );
}
