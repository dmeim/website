import { useEffect, useMemo, useRef, useState } from "react";

import { useQueryState } from "@/components/tools/use-persisted-state";
import { Checkbox, CodeBlock, EmptyState, FormGrid, Link, Notice, Panel, Table, Textarea, ToolFrame } from "@/ui/react";
import {
  DEFAULT_FLAG_OPTIONS,
  DEFAULT_REGEX,
  DEFAULT_TEXT,
  MAX_MATCHES,
  buildRegexFlags,
  getRegexValidationError,
  type GroupCapture,
  type RegexFlagOptions,
  type RegexMatch,
} from "@/lib/tools/regex-tester";
import { useRegexRun } from "@/lib/tools/regex-tester/use-regex-run";

import "./RegexTester.css";

function formatCapture({ name, value, start, end }: GroupCapture): string {
  return value === null ? `"${name}" did not match` : `"${name}" = ${value} [${start} - ${end}]`;
}

export default function RegexTester() {
  const [regex, setRegex] = useQueryState<string>("regex", DEFAULT_REGEX);
  const [text, setText] = useState(DEFAULT_TEXT);
  const [flags, setFlags] = useState<RegexFlagOptions>(DEFAULT_FLAG_OPTIONS);

  const flagString = useMemo(() => buildRegexFlags(flags), [flags]);
  const validationError = useMemo(() => getRegexValidationError(regex, flagString), [regex, flagString]);

  const request = useMemo(
    () => (validationError || regex === "" ? null : { regex, text, flags: flagString }),
    [regex, text, flagString, validationError],
  );
  const { result, timedOut } = useRegexRun(request);
  const results = result.matches;
  const sample = result.sample;

  const setFlag = (key: keyof RegexFlagOptions, value: boolean) => {
    setFlags((current) => ({
      ...current,
      [key]: value,
      // JavaScript rejects u and v together, so turning one on turns the other off.
      ...(key === "unicode" && value ? { unicodeSets: false } : {}),
      ...(key === "unicodeSets" && value ? { unicode: false } : {}),
    }));
  };

  return (
    <ToolFrame>
      <Panel
        title="Regex"
        titleId="rt-heading"
        description={
          <>
            Enter a JavaScript regular expression and text to match. Toggle flags below; matches update live. See the{" "}
            <Link href="/tools/regex-memo">Regular Expression Cheatsheet</Link>.
          </>
        }
      >

        <Textarea
          id="rt-regex"
          label="Regex to test"
          mono
          rows={3}
          value={regex}
          placeholder="Put the regex to test"
          onChange={(event) => setRegex(event.target.value)}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          error={validationError ? `Invalid regex: ${validationError}` : undefined}
        />

        <FormGrid columns="auto" className="rt-flags">
          <Checkbox
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
          <Checkbox
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
          <Checkbox
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
          <Checkbox
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
          <Checkbox
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
          <Checkbox
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
          <Checkbox
            id="rt-flag-y"
            label={
              <>
                Sticky (<code>y</code>)
              </>
            }
            title="Matches only at the position right after the previous match, starting from the beginning of the text."
            checked={flags.sticky}
            onChange={(event) => setFlag("sticky", event.target.checked)}
          />
        </FormGrid>

        <Textarea
          id="rt-text"
          label="Text to match"
          mono
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
      </Panel>

      <Panel title="Matches" titleId="rt-matches-heading">
        {timedOut ? (
          <Notice tone="warning" live="polite">
            This pattern took too long and was stopped. Nested quantifiers like <code>(a+)+</code> can backtrack
            endlessly, so try simplifying it or shortening the text.
          </Notice>
        ) : null}
        {results.length >= MAX_MATCHES ? (
          <Notice tone="info" live="polite">
            Showing the first {MAX_MATCHES.toLocaleString("en-US")} matches.
          </Notice>
        ) : null}
        {results.length > 0 ? (
          <Table caption="Regex matches" captionHidden density="compact" className="rt-table">
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
                  <td className="rt-table__mono">{match.index}</td>
                  <td className="rt-table__mono">{match.value}</td>
                  <td>
                    {match.captures.length > 0 ? (
                      <ul className="rt-capture-list">
                        {match.captures.map((capture) => (
                          <li key={capture.name}>
                            {formatCapture(capture)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="rt-muted">–</span>
                    )}
                  </td>
                  <td>
                    {match.groups.length > 0 ? (
                      <ul className="rt-capture-list">
                        {match.groups.map((group) => (
                          <li key={group.name}>
                            {formatCapture(group)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="rt-muted">–</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : timedOut ? null : (
          <EmptyState size="sm" icon="magnifying-glass" title="No match" />
        )}
      </Panel>

      <Panel title="Sample matching text" titleId="rt-sample-heading">
        <CodeBlock code={sample || "–"} copy={Boolean(sample)} wrap aria-live="polite" />
      </Panel>

      <Panel title="Regex diagram" titleId="rt-diagram-heading">
        <RegexDiagram pattern={validationError ? "" : regex} />
      </Panel>
    </ToolFrame>
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
      <pre className="rt-highlight__body">
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
