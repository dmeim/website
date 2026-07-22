import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
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
  ToolWorkspace,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
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
  const [actionStatus, setActionStatus] = useState("");

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

  const removeMultiItem = useCallback((key: string, index: number) => {
    setMetadata((prev) => {
      const list = asList(prev[key]);
      if (list.length <= 1) {
        return { ...prev, [key]: [""] };
      }
      return { ...prev, [key]: list.filter((_, i) => i !== index) };
    });
  }, []);

  const copyTags = useCallback(async () => {
    if (!metaTags) {
      setActionStatus("Nothing to copy yet — fill in at least one field.");
      return;
    }
    try {
      await copyTextToClipboard(metaTags);
      setActionStatus("Meta tags copied to the clipboard.");
    } catch {
      setActionStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [metaTags]);

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
        <ToolSelect
          key={element.key}
          id={fieldId}
          label={element.label}
          full
          value={asString(metadata[element.key])}
          onChange={(event) => setField(element.key, event.target.value)}
        >
          {renderSelectOptions(element)}
        </ToolSelect>
      );
    }

    if (element.type === "input-multiple") {
      const values = asList(metadata[element.key]);
      return (
        <div key={element.key} className="og-multi tool-field--full">
          <span className="og-multi__label">{element.label}</span>
          <div className="og-multi__rows">
            {values.map((value, index) => (
              <div key={`${element.key}-${index}`} className="og-multi__row">
                <ToolInput
                  id={`${fieldId}-${index}`}
                  label={`${element.label} ${index + 1}`}
                  full
                  value={value}
                  placeholder={element.placeholder}
                  onChange={(event) =>
                    updateMultiItem(element.key, index, event.target.value)
                  }
                  fieldClassName="og-multi__input"
                />
                <ToolButton
                  type="button"
                  variant="ghost"
                  className="og-multi__remove"
                  aria-label={`Remove ${element.label} ${index + 1}`}
                  disabled={values.length <= 1}
                  onClick={() => removeMultiItem(element.key, index)}
                >
                  Remove
                </ToolButton>
              </div>
            ))}
          </div>
          <ToolActionRow>
            <ToolButton
              type="button"
              variant="ghost"
              onClick={() => addMultiItem(element.key)}
            >
              Add {element.label.toLowerCase()}
            </ToolButton>
          </ToolActionRow>
        </div>
      );
    }

    return (
      <ToolInput
        key={element.key}
        id={fieldId}
        label={element.label}
        full
        value={asString(metadata[element.key])}
        placeholder={element.placeholder}
        onChange={(event) => setField(element.key, event.target.value)}
      />
    );
  };

  return (
    <ToolIsland className="og-tool">
      <ToolWorkspace className="og-tool__workspace" stagger>
        <ToolPanel labelledBy="og-fields-heading" className="og-tool__panel">
          <ToolSectionHeading
            title="Meta fields"
            titleId="og-fields-heading"
            description={
              <ToolHint>
                Fill the fields below to generate Open Graph and Twitter meta tags
                for your page.
              </ToolHint>
            }
          />

          {sections.map((section) => (
            <ToolNested key={section.name} title={section.name} className="og-section">
              <ToolFormGrid>
                {section.elements.map((element) =>
                  renderElement(element, section.name),
                )}
              </ToolFormGrid>
            </ToolNested>
          ))}
        </ToolPanel>

        <ToolPanel labelledBy="og-output-heading" className="og-tool__output">
          <ToolSectionHeading
            title="Your meta tags"
            titleId="og-output-heading"
            description={
              <ToolHint>
                Paste these into your document <code>&lt;head&gt;</code>. Empty
                fields are omitted.
              </ToolHint>
            }
          />

          <ToolTextarea
            id="og-meta-output"
            label="Generated HTML"
            full
            code
            readOnly
            rows={16}
            value={metaTags}
            className="og-output"
            aria-live="polite"
            placeholder="Fill in fields to generate meta tags…"
          />

          <ToolActionRow>
            <ToolButton type="button" variant="primary" onClick={() => void copyTags()}>
              Copy meta tags
            </ToolButton>
          </ToolActionRow>

          {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
        </ToolPanel>
      </ToolWorkspace>
    </ToolIsland>
  );
}
