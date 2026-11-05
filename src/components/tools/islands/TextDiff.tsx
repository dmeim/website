import { useCallback, useDeferredValue, useMemo, useState } from "react";

import { Button, ButtonGroup, CopyButton, FormGrid, Notice, Panel, Textarea, ToolFrame } from "@/ui/react";
import {
  DEFAULT_MODIFIED,
  DEFAULT_ORIGINAL,
  buildDiffRows,
  formatUnifiedDiff,
  numberDiffRows,
  textsAreEqual,
  type CharPart,
  type DiffRow,
} from "@/lib/tools/text-diff";

import "./TextDiff.css";

/** Rendering every row of a huge diff would freeze the page. */
const MAX_VISIBLE_ROWS = 2000;

export default function TextDiff() {
  const [original, setOriginal] = useState(DEFAULT_ORIGINAL);
  const [modified, setModified] = useState(DEFAULT_MODIFIED);
  const [actionStatus, setActionStatus] = useState("");

  // Deferred so typing stays smooth when a large diff takes a moment to compute.
  const deferredOriginal = useDeferredValue(original);
  const deferredModified = useDeferredValue(modified);

  const equal = textsAreEqual(deferredOriginal, deferredModified);
  const rows = useMemo(
    () => buildDiffRows(deferredOriginal, deferredModified),
    [deferredOriginal, deferredModified],
  );
  const lineNumbers = useMemo(() => numberDiffRows(rows), [rows]);
  const shownRows = rows.slice(0, MAX_VISIBLE_ROWS);
  const unified = useMemo(
    () => formatUnifiedDiff(deferredOriginal, deferredModified),
    [deferredOriginal, deferredModified],
  );

  const swap = useCallback(() => {
    setOriginal(modified);
    setModified(original);
    setActionStatus("Panes swapped.");
  }, [original, modified]);

  const reset = useCallback(() => {
    setOriginal(DEFAULT_ORIGINAL);
    setModified(DEFAULT_MODIFIED);
    setActionStatus("Reset to defaults.");
  }, []);

  return (
    <ToolFrame>
      <Panel
        title="Text diff"
        titleId="text-diff-heading"
        description="Compare two texts side by side. Edit either pane and the differences update live, with line and character highlighting."
      >
        <FormGrid columns={2}>
          <Textarea
            id="text-diff-original"
            label="Original"
            mono
            rows={12}
            value={original}
            placeholder="Original text"
            onChange={(event) => {
              setOriginal(event.target.value);
              setActionStatus("");
            }}
            autoFocus
            spellCheck={false}
          />
          <Textarea
            id="text-diff-modified"
            label="Modified"
            mono
            rows={12}
            value={modified}
            placeholder="Modified text"
            onChange={(event) => {
              setModified(event.target.value);
              setActionStatus("");
            }}
            spellCheck={false}
          />
        </FormGrid>
      </Panel>

      <Panel
        title="Differences"
        titleId="text-diff-result-heading"
        description="Green marks additions, red marks removals. Modified lines show character-level changes."
        aria-live="polite"
        actions={
          <ButtonGroup>
            <CopyButton value={unified} label="Copy unified diff" disabled={!unified || equal} size="sm" />
            <Button variant="ghost" size="sm" iconStart="arrows-left-right" onClick={swap}>
              Swap
            </Button>
            <Button variant="ghost" size="sm" iconStart="arrows-clockwise" onClick={reset}>
              Reset
            </Button>
          </ButtonGroup>
        }
      >
        {equal ? (
          <Notice tone="neutral">
            {deferredOriginal ? "The two texts are identical." : "Enter text in either pane to compare."}
          </Notice>
        ) : (
          <div className="text-diff-viewer" data-testid="text-diff-result" role="table" aria-label="Side-by-side text differences">
            <div className="text-diff-viewer__header" role="row">
              <span role="columnheader">Original</span>
              <span role="columnheader">Modified</span>
            </div>
            {shownRows.map((row, index) => (
              <DiffRowView key={`${row.type}-${index}`} row={row} lines={lineNumbers[index]!} />
            ))}
          </div>
        )}

        {!equal && rows.length > MAX_VISIBLE_ROWS ? (
          <Notice tone="neutral">
            Showing the first {MAX_VISIBLE_ROWS.toLocaleString()} of {rows.length.toLocaleString()} rows. Copy the
            unified diff to get all of them.
          </Notice>
        ) : null}

        {actionStatus ? <Notice tone="success">{actionStatus}</Notice> : null}
      </Panel>
    </ToolFrame>
  );
}

function DiffRowView({ row, lines }: { row: DiffRow; lines: { left: number; right: number } }) {
  if (row.type === "unchanged") {
    return (
      <div className="text-diff-row text-diff-row--unchanged" role="row">
        <div className="text-diff-cell" role="cell">
          <span className="text-diff-gutter" aria-hidden="true">
            {lines.left}
          </span>
          <code>{row.left}</code>
        </div>
        <div className="text-diff-cell" role="cell">
          <span className="text-diff-gutter" aria-hidden="true">
            {lines.right}
          </span>
          <code>{row.right}</code>
        </div>
      </div>
    );
  }

  if (row.type === "removed") {
    return (
      <div className="text-diff-row text-diff-row--removed" role="row">
        <div className="text-diff-cell text-diff-cell--removed" role="cell">
          <span className="text-diff-gutter" aria-hidden="true">
            −
          </span>
          <code>{row.left}</code>
        </div>
        <div className="text-diff-cell text-diff-cell--empty" role="cell">
          <span className="text-diff-gutter" aria-hidden="true" />
          <code />
        </div>
      </div>
    );
  }

  if (row.type === "added") {
    return (
      <div className="text-diff-row text-diff-row--added" role="row">
        <div className="text-diff-cell text-diff-cell--empty" role="cell">
          <span className="text-diff-gutter" aria-hidden="true" />
          <code />
        </div>
        <div className="text-diff-cell text-diff-cell--added" role="cell">
          <span className="text-diff-gutter" aria-hidden="true">
            +
          </span>
          <code>{row.right}</code>
        </div>
      </div>
    );
  }

  return (
    <div className="text-diff-row text-diff-row--modified" role="row">
      <div className="text-diff-cell text-diff-cell--removed" role="cell">
        <span className="text-diff-gutter" aria-hidden="true">
          ~
        </span>
        <code>
          <CharParts parts={row.leftParts} />
        </code>
      </div>
      <div className="text-diff-cell text-diff-cell--added" role="cell">
        <span className="text-diff-gutter" aria-hidden="true">
          ~
        </span>
        <code>
          <CharParts parts={row.rightParts} />
        </code>
      </div>
    </div>
  );
}

function CharParts({ parts }: { parts: CharPart[] }) {
  return (
    <>
      {parts.map((part, index) =>
        part.kind === "unchanged" ? (
          <span key={index}>{part.value}</span>
        ) : (
          <mark
            key={index}
            className={
              part.kind === "added"
                ? "text-diff-mark text-diff-mark--added"
                : "text-diff-mark text-diff-mark--removed"
            }
          >
            {part.value}
          </mark>
        ),
      )}
    </>
  );
}
