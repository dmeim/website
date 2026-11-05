import { useCallback, useMemo, useState } from "react";

import {
  Button,
  CopyButton,
  Fieldset,
  FormGrid,
  IconButton,
  Input,
  OutputField,
  Panel,
  Select,
  ToolFrame,
} from "@/ui/react";
import {
  DEFAULT_OG_METADATA,
  buildOgMetaTags,
  clearTypeSchemaKeys,
  getActiveSections,
  type MetaFieldValue,
  type OGSchemaTypeElement,
  type OGSelectGroup,
  type OGSelectOption,
  type OgFormMetadata,
} from "@/lib/tools/og-meta-generator";

import "./OgMetaGenerator.css";

function isSelectGroup(
  option: OGSelectOption | OGSelectGroup,
): option is OGSelectGroup {
  return "type" in option && option.type === "group";
}

function asString(value: MetaFieldValue | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function asList(value: MetaFieldValue | undefined): string[] {
  if (Array.isArray(value)) return value.length > 0 ? value : [""];
  if (typeof value === "string" && value.length > 0) return [value];
  return [""];
}

export default function OgMetaGenerator() {
  const [metadata, setMetadata] = useState<OgFormMetadata>(DEFAULT_OG_METADATA);

  const pageType = asString(metadata.type) || "website";
  const sections = useMemo(() => getActiveSections(pageType), [pageType]);
  const metaTags = useMemo(() => buildOgMetaTags(metadata), [metadata]);

  const setField = useCallback((key: string, value: MetaFieldValue) => {
    setMetadata((prev) => {
      if (key === "type") {
        const nextType = typeof value === "string" ? value : asString(value);
        const previousType = asString(prev.type) || "website";
        if (nextType === previousType) {
          return { ...prev, type: nextType };
        }
        return {
          ...clearTypeSchemaKeys(prev, previousType),
          type: nextType,
        };
      }
      return { ...prev, [key]: value };
    });
  }, []);

  const updateMultiItem = useCallback(
    (key: string, index: number, value: string) => {
      setMetadata((prev) => {
        const list = asList(prev[key]);
        const next = [...list];
        next[index] = value;
        return { ...prev, [key]: next };
      });
    },
    [],
  );

  const addMultiItem = useCallback((key: string) => {
    setMetadata((prev) => {
      const list = asList(prev[key]);
      return { ...prev, [key]: [...list, ""] };
    });
  }, []);

  const moveMultiItem = useCallback((key: string, index: number, offset: -1 | 1) => {
    setMetadata((prev) => {
      const next = [...asList(prev[key])];
      const target = index + offset;
      const [moved] = next.splice(index, 1);
      if (moved === undefined || target < 0 || target > next.length) return prev;
      next.splice(target, 0, moved);
      return { ...prev, [key]: next };
    });
  }, []);

  const removeMultiItem = useCallback((key: string, index: number) => {
    setMetadata((prev) => {
      const list = asList(prev[key]);
      if (list.length <= 1) {
        return { ...prev, [key]: [""] };
      }
      return { ...prev, [key]: list.filter((_, i) => i !== index) };
    });
  }, []);

  const renderSelectOptions = (element: OGSchemaTypeElement & { type: "select" }) =>
    element.options.map((option) => {
      if (isSelectGroup(option)) {
        return (
          <optgroup key={option.key} label={option.label}>
            {option.children.map((child) => (
              <option key={child.value} value={child.value}>
                {child.label}
              </option>
            ))}
          </optgroup>
        );
      }
      return (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      );
    });

  const renderElement = (element: OGSchemaTypeElement, sectionName: string) => {
    const fieldId = `og-${sectionName}-${element.key}`.replace(/[^a-zA-Z0-9_-]/g, "-");

    if (element.type === "select") {
      return (
        <Select
          key={element.key}
          id={fieldId}
          label={element.label}
          span="full"
          value={asString(metadata[element.key])}
          onChange={(event) => setField(element.key, event.target.value)}
        >
          {renderSelectOptions(element)}
        </Select>
      );
    }

    if (element.type === "input-multiple") {
      const values = asList(metadata[element.key]);
      return (
        <Fieldset key={element.key} legend={element.label} className="og-multi">
          {values.map((value, index) => (
            <div key={`${element.key}-${index}`} className="og-multi__row">
              <Input
                id={`${fieldId}-${index}`}
                label={`${element.label} ${index + 1}`}
                labelHidden
                value={value}
                placeholder={element.placeholder}
                onChange={(event) => updateMultiItem(element.key, index, event.target.value)}
              />
              <IconButton
                icon="caret-down"
                className="og-multi__move-up"
                label={`Move ${element.label} ${index + 1} up`}
                disabled={index === 0}
                onClick={() => moveMultiItem(element.key, index, -1)}
              />
              <IconButton
                icon="caret-down"
                label={`Move ${element.label} ${index + 1} down`}
                disabled={index === values.length - 1}
                onClick={() => moveMultiItem(element.key, index, 1)}
              />
              <IconButton
                icon="x"
                label={`Remove ${element.label} ${index + 1}`}
                disabled={values.length <= 1}
                onClick={() => removeMultiItem(element.key, index)}
              />
            </div>
          ))}
          <div>
            <Button variant="ghost" size="sm" iconStart="plus" onClick={() => addMultiItem(element.key)}>
              Add {element.label.toLowerCase()}
            </Button>
          </div>
        </Fieldset>
      );
    }

    return (
      <Input
        key={element.key}
        id={fieldId}
        label={element.label}
        span="full"
        clearable
        value={asString(metadata[element.key])}
        placeholder={element.placeholder}
        onChange={(event) => setField(element.key, event.target.value)}
      />
    );
  };

  return (
    <ToolFrame layout="split" stagger>
      <Panel
        title="Meta fields"
        titleId="og-fields-heading"
        description="Fill the fields below to generate Open Graph and Twitter meta tags for your page."
      >
        {sections.map((section) => (
          <Fieldset key={section.name} legend={section.name}>
            <FormGrid columns={1}>
              {section.elements.map((element) => renderElement(element, section.name))}
            </FormGrid>
          </Fieldset>
        ))}
      </Panel>

      <Panel
        title="Your meta tags"
        titleId="og-output-heading"
        description={
          <>
            Paste these into your document <code>&lt;head&gt;</code>. Empty fields are omitted.
          </>
        }
        actions={<CopyButton variant="primary" value={metaTags} label="Copy meta tags" disabled={!metaTags} />}
      >
        <OutputField
          id="og-meta-output"
          label="Generated HTML"
          multiline
          rows={16}
          value={metaTags}
          copy={false}
          placeholder="Fill in fields to generate meta tags…"
        />
      </Panel>
    </ToolFrame>
  );
}
