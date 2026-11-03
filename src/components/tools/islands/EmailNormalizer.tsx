import { useCallback, useMemo, useState } from "react";

import { Button, Panel, ToolFrame, TransformPanel } from "@/ui/react";
import { DEFAULT_RAW_EMAILS, normalizeEmails } from "@/lib/tools/email-normalizer";

export default function EmailNormalizer() {
  const [rawEmails, setRawEmails] = useState(DEFAULT_RAW_EMAILS);

  const normalized = useMemo(() => normalizeEmails(rawEmails), [rawEmails]);

  const clearEmails = useCallback(() => {
    setRawEmails(DEFAULT_RAW_EMAILS);
  }, []);

  return (
    <ToolFrame>
      <Panel
        title="Email normalizer"
        description="Paste emails one per line to normalize them for comparison and deduplication."
      >
        <TransformPanel
          input={{
            label: "Raw emails to normalize",
            value: rawEmails,
            onChange: setRawEmails,
            placeholder: "Put your emails here (one per line)…",
            mono: true,
            rows: 6,
          }}
          actions={
            <Button type="button" iconStart="arrows-clockwise" onClick={clearEmails}>
              Clear emails
            </Button>
          }
          output={{ label: "Normalized emails", value: normalized, mono: true, rows: 6 }}
        />
      </Panel>
    </ToolFrame>
  );
}
