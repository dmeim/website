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
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import { slugifyString } from "@/lib/tools/slugify-string";

import "./SlugifyString.css";

export default function SlugifyString() {
  const [input, setInput] = useState("");
  const [actionStatus, setActionStatus] = useState("");

  const slug = useMemo(() => slugifyString(input), [input]);

  const copySlug = useCallback(async () => {
    if (!slug) {
      setActionStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(slug);
      setActionStatus("Slug copied.");
    } catch {
      setActionStatus("Copy failed. Select the slug and copy it manually.");
    }
  }, [slug]);

  return (
    <ToolIsland className="slugify-tool">
      <ToolPanel labelledBy="slugify-heading" className="slugify-tool__panel">
        <ToolSectionHeading
          title="Slugify string"
          titleId="slugify-heading"
          description={
            <ToolHint>
              Make a string URL, filename, and id safe — lowercase, hyphenated,
              with Unicode transliteration.
            </ToolHint>
          }
        />

        <ToolTextarea
          id="slugify-input"
          label="Your string to slugify"
          full
          rows={3}
          value={input}
          placeholder="Put your string here (ex: My file path)"
          onChange={(event) => setInput(event.target.value)}
          autoFocus
        />

        <ToolTextarea
          id="slugify-output"
          label="Your slug"
          full
          code
          readOnly
          rows={3}
          value={slug}
          placeholder="Your slug will be generated here (ex: my-file-path)"
          className="slugify-output"
          aria-live="polite"
        />

        <ToolActionRow>
          <ToolButton type="button" onClick={() => void copySlug()} disabled={!slug}>
            Copy slug
          </ToolButton>
        </ToolActionRow>

        {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
      </ToolPanel>
    </ToolIsland>
  );
}
