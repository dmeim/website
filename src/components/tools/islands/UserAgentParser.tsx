import { useEffect, useMemo, useState } from "react";

import {
  ToolHint,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolTextarea,
  ToolWorkspace,
} from "@/components/tools/ui";
import {
  buildUserAgentSections,
  parseUserAgent,
  type UserAgentSection,
} from "@/lib/tools/user-agent-parser";

import "./UserAgentParser.css";

export default function UserAgentParser() {
  const [ua, setUa] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setUa(navigator.userAgent);
    setHydrated(true);
  }, []);

  const sections = useMemo(
    () => buildUserAgentSections(parseUserAgent(ua)),
    [ua],
  );

  return (
    <ToolIsland className="uap-tool">
      <ToolPanel labelledBy="uap-heading" className="uap-tool__panel">
        <ToolSectionHeading
          title="User-agent parser"
          titleId="uap-heading"
          description={
            <ToolHint>
              Paste a user-agent string to detect browser, engine, OS, device,
              and CPU details.
            </ToolHint>
          }
        />

        <ToolTextarea
          id="uap-input"
          label="User agent string"
          full
          code
          rows={3}
          value={ua}
          placeholder="Put your user-agent here…"
          spellCheck={false}
          autoFocus
          onChange={(event) => setUa(event.target.value)}
        />
      </ToolPanel>

      {hydrated || ua.trim().length > 0 ? (
        <ResultCards sections={sections} />
      ) : (
        <ToolPanel labelledBy="uap-heading" className="uap-tool__panel">
          <p className="uap-loading">Reading current user agent…</p>
        </ToolPanel>
      )}
    </ToolIsland>
  );
}

function ResultCards({ sections }: { sections: UserAgentSection[] }) {
  return (
    <ToolWorkspace className="uap-results" stagger>
      {sections.map((section) => {
        const known = section.fields.filter((f) => f.value != null && f.value !== "");
        const missing = section.fields.filter(
          (f) => f.value == null || f.value === "",
        );

        return (
          <ToolPanel
            key={section.heading}
            labelledBy={`uap-${section.heading.toLowerCase()}-heading`}
            className="uap-card"
          >
            <h2
              id={`uap-${section.heading.toLowerCase()}-heading`}
              className="uap-card__title"
            >
              {section.heading}
            </h2>

            {known.length > 0 ? (
              <ul className="uap-tags" aria-label={`${section.heading} values`}>
                {known.map((field) => (
                  <li key={field.label}>
                    <span className="uap-tag" title={field.label}>
                      {field.value}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            {missing.length > 0 ? (
              <ul className="uap-fallbacks" aria-label={`${section.heading} missing`}>
                {missing.map((field) => (
                  <li key={field.label} className="uap-fallback">
                    {field.fallback}
                  </li>
                ))}
              </ul>
            ) : null}
          </ToolPanel>
        );
      })}
    </ToolWorkspace>
  );
}
