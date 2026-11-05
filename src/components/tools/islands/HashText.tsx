import { useMemo, useState } from "react";

import { useQueryState } from "@/components/tools/use-persisted-state";
import { OutputField, Panel, Select, Textarea, ToolFrame } from "@/ui/react";
import {
  HASH_ALGORITHMS,
  HASH_ENCODING_DEFAULT,
  HASH_ENCODING_OPTIONS,
  type HashEncoding,
  hashAll,
  isHashEncoding,
  normalizeHashEncoding,
} from "@/lib/tools/hash-text";

export default function HashText() {
  const [clearText, setClearText] = useState("");
  const [encoding, setEncoding] = useQueryState<HashEncoding>("encoding", HASH_ENCODING_DEFAULT, isHashEncoding);

  const safeEncoding = normalizeHashEncoding(encoding);
  const digests = useMemo(() => hashAll(clearText, safeEncoding), [clearText, safeEncoding]);

  return (
    <ToolFrame layout="split">
      <Panel title="Input" titleId="ht-input-heading" description="Enter text, pick a digest encoding, then copy any algorithm output.">
        <Textarea
          id="ht-clear-text"
          label="Your text to hash"
          rows={3}
          value={clearText}
          placeholder="Your string to hash…"
          onChange={(event) => setClearText(event.target.value)}
          autoFocus
        />
        <Select
          id="ht-encoding"
          label="Digest encoding"
          value={safeEncoding}
          onChange={(event) => setEncoding(normalizeHashEncoding(event.target.value))}
          options={HASH_ENCODING_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
        />
      </Panel>
      <Panel title="Digests" titleId="ht-output-heading" description="Updates as you type. Copy the digest you need.">
        {HASH_ALGORITHMS.map((algo) => (
          <OutputField key={algo} id={`ht-digest-${algo}`} label={algo} multiline rows={2} value={digests[algo]} />
        ))}
      </Panel>
    </ToolFrame>
  );
}
