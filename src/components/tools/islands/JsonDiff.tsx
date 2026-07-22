import { useCallback, useMemo, useState } from "react";

import {
  ToolCheck,
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
  areDeepEqual,
  diff,
  formatDiffValue,
  isValidJsonInput,
  parseJsonInput,
  type ArrayDifference,
  type Difference,
  type ObjectDifference,
} from "@/lib/tools/json-diff";

import "./JsonDiff.css";

export default function JsonDiff() {
  const [rawLeft, setRawLeft] = useState("");
  const [rawRight, setRawRight] = useState("");
  const [onlyShowDifferences, setOnlyShowDifferences] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");

  const leftInvalid = rawLeft !== "" && !isValidJsonInput(rawLeft);
  const rightInvalid = rawRight !== "" && !isValidJsonInput(rawRight);

  const leftJson = useMemo(
    () => (leftInvalid ? undefined : parseJsonInput(rawLeft)),
    [rawLeft, leftInvalid],
  );
  const rightJson = useMemo(
    () => (rightInvalid ? undefined : parseJsonInput(rawRight)),
    [rawRight, rightInvalid],
  );

  const showResults = leftJson !== undefined && rightJson !== undefined;
  const jsonAreTheSame = showResults && areDeepEqual(leftJson, rightJson);

  const result = useMemo(
    () =>
      showResults
        ? diff(leftJson, rightJson, { onlyShowDifferences })
        : null,
    [showResults, leftJson, rightJson, onlyShowDifferences],
  );

  const copyValue = useCallback(async (formatted: string) => {
    try {
      await copyTextToClipboard(formatted);
      setCopyStatus("Value copied.");
    } catch {
      setCopyStatus("Copy failed. Select the value and copy it manually.");
    }
  }, []);

  return (
    <ToolIsland className="jd-tool">
      <ToolPanel labelledBy="jd-heading" className="jd-tool__intro">
        <ToolSectionHeading
          title="JSON diff"
          titleId="jd-heading"
          description={
            <ToolHint>
              Paste two JSON documents to compare them. JSON5 syntax (unquoted
              keys, trailing commas) is accepted.
            </ToolHint>
          }
        />
      </ToolPanel>

      <ToolWorkspace className="jd-tool__inputs" stagger>
        <ToolPanel className="jd-tool__panel">
          <ToolTextarea
            id="jd-left"
            label="Your first JSON"
            full
            code
            rows={16}
            value={rawLeft}
            placeholder="Paste your first JSON here..."
            onChange={(event) => setRawLeft(event.target.value)}
            autoFocus
            aria-invalid={leftInvalid || undefined}
          />
          {leftInvalid ? (
            <ToolStatus tone="error" live="polite">
              Invalid JSON format
            </ToolStatus>
          ) : null}
        </ToolPanel>

        <ToolPanel className="jd-tool__panel">
          <ToolTextarea
            id="jd-right"
            label="Your JSON to compare"
            full
            code
            rows={16}
            value={rawRight}
            placeholder="Paste your JSON to compare here..."
            onChange={(event) => setRawRight(event.target.value)}
            aria-invalid={rightInvalid || undefined}
          />
          {rightInvalid ? (
            <ToolStatus tone="error" live="polite">
              Invalid JSON format
            </ToolStatus>
          ) : null}
        </ToolPanel>
      </ToolWorkspace>

      {showResults && result ? (
        <ToolPanel
          labelledBy="jd-result-heading"
          className="jd-tool__result"
          aria-live="polite"
        >
          <ToolSectionHeading
            title="Differences"
            titleId="jd-result-heading"
            description={
              <ToolHint>Click a highlighted value to copy it.</ToolHint>
            }
          />

          <ToolCheck
            id="jd-only-diff"
            label="Only show differences"
            toggle
            checked={onlyShowDifferences}
            onChange={(event) => setOnlyShowDifferences(event.target.checked)}
          />

          {jsonAreTheSame ? (
            <ToolStatus>The provided JSONs are the same</ToolStatus>
          ) : (
            <div className="jd-viewer" data-testid="diff-result">
              <ul>
                <DiffViewerNode
                  difference={result}
                  showKeys={false}
                  onCopy={copyValue}
                />
              </ul>
            </div>
          )}

          {copyStatus ? (
            <ToolStatus tone="success">{copyStatus}</ToolStatus>
          ) : null}
        </ToolPanel>
      ) : null}
    </ToolIsland>
  );
}

