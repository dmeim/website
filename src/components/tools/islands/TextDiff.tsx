import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolHint,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
  ToolTextarea,
  ToolWorkspace,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
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

  const copyUnified = useCallback(async () => {
    if (!unified) {
      setActionStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(unified);
      setActionStatus("Unified diff copied.");
    } catch {
      setActionStatus("Copy failed. Select the diff and copy it manually.");
    }
  }, [unified]);

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
    <ToolIsland className="text-diff-tool">
      <ToolPanel labelledBy="text-diff-heading" className="text-diff-tool__intro">
        <ToolSectionHeading
          title="Text diff"
          titleId="text-diff-heading"
          description={
            <ToolHint>
              Compare two texts side by side. Edit either pane — differences
              update live with line and character highlighting.
            </ToolHint>
          }
        />
      </ToolPanel>

      <ToolWorkspace className="text-diff-tool__inputs" stagger>
        <ToolPanel className="text-diff-tool__panel">
          <ToolTextarea
            id="text-diff-original"
            label="Original"
            full
            code
            rows={12}
            value={original}
            placeholder="Original text"
            onChange={(event) => setOriginal(event.target.value)}
            autoFocus
            spellCheck={false}
          />
        </ToolPanel>

        <ToolPanel className="text-diff-tool__panel">
          <ToolTextarea
            id="text-diff-modified"
            label="Modified"
            full
            code
            rows={12}
            value={modified}
            placeholder="Modified text"
            onChange={(event) => setModified(event.target.value)}
            spellCheck={false}
          />
        </ToolPanel>
      </ToolWorkspace>

      <ToolPanel
        labelledBy="text-diff-result-heading"
        className="text-diff-tool__result"
        aria-live="polite"
      >
        <ToolSectionHeading
          title="Differences"
          titleId="text-diff-result-heading"
          description={
            <ToolHint>
              Green marks additions, red marks removals. Modified lines show
              character-level changes.
            </ToolHint>
          }
        />

        <ToolActionRow>
          <ToolButton
            type="button"
            onClick={() => void copyUnified()}
            disabled={!unified || equal}
          >
            Copy unified diff
          </ToolButton>
          <ToolButton type="button" variant="ghost" onClick={swap}>
            Swap
          </ToolButton>
          <ToolButton type="button" variant="ghost" onClick={reset}>
            Reset
          </ToolButton>
        </ToolActionRow>

        {equal ? (
          <ToolStatus>The two texts are identical.</ToolStatus>
        ) : (
          <div
            className="text-diff-viewer"
            data-testid="text-diff-result"
            role="table"
            aria-label="Side-by-side text differences"
          >
            <div className="text-diff-viewer__header" role="row">
              <span role="columnheader">Original</span>
              <span role="columnheader">Modified</span>
            </div>
            {rows.map((row, index) => (
              <DiffRowView key={`${row.type}-${index}`} row={row} index={index} />
            ))}
          </div>
        )}

        {actionStatus ? (
          <ToolStatus tone="success">{actionStatus}</ToolStatus>
        ) : null}
      </ToolPanel>
    </ToolIsland>
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
