import { useEffect, useMemo, useState } from "react";

import { Badge, Card, Panel, Textarea, ToolFrame } from "@/ui/react";
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
    <ToolFrame>
      <Panel
        title="User-agent parser"
        titleId="uap-heading"
        description="Paste a user-agent string to detect browser, engine, OS, device, and CPU details."
      >
        <Textarea
          id="uap-input"
          label="User agent string"
          mono
          rows={3}
          value={ua}
          placeholder="Put your user-agent here…"
          spellCheck={false}
          autoFocus
          onChange={(event) => setUa(event.target.value)}
        />
      </Panel>

      <Panel title="Detected" titleId="uap-results-heading">
        {hydrated || ua.trim().length > 0 ? (
          <ResultCards sections={sections} />
        ) : (
          <p aria-busy="true">Reading current user agent…</p>
        )}
      </Panel>
    </ToolFrame>
  );
}

function ResultCards({ sections }: { sections: UserAgentSection[] }) {
  return (
    <div className="uap-results">
      {sections.map((section) => {
        const known = section.fields.filter((f) => f.value != null && f.value !== "");
        const missing = section.fields.filter(
          (f) => f.value == null || f.value === "",
        );
        const headingId = `uap-${section.heading.toLowerCase()}-heading`;

        return (
          <Card key={section.heading} as="section" aria-labelledby={headingId}>
            <h3 id={headingId} className="uap-card__title">
              {section.heading}
            </h3>

            {known.length > 0 ? (
              <ul className="uap-tags" aria-label={`${section.heading} values`}>
                {known.map((field) => (
                  <li key={field.label}>
                    <Badge title={field.label}>{field.value}</Badge>
                  </li>
                ))}
              </ul>
            ) : null}

            {missing.length > 0 ? (
              <ul className="uap-fallbacks" aria-label={`${section.heading} missing`}>
                {missing.map((field) => (
                  <li key={field.label}>{field.fallback}</li>
                ))}
              </ul>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
