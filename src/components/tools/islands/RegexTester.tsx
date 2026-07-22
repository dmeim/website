import { useEffect, useMemo, useRef, useState } from "react";

import {
  ToolCheck,
  ToolEmpty,
  ToolFormGrid,
  ToolHint,
  ToolIsland,
  ToolNested,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
  ToolTextarea,
} from "@/components/tools/ui";
import {
  DEFAULT_FLAG_OPTIONS,
  DEFAULT_REGEX,
  DEFAULT_TEXT,
  buildRegexFlags,
  generateSample,
  getRegexValidationError,
  safeMatchRegex,
  type RegexFlagOptions,
  type RegexMatch,
} from "@/lib/tools/regex-tester";

import "./RegexTester.css";

export default function RegexTester() {
  const [regex, setRegex] = useState(DEFAULT_REGEX);
  const [text, setText] = useState(DEFAULT_TEXT);
  const [flags, setFlags] = useState<RegexFlagOptions>(DEFAULT_FLAG_OPTIONS);

  const validationError = useMemo(() => getRegexValidationError(regex), [regex]);
  const flagString = useMemo(() => buildRegexFlags(flags), [flags]);

  const results = useMemo(
    () =>
      validationError ? [] : safeMatchRegex(regex, text, flagString),
    [regex, text, flagString, validationError],
  );

  const sample = useMemo(
    () => (validationError ? "" : generateSample(regex)),
    [regex, validationError],
  );

  const setFlag = (key: keyof RegexFlagOptions, value: boolean) => {
    setFlags((current) => ({ ...current, [key]: value }));
  };

  return (
    <ToolIsland className="rt-tool">
      <ToolPanel labelledBy="rt-heading" className="rt-tool__panel">
        <ToolSectionHeading
          title="Regex"
          titleId="rt-heading"
          description={
            <ToolHint>
              Enter a JavaScript regular expression and text to match. Toggle
              flags below; matches update live.
            </ToolHint>
          }
        />

        <ToolTextarea
          id="rt-regex"
          label="Regex to test"
          full
          code
          rows={3}
          value={regex}
          placeholder="Put the regex to test"
          onChange={(event) => setRegex(event.target.value)}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          aria-invalid={validationError ? true : undefined}
        />

        {validationError ? (
          <ToolStatus tone="error" live="polite">
            Invalid regex: {validationError}
          </ToolStatus>
        ) : null}

        <ToolFormGrid className="rt-flags" exportLayout>
          <ToolCheck
            id="rt-flag-g"
            label={
              <>
                Global search (<code>g</code>)
              </>
            }
            title="Global search"
            checked={flags.global}
            onChange={(event) => setFlag("global", event.target.checked)}
          />
          <ToolCheck
            id="rt-flag-i"
            label={
              <>
                Case-insensitive (<code>i</code>)
              </>
            }
            title="Case-insensitive search"
            checked={flags.ignoreCase}
            onChange={(event) => setFlag("ignoreCase", event.target.checked)}
          />
          <ToolCheck
            id="rt-flag-m"
            label={
              <>
                Multiline (<code>m</code>)
              </>
            }
            title="Allows ^ and $ to match next to newline characters."
            checked={flags.multiline}
            onChange={(event) => setFlag("multiline", event.target.checked)}
          />
          <ToolCheck
            id="rt-flag-s"
            label={
              <>
                Singleline (<code>s</code>)
              </>
            }
            title="Allows . to match newline characters."
            checked={flags.dotAll}
            onChange={(event) => setFlag("dotAll", event.target.checked)}
          />
          <ToolCheck
            id="rt-flag-u"
            label={
              <>
                Unicode (<code>u</code>)
              </>
            }
            title="Unicode; treat a pattern as a sequence of Unicode code points."
            checked={flags.unicode}
            onChange={(event) => setFlag("unicode", event.target.checked)}
          />
          <ToolCheck
            id="rt-flag-v"
            label={
              <>
                Unicode Sets (<code>v</code>)
              </>
            }
            title="An upgrade to the u mode with more Unicode features."
            checked={flags.unicodeSets}
            onChange={(event) => setFlag("unicodeSets", event.target.checked)}
          />
        </ToolFormGrid>

        <ToolTextarea
          id="rt-text"
          label="Text to match"
          full
          code
          rows={5}
          value={text}
          placeholder="Put the text to match"
          onChange={(event) => setText(event.target.value)}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />

        {text && results.length > 0 ? (
          <MatchHighlight text={text} matches={results} />
        ) : null}
      </ToolPanel>

      <ToolPanel labelledBy="rt-matches-heading" className="rt-tool__panel">
        <ToolSectionHeading title="Matches" titleId="rt-matches-heading" />

        {results.length > 0 ? (
          <div className="rt-table-wrap">
            <table className="rt-table">
              <thead>
                <tr>
                  <th scope="col">Index in text</th>
                  <th scope="col">Value</th>
                  <th scope="col">Captures</th>
                  <th scope="col">Groups</th>
                </tr>
              </thead>
              <tbody>
                {results.map((match) => (
                  <tr key={`${match.index}:${match.value}`}>
                    <td>{match.index}</td>
                    <td className="rt-table__mono">{match.value}</td>
                    <td>
                      {match.captures.length > 0 ? (
                        <ul className="rt-capture-list">
                          {match.captures.map((capture) => (
                            <li key={capture.name}>
                              &quot;{capture.name}&quot; = {capture.value} [
                              {capture.start} - {capture.end}]
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="rt-muted">—</span>
                      )}
                    </td>
                    <td>
                      {match.groups.length > 0 ? (
                        <ul className="rt-capture-list">
                          {match.groups.map((group) => (
                            <li key={group.name}>
                              &quot;{group.name}&quot; = {group.value} [
                              {group.start} - {group.end}]
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="rt-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <ToolEmpty>No match</ToolEmpty>
        )}
      </ToolPanel>

      <ToolPanel labelledBy="rt-sample-heading" className="rt-tool__panel">
        <ToolNested title={<span id="rt-sample-heading">Sample matching text</span>}>
          <pre className="rt-sample tool-code" aria-live="polite">
            {sample || "—"}
          </pre>
        </ToolNested>
      </ToolPanel>

      <ToolPanel labelledBy="rt-diagram-heading" className="rt-tool__panel">
        <ToolNested title={<span id="rt-diagram-heading">Regex diagram</span>}>
          <RegexDiagram pattern={validationError ? "" : regex} />
        </ToolNested>
      </ToolPanel>
    </ToolIsland>
  );
}

function MatchHighlight({
  text,
  matches,
}: {
  text: string;
  matches: RegexMatch[];
}) {
  const segments = useMemo(() => {
    const sorted = [...matches].sort((a, b) => a.index - b.index);
    const parts: Array<{ text: string; matched: boolean }> = [];
    let cursor = 0;

    for (const match of sorted) {
      if (match.index < cursor) continue;
      if (match.index > cursor) {
        parts.push({ text: text.slice(cursor, match.index), matched: false });
      }
      parts.push({
        text: text.slice(match.index, match.index + match.value.length),
        matched: true,
      });
      cursor = match.index + match.value.length;
    }

    if (cursor < text.length) {
      parts.push({ text: text.slice(cursor), matched: false });
    }

    return parts;
  }, [text, matches]);

  return (
    <div className="rt-highlight" aria-live="polite">
      <span className="rt-highlight__label">Highlighted matches</span>
      <pre className="rt-highlight__body tool-code">
        {segments.map((segment, index) =>
          segment.matched ? (
            <mark key={index} className="rt-highlight__mark">
              {segment.text}
            </mark>
          ) : (
            <span key={index}>{segment.text}</span>
          ),
        )}
      </pre>
    </div>
  );
}

function RegexDiagram({ pattern }: { pattern: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });

    while (shadow.lastChild) {
      shadow.removeChild(shadow.lastChild);
    }

    if (!pattern) {
      return;
    }

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    void (async () => {
      try {
        const { render } = await import("@regexper/render");
        if (cancelled) return;
        await render(pattern, svg);
        if (cancelled) return;
        shadow.appendChild(svg);
      } catch {
        // Invalid patterns / render failures leave the diagram empty.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pattern]);

  return (
    <div
      ref={hostRef}
      className="rt-diagram"
      role="img"
      aria-label={pattern ? "Regular expression railroad diagram" : "No diagram"}
    />
  );
}
