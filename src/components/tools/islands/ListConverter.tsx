import { useCallback, useMemo, useState } from "react";

import {
  Fieldset,
  FormGrid,
  Input,
  Panel,
  Select,
  Switch,
  ToolFrame,
  TransformPanel,
} from "@/ui/react";
import {
  DEFAULT_CONVERT_OPTIONS,
  convertList,
  type ConvertOptions,
  type SortOrder,
} from "@/lib/tools/list-converter";

const SORT_OPTIONS = [
  { value: "", label: "Sort alphabetically" },
  { value: "asc", label: "Sort ascending" },
  { value: "desc", label: "Sort descending" },
];

export default function ListConverter() {
  const [input, setInput] = useState("");
  const [options, setOptions] = useState<ConvertOptions>(DEFAULT_CONVERT_OPTIONS);

  const output = useMemo(() => convertList(input, options), [input, options]);

  const patchOptions = useCallback((patch: Partial<ConvertOptions>) => {
    setOptions((prev) => ({ ...prev, ...patch }));
  }, []);

  const optionsUi = (
    <FormGrid columns={1}>
      <Fieldset legend="Options">
        <FormGrid>
          <Switch
            label="Trim list items"
            checked={options.trimItems}
            onChange={(event) => patchOptions({ trimItems: event.target.checked })}
          />
          <Switch
            label="Remove duplicates"
            checked={options.removeDuplicates}
            onChange={(event) => patchOptions({ removeDuplicates: event.target.checked })}
          />
          <Switch
            label="Convert to lowercase"
            checked={options.lowerCase}
            onChange={(event) => patchOptions({ lowerCase: event.target.checked })}
          />
          <Switch
            label="Keep line breaks"
            checked={options.keepLineBreaks}
            onChange={(event) => patchOptions({ keepLineBreaks: event.target.checked })}
          />
          <Switch
            label="Reverse list"
            checked={options.reverseList}
            onChange={(event) => {
              const reverseList = event.target.checked;
              patchOptions({
                reverseList,
                ...(reverseList ? { sortList: null } : {}),
              });
            }}
          />
        </FormGrid>
        <FormGrid>
          <Select
            label="Sort list"
            value={options.sortList ?? ""}
            disabled={options.reverseList}
            options={SORT_OPTIONS}
            onChange={(event) => {
              const raw = event.target.value;
              const sortList: SortOrder = raw === "asc" || raw === "desc" ? raw : null;
              patchOptions({ sortList });
            }}
          />
          <Input
            label="Separator"
            value={options.separator}
            placeholder=","
            onChange={(event) => patchOptions({ separator: event.target.value })}
          />
        </FormGrid>
      </Fieldset>
      <Fieldset legend="Wrap item">
        <FormGrid>
          <Input
            label="Item prefix"
            value={options.itemPrefix}
            placeholder="Item prefix"
            onChange={(event) => patchOptions({ itemPrefix: event.target.value })}
          />
          <Input
            label="Item suffix"
            value={options.itemSuffix}
            placeholder="Item suffix"
            onChange={(event) => patchOptions({ itemSuffix: event.target.value })}
          />
        </FormGrid>
      </Fieldset>
      <Fieldset legend="Wrap list">
        <FormGrid>
          <Input
            label="List prefix"
            value={options.listPrefix}
            placeholder="List prefix"
            onChange={(event) => patchOptions({ listPrefix: event.target.value })}
          />
          <Input
            label="List suffix"
            value={options.listSuffix}
            placeholder="List suffix"
            onChange={(event) => patchOptions({ listSuffix: event.target.value })}
          />
        </FormGrid>
      </Fieldset>
    </FormGrid>
  );

  return (
    <ToolFrame>
      <Panel
        title="List converter"
        description="Paste a newline-separated list, then trim, dedupe, sort, wrap, and join it live in the browser."
      >
        <TransformPanel
          input={{
            label: "Your input data",
            value: input,
            onChange: setInput,
            placeholder: "Paste your input data here...",
            mono: true,
            rows: 8,
          }}
          options={optionsUi}
          output={{ label: "Your transformed data", value: output, mono: true, rows: 8 }}
        />
      </Panel>
    </ToolFrame>
  );
}