function DiffViewerNode({
  difference,
  showKeys = true,
  showChildrenKeys = true,
  onCopy,
}: {
  difference: Difference;
  showKeys?: boolean;
  showChildrenKeys?: boolean;
  onCopy: (formatted: string) => void;
}) {
  const { type, status } = difference;

  if (status === "updated") {
    return (
      <ComparisonViewer
        difference={difference}
        showKeys={showKeys}
        onCopy={onCopy}
      />
    );
  }

  if (type === "array") {
    return (
      <ChildrenViewer
        difference={difference}
        showKeys={showKeys}
        showChildrenKeys={false}
        openTag="["
        closeTag="]"
        onCopy={onCopy}
      />
    );
  }

  if (type === "object") {
    return (
      <ChildrenViewer
        difference={difference}
        showKeys={showKeys}
        showChildrenKeys={showChildrenKeys}
        openTag="{"
        closeTag="}"
        onCopy={onCopy}
      />
    );
  }

  return (
    <LineDiffViewer
      difference={difference}
      showKeys={showKeys}
      onCopy={onCopy}
    />
  );
}

function LineDiffViewer({
  difference,
  showKeys,
  onCopy,
}: {
  difference: Difference;
  showKeys?: boolean;
  onCopy: (formatted: string) => void;
}) {
  const { value, key, status, oldValue } = difference;
  const valueToDisplay = status === "removed" ? oldValue : value;

  return (
    <li>
      <span className={`jd-result ${status}`}>
        {showKeys ? (
          <>
            <span className="jd-key">{key}</span>
            {": "}
          </>
        ) : null}
        <DiffValue value={valueToDisplay} status={status} onCopy={onCopy} />
      </span>
      ,
    </li>
  );
}

function ComparisonViewer({
  difference,
  showKeys,
  onCopy,
}: {
  difference: Difference;
  showKeys?: boolean;
  onCopy: (formatted: string) => void;
}) {
  const { value, key, oldValue } = difference;

  return (
    <li className="jd-updated-line">
      {showKeys ? (
        <>
          <span className="jd-key">{key}</span>
          {": "}
        </>
      ) : null}
      <DiffValue value={oldValue} status="removed" onCopy={onCopy} />
      <DiffValue value={value} status="added" onCopy={onCopy} />,
    </li>
  );
}

function ChildrenViewer({
  difference,
  openTag,
  closeTag,
  showKeys,
  showChildrenKeys = true,
  onCopy,
}: {
  difference: ArrayDifference | ObjectDifference;
  showKeys: boolean;
  showChildrenKeys?: boolean;
  openTag: string;
  closeTag: string;
  onCopy: (formatted: string) => void;
}) {
  const { children, key, status, type } = difference;

  return (
    <li>
      <div className={`jd-${type} ${status}`}>
        {showKeys ? (
          <>
            <span className="jd-key">{key}</span>
            {": "}
          </>
        ) : null}
        {openTag}
        {children.length > 0 ? (
          <ul>
            {children.map((child, index) => (
              <DiffViewerNode
                key={`${String(child.key)}-${index}`}
                difference={child}
                showKeys={showChildrenKeys}
                onCopy={onCopy}
              />
            ))}
          </ul>
        ) : null}
        {`${closeTag},`}
      </div>
    </li>
  );
}

function DiffValue({
  value,
  status,
  onCopy,
}: {
  value: unknown;
  status: string;
  onCopy: (formatted: string) => void;
}) {
  const formatted = formatDiffValue(value);

  return (
    <button
      type="button"
      className={`jd-value ${status}`}
      onClick={() => onCopy(formatted)}
      title="Copy value"
    >
      {formatted}
    </button>
  );
}
