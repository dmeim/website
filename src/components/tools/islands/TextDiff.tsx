import { useCallback, useMemo, useState } from "react";

import { Button, ButtonGroup, CopyButton, FormGrid, Notice, Panel, Textarea, ToolFrame } from "@/ui/react";
import {
  DEFAULT_MODIFIED,
  DEFAULT_ORIGINAL,
  buildDiffRows,
  formatUnifiedDiff,
  textsAreEqual,
  type CharPart,
  type DiffRow,
} from "@/lib/tools/text-diff";

import "./TextDiff.css";

export default function TextDiff() {
  const [original, setOriginal] = useState(DEFAULT_ORIGINAL);
  const [modified, setModified] = useState(DEFAULT_MODIFIED);
  const [actionStatus, setActionStatus] = useState("");

  const equal = textsAreEqual(original, modified);
  const rows = useMemo(
    () => buildDiffRows(original, modified),
    [original, modified],
  );
  const unified = useMemo(
    () => formatUnifiedDiff(original, modified),
    [original, modified],
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
            onChange={(event) => setOriginal(event.target.value)}
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
            onChange={(event) => setModified(event.target.value)}
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
          <Notice tone="neutral">The two texts are identical.</Notice>
        ) : (
          <div className="text-diff-viewer" data-testid="text-diff-result" role="table" aria-label="Side-by-side text differences">
            <div className="text-diff-viewer__header" role="row">
              <span role="columnheader">Original</span>
              <span role="columnheader">Modified</span>
            </div>
            {rows.map((row, index) => (
              <DiffRowView key={`${row.type}-${index}`} row={row} index={index} />
            ))}
          </div>
        )}

        {actionStatus ? <Notice tone="success">{actionStatus}</Notice> : null}
      </Panel>
    </ToolFrame>
  );
}

function DiffRowView({ row, index }: { row: DiffRow; index: number }) {
  const lineNo = index + 1;

  if (row.type === "unchanged") {
    return (
      <div className="text-diff-row text-diff-row--unchanged" role="row">
        <div className="text-diff-cell" role="cell">
          <span className="text-diff-gutter" aria-hidden="true">
            {lineNo}
          </span>
          <code>{row.left}</code>
        </div>
        <div className="text-diff-cell" role="cell">
          <span className="text-diff-gutter" aria-hidden="true">
            {lineNo}
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
