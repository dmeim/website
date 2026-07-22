import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolCheck,
  ToolFormGrid,
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolNested,
  ToolPanel,
  ToolSectionHeading,
  ToolSelect,
  ToolStatus,
  ToolTextarea,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import {
  DEFAULT_CONVERT_OPTIONS,
  convertList,
  type ConvertOptions,
  type SortOrder,
} from "@/lib/tools/list-converter";

import "./ListConverter.css";

export default function ListConverter() {
  const [input, setInput] = useState("");
  const [options, setOptions] = useState<ConvertOptions>(DEFAULT_CONVERT_OPTIONS);
  const [actionStatus, setActionStatus] = useState("");

  const output = useMemo(() => convertList(input, options), [input, options]);

  const patchOptions = useCallback((patch: Partial<ConvertOptions>) => {
    setOptions((prev) => ({ ...prev, ...patch }));
  }, []);

  const copyOutput = useCallback(async () => {
    if (!output) {
      setActionStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(output);
      setActionStatus("Transformed list copied.");
    } catch {
      setActionStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [output]);

  return (
    <ToolIsland className="lc-tool">
      <ToolPanel labelledBy="lc-heading" className="lc-tool__panel">
        <ToolSectionHeading
          title="List converter"
          titleId="lc-heading"
          description={
            <ToolHint>
              Paste a newline-separated list, then trim, dedupe, sort, wrap, and
              join it live in the browser.
            </ToolHint>
          }
        />

        <ToolFormGrid className="lc-toggles">
          <ToolCheck
            id="lc-trim"
            label="Trim list items"
            toggle
            checked={options.trimItems}
            onChange={(event) => patchOptions({ trimItems: event.target.checked })}
          />
          <ToolCheck
            id="lc-dedupe"
            label="Remove duplicates"
            toggle
            checked={options.removeDuplicates}
            onChange={(event) =>
              patchOptions({ removeDuplicates: event.target.checked })
            }
          />
          <ToolCheck
            id="lc-lower"
            label="Convert to lowercase"
            toggle
            checked={options.lowerCase}
            onChange={(event) => patchOptions({ lowerCase: event.target.checked })}
          />
          <ToolCheck
            id="lc-breaks"
            label="Keep line breaks"
            toggle
            checked={options.keepLineBreaks}
            onChange={(event) =>
              patchOptions({ keepLineBreaks: event.target.checked })
            }
          />
          <ToolCheck
            id="lc-reverse"
            label="Reverse list"
            toggle
            checked={options.reverseList}
            onChange={(event) => {
              const reverseList = event.target.checked;
              patchOptions({
                reverseList,
                ...(reverseList ? { sortList: null } : {}),
              });
            }}
          />
        </ToolFormGrid>

        <ToolFormGrid>
          <ToolSelect
            id="lc-sort"
            label="Sort list"
            full
            value={options.sortList ?? ""}
            disabled={options.reverseList}
            onChange={(event) => {
              const raw = event.target.value;
              const sortList: SortOrder =
                raw === "asc" || raw === "desc" ? raw : null;
              patchOptions({ sortList });
            }}
          >
            <option value="">Sort alphabetically</option>
            <option value="asc">Sort ascending</option>
            <option value="desc">Sort descending</option>
          </ToolSelect>

          <ToolInput
            id="lc-separator"
            label="Separator"
            full
            value={options.separator}
            placeholder=","
            onChange={(event) => patchOptions({ separator: event.target.value })}
          />
        </ToolFormGrid>

        <ToolNested title="Wrap item">
          <ToolFormGrid>
            <ToolInput
              id="lc-item-prefix"
              label="Item prefix"
              full
              value={options.itemPrefix}
              placeholder="Item prefix"
              onChange={(event) =>
                patchOptions({ itemPrefix: event.target.value })
              }
            />
            <ToolInput
              id="lc-item-suffix"
              label="Item suffix"
              full
              value={options.itemSuffix}
              placeholder="Item suffix"
              onChange={(event) =>
                patchOptions({ itemSuffix: event.target.value })
              }
            />
          </ToolFormGrid>
        </ToolNested>

        <ToolNested title="Wrap list">
          <ToolFormGrid>
            <ToolInput
              id="lc-list-prefix"
              label="List prefix"
              full
              value={options.listPrefix}
              placeholder="List prefix"
              onChange={(event) =>
                patchOptions({ listPrefix: event.target.value })
              }
            />
            <ToolInput
              id="lc-list-suffix"
              label="List suffix"
              full
              value={options.listSuffix}
              placeholder="List suffix"
              onChange={(event) =>
                patchOptions({ listSuffix: event.target.value })
              }
            />
          </ToolFormGrid>
        </ToolNested>

        <ToolTextarea
          id="lc-input"
          label="Your input data"
          full
          code
          rows={8}
          value={input}
          placeholder="Paste your input data here..."
          spellCheck={false}
          autoFocus
          onChange={(event) => setInput(event.target.value)}
        />

        <ToolTextarea
          id="lc-output"
          label="Your transformed data"
          full
          code
          readOnly
          rows={8}
          value={output}
          placeholder="Transformed list will appear here…"
          className="lc-output"
          aria-live="polite"
        />

        <ToolActionRow>
          <ToolButton
            type="button"
            onClick={() => void copyOutput()}
            disabled={!output}
          >
            Copy
          </ToolButton>
        </ToolActionRow>

        {actionStatus ? (
          <ToolStatus tone="success">{actionStatus}</ToolStatus>
        ) : null}
      </ToolPanel>
    </ToolIsland>
  );
}
